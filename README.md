# Sentiment 2 Novel

A multimodal recommendation engine that transforms three user-uploaded images and a written reflection into personalized book recommendations using semantic retrieval, LLM reasoning, and GPU reranking.

🌐 Live Demo: book-ephemera.vercel.app

<img width="1436" height="777" alt="Screenshot 2026-08-05 at 1 30 10 AM" src="https://github.com/user-attachments/assets/61005cf5-e52c-4ba1-bcc3-e52fc6758fa6" />

## Motivation

Traditional recommendation systems rely on purchase history or explicit ratings. The "magic" is therefore taken away from any given recommendation.

Book Ephemera instead asks a different question:

> What books feel like these images + sentiment?

By combining visual information, personal reflection, semantic reasoning, and dense retrieval, the application recommends books based on atmospher and emotional resonance rather than keywords or popularity.
Sentiment 2 Novel ultimately attempts to transform any esoteric feeling into a novel. 



<img width="1432" height="772" alt="Screenshot 2026-08-05 at 1 39 34 AM" src="https://github.com/user-attachments/assets/e443468c-5c00-433f-8abe-cdda929e7d7a" />
First Image Upload Screen
<img width="1431" height="777" alt="Screenshot 2026-08-05 at 1 39 47 AM" src="https://github.com/user-attachments/assets/66bae634-823d-4555-afb3-e130b08a9d97" />
Second Image Upload Screen
<img width="1435" height="762" alt="Screenshot 2026-08-05 at 1 39 58 AM" src="https://github.com/user-attachments/assets/ea7e886b-5f57-490e-a5ac-c7c0884d958f" />
Third Image Upload Screen
<img width="1437" height="764" alt="Screenshot 2026-08-05 at 1 40 45 AM" src="https://github.com/user-attachments/assets/f5e1aabf-9ebf-41c0-ac5f-98ff76f0eb55" />
Sentiment Upload Screen
<img width="1438" height="785" alt="Screenshot 2026-08-05 at 1 40 57 AM" src="https://github.com/user-attachments/assets/0cf4a4af-6191-46bf-b4ac-81d7c53ac69b" />
Deliberation Screen
<img width="1432" height="770" alt="Screenshot 2026-08-05 at 1 41 24 AM" src="https://github.com/user-attachments/assets/e8d9a1ba-b14e-47b4-8b83-9cff6b8248d1" />
Press 2 Get Book
<img width="1429" height="777" alt="Screenshot 2026-08-05 at 1 41 32 AM" src="https://github.com/user-attachments/assets/564270c6-8175-44f1-b13d-613742b94de9" />
Result Screen



## Recommendation Pipeline

1. Upload three images.

2. Write a short reflection (up to fifty words).

3. GPT-5 mini performs multimodal analysis, generating semantic descriptions for each image and the written reflection.

4. The four semantic descriptions are compared against a curated corpus of annotated books.

5. BAAI/bge-reranker-v2-m3 reranks candidate books on a GPU-hosted inference service.

6. The highest-ranked recommendation is returned to the user.

| Layer | Technology |
|------|------------|
| Frontend | React |
| Backend | FastAPI |
| Queue | Redis |
| AI | GPT-5 mini |
| Reranker | BAAI/bge-reranker-v2-m3 |
| GPU | RunPod |
| Deployment | Vercel + Render |
| Containers | Docker |

## Engineering Challenges

### Asynchronous inference

Recommendation generation involves multiple long-running AI inference steps. To keep the interface responsive, requests are queued with Redis while the frontend polls for completion.

### GPU-hosted reranking

The BGE cross encoder is deployed separately on RunPod inside a Docker container, allowing GPU inference while keeping the primary API lightweight.

### Semantic recommendation

Rather than matching books using keywords, recommendations are produced by comparing semantic descriptions generated from both images and text against an annotated corpus of books.

## Future Work

- Larger annotated book corpus

- User accounts and saved libraries

- Extension to other forms of media such as film, television, and music


