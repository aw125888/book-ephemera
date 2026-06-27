import json
from pathlib import Path
from FlagEmbedding import FlagLLMReranker

# ----------------------------
# CONFIG
# ----------------------------
ROOT = Path(__file__).resolve().parent.parent

IMAGE_DIR = ROOT / "data" / "image_descriptions" / "images"
BOOK_DIR = ROOT / "data" / "book"
MEMORY_PATH = ROOT / "data" / "train_mems" / "mem2.json"

IMAGE_IDS = ["0004", "0005", "0006"]

reranker = FlagLLMReranker(
    "BAAI/bge-reranker-v2-gemma",
    use_fp16=True,
)

# ----------------------------
# HELPERS
# ----------------------------
def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def extract_fingerprint_text(data: dict) -> str:
    fp = data.get("fingerprint")

    if isinstance(fp, str):
        return fp

    if isinstance(fp, dict):
        parts = []
        for key, value in fp.items():
            if isinstance(value, list):
                parts.append(f"{key}: {', '.join(str(x) for x in value)}")
            else:
                parts.append(f"{key}: {value}")
        return "\n".join(parts)

    raise ValueError("Could not find a usable fingerprint in JSON.")

def load_image_query(image_dir: Path, image_ids: list[str]) -> str:
    fingerprints = []
    for image_id in image_ids:
        path = image_dir / f"{image_id}.json"
        data = load_json(path)
        fingerprints.append(extract_fingerprint_text(data))
    return "\n\n".join(fingerprints)

def load_memory_query(memory_path: Path) -> str:
    data = load_json(memory_path)
    return extract_fingerprint_text(data)

def join_list(value):
    if isinstance(value, list):
        return ", ".join(str(x) for x in value)
    return str(value)

def flatten_book(book: dict) -> str:
    fp = book["fingerprint"]

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
    return "\n".join(parts)

# ----------------------------
# BUILD QUERY
# ----------------------------
image_query = load_image_query(IMAGE_DIR, IMAGE_IDS)
memory_query = load_memory_query(MEMORY_PATH)
query = "\n\n".join([image_query, memory_query])

# ----------------------------
# LOAD BOOKS
# ----------------------------
books = []
candidates = []

for path in sorted(BOOK_DIR.glob("*.json")):
    book = load_json(path)
    books.append(book)
    candidates.append(flatten_book(book))

# ----------------------------
# SCORE
# ----------------------------
pairs = [[query, cand] for cand in candidates]
scores = reranker.compute_score(pairs)

ranked = sorted(zip(scores, books), key=lambda x: x[0], reverse=True)

# ----------------------------
# PRINT RESULTS
# ----------------------------
for rank, (score, book) in enumerate(ranked, start=1):
    print(f"{rank:02d}. {score:.4f}  {book['book_title']} — {book['author']}")