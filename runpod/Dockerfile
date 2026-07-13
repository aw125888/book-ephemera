FROM python:3.11-slim

WORKDIR /app

COPY runpod/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app/backend
COPY data/book /app/data/book
COPY runpod/handler.py /app/handler.py

ENV PYTHONUNBUFFERED=1

CMD ["python", "-u", "/app/handler.py"]