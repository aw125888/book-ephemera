from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4


@dataclass
class Job:
    id: str
    status: str = "collecting"
    images: List[str] = field(default_factory=list)
    paragraphs: List[str] = field(default_factory=list)
    user_text: str = ""
    combined_text: str = ""
    title: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    goodreads_url: Optional[str] = None
    error: Optional[str] = None
    embedding_started: bool = False
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


jobs: Dict[str, Job] = {}


def create_job():
    job = Job(id=str(uuid4()))
    jobs[job.id] = job
    return job


def get_job(job_id: str):
    return jobs.get(job_id)


def build_combined_text(job: Job) -> str:
    parts = list(job.paragraphs)
    if job.user_text.strip():
        parts.append(job.user_text.strip())
    return " ".join(part.strip() for part in parts if part.strip())