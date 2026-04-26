import os
import json
import sys
import re
from groq import Groq
from pydantic import BaseModel
from typing import Type, Any, List
from dotenv import load_dotenv

from schemas import ResearchPlan, RawData, FinalReport, ScrapedPage
from tools import web_search_and_scrape, google_image_search

# Load environment variables
load_dotenv(dotenv_path=".env")
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

def log_progress(message: str):
    """Write progress messages to stderr so stdout stays clean for JSON."""
    sys.stderr.write(f"{message}\n")
    sys.stderr.flush()

class LlmAgent:
    def __init__(
        self, 
        name: str, 
        model_name: str, 
        system_instruction: str, 
        tools: list = None, 
        response_schema: Type[BaseModel] = None
    ):
        self.name = name
        self.system_instruction = system_instruction
        self.response_schema = response_schema
        self.model_id = model_name
        self.tools = tools

    def run(self, input_data: str, override_instruction: str = None) -> Any:
        log_progress(f"[{self.name}] Processing...")
        
        # Use the override if provided (this allows main.py to inject dynamic instructions like charts)
        instruction = override_instruction if override_instruction else self.system_instruction
        
        messages = [
            {"role": "system", "content": instruction},
            {"role": "user", "content": input_data}
        ]
        
        groq_tools = None
        if self.tools:
            groq_tools = []
            for t in self.tools:
                if t.__name__ == "web_search_and_scrape":
                    groq_tools.append({
                        "type": "function",
                        "function": {
                            "name": "web_search_and_scrape",
                            "description": "Performs a Wikipedia search and scrapes detailed content.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "query": {"type": "string", "description": "The search query"}
                                },
                                "required": ["query"]
                            }
                        }
                    })
                elif t.__name__ == "google_image_search":
                    groq_tools.append({
                        "type": "function",
                        "function": {
                            "name": "google_image_search",
                            "description": "Searches for relevant images or charts on Google Images.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "query": {"type": "string", "description": "The image search query (e.g. 'Bitcoin price chart 2024')"}
                                },
                                "required": ["query"]
                            }
                        }
                    })

        try:
            params = {
                "model": self.model_id,
                "messages": messages,
            }
            if groq_tools:
                params["tools"] = groq_tools
                params["tool_choice"] = "auto"
            
            if self.response_schema and not groq_tools:
                params["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**params)
            response_message = response.choices[0].message
            
            if response_message.tool_calls:
                messages.append(response_message)
                for tool_call in response_message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if function_name == "web_search_and_scrape":
                        log_progress(f"[{self.name}] Tool Call: {function_name}({function_args['query']})")
                        tool_result = web_search_and_scrape(function_args["query"])
                    elif function_name == "google_image_search":
                        log_progress(f"[{self.name}] Tool Call: {function_name}({function_args['query']})")
                        images = google_image_search(function_args["query"])
                        tool_result = json.dumps(images)
                    else:
                        tool_result = "Unknown tool"
                        
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": tool_result
                    })
                
                final_params = {
                    "model": self.model_id,
                    "messages": messages,
                }
                if self.response_schema:
                    final_params["response_format"] = {"type": "json_object"}
                    
                final_response = client.chat.completions.create(**final_params)
                content = final_response.choices[0].message.content
            else:
                content = response_message.content

            if self.response_schema:
                try:
                    clean_content = content.strip()
                    clean_content = re.sub(r'^```json\s*', '', clean_content)
                    clean_content = re.sub(r'\s*```$', '', clean_content)
                    clean_content = clean_content.strip()
                    
                    data = json.loads(clean_content)
                    
                    def find_and_fix_match(obj, schema):
                        if isinstance(obj, dict):
                            required_fields = [f for f, m in schema.model_fields.items() if m.is_required()]
                            if all(f in obj for f in required_fields):
                                if 'sources' in obj and isinstance(obj['sources'], list):
                                    obj['sources'] = [s['url'] if isinstance(s, dict) and 'url' in s else str(s) for s in obj['sources']]
                                return obj
                            for key in ['report', 'FinalReport', 'data', 'result', 'research_plan', 'RawData']:
                                if key in obj and isinstance(obj[key], dict):
                                    res = find_and_fix_match(obj[key], schema)
                                    if res: return res
                            for v in obj.values():
                                if isinstance(v, (dict, list)):
                                    res = find_and_fix_match(v, schema)
                                    if res: return res
                        elif isinstance(obj, list):
                            for item in obj:
                                res = find_and_fix_match(item, schema)
                                if res: return res
                        return None

                    match = find_and_fix_match(data, self.response_schema)
                    if match:
                        return self.response_schema.model_validate(match)
                    return self.response_schema.model_validate(data)
                except Exception as e:
                    log_progress(f"[{self.name}] JSON Parse/Validation Error: {e}")
                    return self.response_schema.model_validate_json(content)
            
            return content

        except Exception as e:
            log_progress(f"[{self.name}] Error: {e}")
            raise e

# 1. PlannerAgent
PlannerAgent = LlmAgent(
    name="Planner",
    model_name="llama-3.1-8b-instant",
    system_instruction=(
        "You are an expert research planner. Break a topic into 5-7 Wikipedia queries. "
        "Return JSON: {\"goal\": \"...\", \"queries\": [\"...\"]}"
    ),
    response_schema=ResearchPlan
)

# 2. DataGatherAgent
DataGatherAgent = LlmAgent(
    name="DataGatherer",
    model_name="llama-3.1-8b-instant",
    system_instruction=(
        "You are a browser agent. Use 'web_search_and_scrape' for EACH query. "
        "Return JSON: {\"results\": [{\"url\": \"...\", \"title\": \"...\", \"content\": \"...\"}], \"failed_urls\": []}"
    ),
    tools=[web_search_and_scrape],
    response_schema=RawData
)

# 3. ReportAgent
ReportAgent = LlmAgent(
    name="Synthesizer",
    model_name="llama-3.3-70b-versatile",
    system_instruction=(
        "You are a master technical writer. Your task is to produce a deep research report based on the provided data. "
        "Strictly follow the markdown and structural instructions provided in the execution prompt."
    )
)
