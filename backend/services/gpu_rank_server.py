from fastapi import FastAPI
from pydantic import BaseModel

from backend.services.embedding_service import recommend_book

app = FastAPI()


class RankRequest(BaseModel):
    query: str


@app.post("/rank")
def rank(request: RankRequest):
    return recommend_book(request.query)