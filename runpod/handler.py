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

print("===== NEW IMAGE LOADED =====")

from backend.services.gpu_embedding_service import recommend_book

def handler(job):
    print("Incoming job:", job)

    query = job["input"]["query"]
    print("Query:", query)

    result = recommend_book(query)

    print("Result:", result)

    return result

runpod.serverless.start({"handler": handler})