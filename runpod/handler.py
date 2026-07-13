# from fastapi import FastAPI
# from pydantic import BaseModel

# from .gpu_embedding_service import recommend_book

# app = FastAPI()


# class RankRequest(BaseModel):
#     query: str


# @app.post("/rank")
# def rank(request: RankRequest):
#     return recommend_book(request.query)


import runpod

from backend.services.gpu_embedding_service import recommend_book

def handler(job):
    query = job["input"]["query"]
    return recommend_book(query)

runpod.serverless.start({"handler": handler})