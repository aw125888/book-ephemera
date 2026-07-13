from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Optional
from uuid import uuid4
import json
import os

from redis import Redis


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

    embedding_started: bool = False
    error: Optional[str] = None

    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


redis_client = Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)


def job_key(job_id: str) -> str:
    return f"job:{job_id}"


def save_job(job: Job) -> None:
    redis_client.set(job_key(job.id), json.dumps(asdict(job)))


def get_job(job_id: str) -> Optional[Job]:
    raw = redis_client.get(job_key(job_id))
    if not raw:
        return None
    data = json.loads(raw)
    return Job(**data)


def create_job() -> Job:
    job = Job(id=str(uuid4()))
    save_job(job)
    return job


def build_combined_text(job: Job) -> str:
    parts = list(job.paragraphs)

    if job.user_text.strip():
        parts.append(job.user_text.strip())

    return " ".join(part.strip() for part in parts if part.strip())