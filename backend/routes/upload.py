from pathlib import Path
from typing import Optional

import shutil
from pydantic import BaseModel
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from backend.models.jobs import create_job, get_job, save_job, build_combined_text
from backend.services.embedding_service import recommend_book
from backend.services.openai_service import describe_image_semantic_fingerprint

router = APIRouter(prefix="/api", tags=["uploads"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_ROOT = BASE_DIR / "uploads"


class TextRequest(BaseModel):
    text: str


def reset_job_for_rerun(job) -> None:
    job.status = "collecting"
    job.embedding_started = False
    job.combined_text = ""
    job.title = None
    job.author = None
    job.cover_image = None
    job.goodreads_url = None
    job.error = None
    save_job(job)


def run_embedding(job_id: str) -> None:
    job = get_job(job_id)
    if not job:
        return

    try:
        result = recommend_book(job.combined_text)
        job.title = result["book_title"]
        job.author = result["author"]
        job.cover_image = result["cover_image"]
        job.goodreads_url = result["goodreads_url"]
        job.status = "ready"
        save_job(job)
    except Exception as e:
        job.status = "error"
        job.error = str(e)
        save_job(job)


def maybe_start_embedding(job_id: str, background_tasks: Optional[BackgroundTasks] = None) -> None:
    job = get_job(job_id)
    if not job:
        return

    if len([p for p in job.paragraphs if p.strip()]) < 3:
        return

    if not job.user_text.strip():
        return

    if job.embedding_started:
        return

    job.combined_text = build_combined_text(job)
    job.status = "embedding"
    job.embedding_started = True
    save_job(job)

    if background_tasks is not None:
        background_tasks.add_task(run_embedding, job_id)
    else:
        run_embedding(job_id)


def process_image(job_id: str, slot: int, file_path: str) -> None:
    job = get_job(job_id)
    if not job:
        return

    try:
        job.status = "processing"
        save_job(job)
        paragraph = describe_image_semantic_fingerprint(file_path)

        while len(job.paragraphs) < slot:
            job.paragraphs.append("")

        job.paragraphs[slot - 1] = paragraph
        save_job(job)

        maybe_start_embedding(job_id)

        if job.status != "embedding" and job.status != "ready":
            job.status = "collecting"
            save_job(job)

    except Exception as e:
        job.status = "error"
        job.error = str(e)


@router.post("/jobs")
async def new_job():
    job = create_job()
    (UPLOAD_ROOT / job.id).mkdir(parents=True, exist_ok=True)
    return {"job_id": job.id, "status": job.status}


@router.post("/jobs/{job_id}/image")
async def upload_image(
    job_id: str,
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    slot: Optional[int] = None,
):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job_folder = UPLOAD_ROOT / job_id
    job_folder.mkdir(parents=True, exist_ok=True)

    if slot is None:
        slot = len(job.images) + 1

    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"image_{slot}{suffix}"
    file_path = job_folder / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_path_str = str(file_path)

    reset_job_for_rerun(job)

    if len(job.images) < slot:
        while len(job.images) < slot - 1:
            job.images.append("")
        job.images.append(image_path_str)
    else:
        job.images[slot - 1] = image_path_str
    
    save_job(job)

    background_tasks.add_task(process_image, job_id, slot, image_path_str)

    return {
        "ok": True,
        "job_id": job_id,
        "slot": slot,
        "saved_as": filename,
        "path": image_path_str,
    }


@router.post("/jobs/{job_id}/text")
async def upload_text(job_id: str, request: TextRequest, background_tasks: BackgroundTasks):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.user_text = request.text.strip()
    save_job(job)
    reset_job_for_rerun(job)

    maybe_start_embedding(job_id, background_tasks)

    return {
        "ok": True,
        "job_id": job_id,
        "words": len(request.text.split()),
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.id,
        "status": job.status,
        "images": job.images,
        "paragraphs": job.paragraphs,
        "user_text": job.user_text,
        "combined_text": job.combined_text,
        "title": job.title,
        "cover_image": job.cover_image,
        "goodreads_url": job.goodreads_url, 
        "error": job.error,
        "created_at": job.created_at,
    }