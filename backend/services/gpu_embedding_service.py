from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
BOOK_DIR = ROOT / "data" / "book"
MODEL_NAME = "BAAI/bge-reranker-v2-m3"

device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    torch_dtype=dtype,
).to(device)
model.eval()


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def join_list(value: Any) -> str:
    if isinstance(value, list):
        return ", ".join(str(x) for x in value)
    if value is None:
        return ""
    return str(value)


def flatten_book(book: Dict[str, Any]) -> str:
    fp = book.get("fingerprint", {})

    parts = [
        f"Title: {book.get('book_title', '')}",
        f"Author: {book.get('author', '')}",
        f"Goodreads URL: {book.get('goodreads_url', '')}",
        f"Colors: {join_list(fp.get('colors', []))}",
        f"Atmosphere: {join_list(fp.get('atmosphere', []))}",
        f"Things: {join_list(fp.get('things', []))}",
        f"Emotional tones: {join_list(fp.get('emotional_tones', []))}",
        f"Themes: {join_list(fp.get('themes', []))}",
        f"Voice: {join_list(fp.get('voice', []))}",
    ]

    return "\n".join(part for part in parts if part.split(": ", 1)[-1].strip())


def load_books() -> List[Dict[str, Any]]:
    books: List[Dict[str, Any]] = []

    for path in sorted(BOOK_DIR.glob("*.json")):
        data = load_json(path)

        cover_image = data.get("cover") or data.get("cover_image")
        if not cover_image:
            cover_image = f"{path.stem}.jpg"

        books.append(
            {
                "book_title": data.get("book_title", path.stem),
                "author": data.get("author", ""),
                "cover_image": cover_image,
                "goodreads_url": data.get("goodreads_url", ""),
                "source_path": str(path),
                "candidate_text": flatten_book(data),
            }
        )

    return books


def score_pair(query: str, passage: str) -> float:
    inputs = tokenizer(
        query,
        passage,
        return_tensors="pt",
        truncation=True,
        max_length=1024,
    ).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        score = outputs.logits.squeeze(-1).item()

    return float(score)


books = load_books()


def rank_books(query: str) -> List[Dict[str, Any]]:
    if not books:
        raise ValueError(f"No books found in {BOOK_DIR}")

    scored = []
    for book in books:
        score = score_pair(query, book["candidate_text"])
        scored.append((score, book))

    ranked = sorted(scored, key=lambda item: item[0], reverse=True)

    

    results: List[Dict[str, Any]] = []
    for rank, (score, book) in enumerate(ranked, start=1):
        results.append(
            {
                "rank": rank,
                "score": float(score),
                "book_title": book["book_title"],
                "author": book["author"],
                "cover_image": book["cover_image"],
                "goodreads_url": book["goodreads_url"],
                "source_path": book["source_path"],
            }
        )

    return results


def recommend_book(query: str) -> Dict[str, Any]:
    return rank_books(query)[0]