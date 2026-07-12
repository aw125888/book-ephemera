from __future__ import annotations

import requests

GPU_SERVER_URL = "http://127.0.0.1:18760"

#name of machine running CPU backend
# GPU_SERVER_URL = "http://127.0.0.1:7860"


def recommend_book(query: str):
    response = requests.post(
        f"{GPU_SERVER_URL}/rank",
        json={"query": query},
        timeout=300,
    )

    response.raise_for_status()

    return response.json()