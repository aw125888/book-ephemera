from __future__ import annotations

import os
import requests

RUNPOD_URL = os.environ["RUNPOD_URL"]
RUNPOD_API_KEY = os.environ["RUNPOD_API_KEY"]


def recommend_book(query: str):
    response = requests.post(
        f"{RUNPOD_URL}/runsync",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {RUNPOD_API_KEY}",
        },
        json={
            "input": {
                "query": query,
            }
        },
        timeout=300,
    )

    response.raise_for_status()

    data = response.json()

    return data["output"]