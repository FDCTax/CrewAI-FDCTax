# FDC Luna RAG System

Lightweight RAG system using Ollama + ChromaDB for FDC Tax Knowledge Base.

## Features

- **ChromaDB**: Vector database for semantic search
- **Ollama**: Local LLM (llama3:8b) for chat
- **OpenAI Fallback**: GPT-4 for complex queries
- **Document Ingestion**: PDF and DOCX support
- **FastAPI**: REST API for integration

## API Endpoints

### Chat
```bash
POST /chat
{
  "messages": [{"role": "user", "content": "What is an ABN?"}],
  "session_id": "uuid",
  "form_context": {"currentStage": 1}
}
```

### Ingest Document
```bash
POST /ingest/document
{
  "title": "ABN Guide",
  "content": "...",
  "category": "ABN"
}
```

### Ingest File
```bash
POST /ingest/file
Content-Type: multipart/form-data
file: example.pdf
category: Tax
title: Example Document
```

### Search KB
```bash
POST /kb/search
{
  "query": "GST registration",
  "limit": 5
}
```

## Running

```bash
# Start Ollama (should already be running)
ollama serve

# Start RAG API
cd /app/python_rag
python3 main.py
```

API will be available at: http://localhost:8001
