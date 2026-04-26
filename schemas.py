from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional

class ResearchPlan(BaseModel):
    goal: str
    queries: List[str]

class ScrapedPage(BaseModel):
    url: str
    title: str
    content: str

class RawData(BaseModel):
    results: List[ScrapedPage]
    failed_urls: List[str] = []

class FinalReport(BaseModel):
    title: str
    summary: str
    markdown_content: str
    sources: List[str]
