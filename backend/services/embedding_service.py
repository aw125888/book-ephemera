from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
BOOK_DIR = ROOT / "data" / "book"
MODEL_NAME = "BAAI/bge-reranker-v2-gemma"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,
).to("cuda")
model.eval()

YES_TOKEN_ID = tokenizer("Yes", add_special_tokens=False)["input_ids"][0]


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
                "source_path": str(path),
                "candidate_text": flatten_book(data),
            }
        )

    return books


def score_pair(query: str, passage: str) -> float:
    prompt = (
        "Given a query A and a passage B, determine whether the passage contains "
        "an answer to the query by providing a prediction of either 'Yes' or 'No'.\n\n"
        f"A: {query}\n"
        f"B: {passage}\n"
        "Answer:"
    )

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=4096,
    ).to(model.device)

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[:, -1, :]

        if YES_TOKEN_ID >= logits.shape[-1]:
            raise ValueError("Yes token id is out of range for the model logits.")

        return float(logits[0, YES_TOKEN_ID].item())


def rank_books(query: str) -> List[Dict[str, Any]]:
    books = load_books()
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
                "source_path": book["source_path"],
            }
        )

    return results


def recommend_book(query: str) -> Dict[str, Any]:
    return rank_books(query)[0]