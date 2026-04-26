import sys
import json
from agents import PlannerAgent, DataGatherAgent, ReportAgent, log_progress

class SequentialAgent:
    """
    Orchestrates the flow of data through a series of agents.
    """
    def __init__(self, agents: list):
        self.agents = agents

    def execute(self, initial_input: str, length: str = "Medium", include_charts: bool = False):
        current_data = initial_input
        
        # Word count mapping
        length_map = {
            "Short": "approximately 300 words",
            "Medium": "approximately 600 words",
            "Long": "at least 1000 words, being extremely detailed"
        }
        word_count_target = length_map.get(length, "approximately 600 words")

        for i, agent in enumerate(self.agents):
            input_str = current_data if isinstance(current_data, str) else current_data.model_dump_json()
            
            # Special handling for Synthesizer to control length and charts
            if agent.name == "Synthesizer":
                chart_instruction = ""
                if include_charts:
                    chart_instruction = (
                        "\n\nIMPORTANT: Since 'Include Charts' is enabled, you MUST identify quantitative data "
                        "(like trends, statistics, or comparisons) and include a Chart JSON block in the markdown. "
                        "The block MUST look exactly like this:\n"
                        "```chart\n"
                        "{\n"
                        "  \"type\": \"bar\", // or \"line\" or \"pie\"\n"
                        "  \"title\": \"Chart Title\",\n"
                        "  \"data\": [{\"name\": \"Category\", \"value\": 100}, ...]\n"
                        "}\n"
                        "```\n"
                    )

                custom_instruction = (
                    f"You are a master technical writer. Synthesize the provided data into a {length.upper()} "
                    f"Markdown report ({word_count_target}). Start with a # Title and a ## Summary, "
                    "followed by detailed sections and a ## Sources section at the end. "
                    "Use multiple sections (##), bullet points, and deep analysis of the provided content. "
                    "IMPORTANT: You MUST leave one completely blank line BEFORE and AFTER every list, "
                    "every group of links, and between every single paragraph. "
                    "Every list item MUST start on its own new line with a standard Markdown bullet point (e.g., * Item). "
                    "ONLY use the provided data. Do not invent facts. "
                    f"Output ONLY the raw markdown text.{chart_instruction}"
                )
                current_data = agent.run(input_str, override_instruction=custom_instruction)
            else:
                current_data = agent.run(input_str)
        
        return current_data

def main():
    if len(sys.argv) < 2:
        log_progress("Usage: python main.py 'Your research topic' [Short|Medium|Long] [true|false]")
        sys.exit(1)

    topic = sys.argv[1]
    length = sys.argv[2] if len(sys.argv) > 2 else "Medium"
    include_charts = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
    
    # Define the pipeline
    workflow = SequentialAgent([
        PlannerAgent,
        DataGatherAgent,
        ReportAgent
    ])

    log_progress(f"--- Starting Research: {topic} ({length} length, charts: {include_charts}) ---")
    
    try:
        # Run the multi-agent orchestration
        final_markdown = workflow.execute(topic, length, include_charts)
        
        # Output as a standard JSON structure for the web app
        result = {
            "topic": topic,
            "length": length,
            "markdown_content": final_markdown,
            "charts_enabled": include_charts
        }
        print(json.dumps(result))
            
    except Exception as e:
        error_msg = str(e)
        if "rate_limit_exceeded" in error_msg:
            error_msg = "Rate limit reached. Please wait a few minutes before trying again."
        
        log_progress(f"An error occurred during orchestration: {error_msg}")
        # Output error as JSON
        print(json.dumps({"error": error_msg}))
        sys.exit(1)

if __name__ == "__main__":
    main()
