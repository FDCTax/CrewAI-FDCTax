#!/usr/bin/env python3
"""
FDC Tax Luna RAG System
Lightweight RAG using Ollama + ChromaDB
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import requests
from pypdf import PdfReader
from docx import Document
from striprtf.striprtf import rtf_to_text
import json

# Initialize FastAPI
app = FastAPI(title="FDC Luna RAG API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB with persistent client
chroma_client = chromadb.PersistentClient(
    path="/app/python_rag/chroma_db"
)

# Create or get collection
try:
    kb_collection = chroma_client.get_or_create_collection(
        name="fdc_knowledge_base",
        metadata={"hnsw:space": "cosine"}
    )
    print(f"ChromaDB collection initialized. Current document count: {kb_collection.count()}")
except Exception as e:
    print(f"Error initializing ChromaDB: {e}")
    kb_collection = chroma_client.create_collection(
        name="fdc_knowledge_base",
        metadata={"hnsw:space": "cosine"}
    )

# Initialize embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    session_id: str
    form_context: Optional[Dict[str, Any]] = None
    use_fallback: bool = False

class DocumentIngest(BaseModel):
    title: str
    content: str
    category: str
    metadata: Optional[Dict[str, Any]] = None

class KBSearchRequest(BaseModel):
    query: str
    limit: int = 5

# Helper functions
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf = PdfReader(file_bytes)
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(file_bytes)
        text = "\n\n".join([para.text for para in doc.paragraphs if para.text.strip()])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

def extract_text_from_rtf(file_bytes: bytes) -> str:
    """Extract text from RTF file"""
    try:
        rtf_content = file_bytes.decode('utf-8', errors='ignore')
        text = rtf_to_text(rtf_content)
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading RTF: {str(e)}")

def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from TXT file"""
    try:
        text = file_bytes.decode('utf-8', errors='ignore')
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading TXT: {str(e)}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start = end - overlap
    return chunks

def search_knowledge_base(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search ChromaDB for relevant documents with style guide prioritization"""
    try:
        query_embedding = embedding_model.encode([query])[0].tolist()
        
        # Get more results initially (we'll prioritize and limit after)
        results = kb_collection.query(
            query_embeddings=[query_embedding],
            n_results=limit * 2  # Get extra results to prioritize from
        )
        
        documents = []
        style_guide_docs = []
        
        if results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                distance = results['distances'][0][i] if results['distances'] else 0
                
                doc_entry = {
                    "content": doc,
                    "metadata": metadata,
                    "distance": distance
                }
                
                # Check if this is from Luna Style Guide
                title = metadata.get('title', '').lower()
                filename = metadata.get('filename', '').lower()
                
                if 'luna style guide' in title or 'luna style guide' in filename:
                    # Boost style guide by reducing distance (making it more relevant)
                    doc_entry['distance'] = distance * 0.5  # 50% boost
                    style_guide_docs.append(doc_entry)
                else:
                    documents.append(doc_entry)
        
        # Prioritize: Style guide docs first, then others
        prioritized_docs = style_guide_docs + documents
        
        # Sort by distance (lower is more relevant) and limit
        prioritized_docs.sort(key=lambda x: x['distance'])
        return prioritized_docs[:limit]
        
    except Exception as e:
        print(f"Error searching KB: {e}")
        return []

def call_ollama(messages: List[Dict[str, str]], system_prompt: str) -> str:
    """Call Ollama llama3:8b for chat completion"""
    try:
        # Format messages for Ollama
        formatted_messages = [{"role": "system", "content": system_prompt}]
        formatted_messages.extend(messages)
        
        response = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": "llama3:8b",
                "messages": formatted_messages,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json()["message"]["content"]
        else:
            raise Exception(f"Ollama error: {response.text}")
    except Exception as e:
        print(f"Ollama error: {e}")
        raise

def call_openai_fallback(messages: List[Dict[str, str]], system_prompt: str) -> str:
    """Fallback to OpenAI GPT-4 if Ollama fails"""
    if not OPENAI_API_KEY:
        raise Exception("OpenAI API key not configured")
    
    try:
        formatted_messages = [{"role": "system", "content": system_prompt}]
        formatted_messages.extend(messages)
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4-turbo-preview",
                "messages": formatted_messages,
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            raise Exception(f"OpenAI error: {response.text}")
    except Exception as e:
        print(f"OpenAI error: {e}")
        raise

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ollama_url": OLLAMA_URL,
        "kb_documents": kb_collection.count()
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    """Main chat endpoint with RAG"""
    try:
        # Get last user message for KB search
        last_user_msg = next((m for m in reversed(request.messages) if m.role == "user"), None)
        if not last_user_msg:
            raise HTTPException(status_code=400, detail="No user message found")
        
        # Search knowledge base
        kb_results = search_knowledge_base(last_user_msg.content, limit=3)
        
        # Build context
        kb_context = ""
        if kb_results:
            kb_context = "\n\nRelevant knowledge base information:\n"
            for i, doc in enumerate(kb_results):
                kb_context += f"\n{i+1}. {doc['metadata'].get('title', 'Untitled')}\n{doc['content']}\n"
        
        # Build form context
        form_context_str = ""
        if request.form_context:
            form_context_str = f"\n\nCurrent form context:\n- Stage: {request.form_context.get('currentStage', 'unknown')}\n"
            if request.form_context.get('hasABN'):
                form_context_str += "- User has ABN\n"
            if request.form_context.get('hasGST'):
                form_context_str += "- User registered for GST\n"
        
        # GLOBAL SYSTEM PROMPT - Luna's Core Style
        system_prompt = f"""You are Luna, supportive FDC tax assistant for Australian educators. Be brief (3-6 sentences), practical, cautious. Use bullets. Reference ATO. Tone: friendly mate, not formal.

Core Guidelines:
• Keep responses 3-6 sentences (use bullets for lists)
• Practical, actionable advice
• Be cautious with tax claims - reference ATO when needed
• Friendly, supportive tone (like chatting with a knowledgeable mate)
• Avoid overly formal language
• Focus on educators' specific needs and deductions

Your role:
1. Answer questions about Australian tax, ABN, GST, FDC deductions
2. Help educators understand their deductions and requirements
3. Guide them through the onboarding process
4. Be encouraging but accurate (tax compliance matters!)

IMPORTANT: Use the knowledge base information below - it contains official FDC guidance and your style guide.
{kb_context}{form_context_str}"""
        
        # Format messages for LLM
        formatted_messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        # Try Ollama first, fallback to OpenAI if needed
        try:
            if request.use_fallback:
                raise Exception("Fallback requested")
            response_content = call_ollama(formatted_messages, system_prompt)
            provider = "ollama"
        except Exception as e:
            print(f"Ollama failed, using OpenAI fallback: {e}")
            response_content = call_openai_fallback(formatted_messages, system_prompt)
            provider = "openai"
        
        return {
            "message": {
                "role": "assistant",
                "content": response_content
            },
            "kb_sources": [{
                "title": doc['metadata'].get('title', 'Untitled'),
                "category": doc['metadata'].get('category', 'Unknown')
            } for doc in kb_results],
            "session_id": request.session_id,
            "provider": provider
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest/document")
async def ingest_document(doc: DocumentIngest):
    """Ingest a text document into the knowledge base"""
    try:
        # Chunk the content
        chunks = chunk_text(doc.content)
        
        # Generate embeddings and store
        doc_id = str(uuid.uuid4())
        for i, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}_chunk_{i}"
            embedding = embedding_model.encode([chunk])[0].tolist()
            
            kb_collection.add(
                ids=[chunk_id],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{
                    "title": doc.title,
                    "category": doc.category,
                    "chunk_index": i,
                    "doc_id": doc_id,
                    **(doc.metadata or {})
                }]
            )
        
        return {
            "status": "success",
            "doc_id": doc_id,
            "chunks_created": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...), category: str = "General", title: Optional[str] = None):
    """Ingest a PDF, DOCX, RTF, or TXT file"""
    try:
        file_bytes = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            content = extract_text_from_pdf(file_bytes)
        elif file.filename.endswith('.docx'):
            content = extract_text_from_docx(file_bytes)
        elif file.filename.endswith('.rtf'):
            content = extract_text_from_rtf(file_bytes)
        elif file.filename.endswith('.txt'):
            content = extract_text_from_txt(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX, RTF, or TXT.")
        
        # Use provided title, fallback to filename
        doc_title = title if title else file.filename
        
        # Ingest the document
        doc = DocumentIngest(
            title=doc_title,
            content=content,
            category=category,
            metadata={"filename": file.filename}
        )
        
        return await ingest_document(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/kb/search")
async def search_kb(request: KBSearchRequest):
    """Search knowledge base"""
    results = search_knowledge_base(request.query, request.limit)
    return {
        "query": request.query,
        "results": results,
        "count": len(results)
    }

@app.get("/kb/stats")
async def kb_stats():
    """Get knowledge base statistics"""
    try:
        count = kb_collection.count()
        return {
            "total_documents": count,
            "collection_name": "fdc_knowledge_base"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/kb/documents")
async def list_documents():
    """List all ingested documents with metadata"""
    try:
        # Get all documents from collection
        results = kb_collection.get()
        
        # Group chunks by doc_id
        documents = {}
        if results['ids']:
            for i, chunk_id in enumerate(results['ids']):
                metadata = results['metadatas'][i] if results['metadatas'] else {}
                doc_id = metadata.get('doc_id', 'unknown')
                
                if doc_id not in documents:
                    documents[doc_id] = {
                        'doc_id': doc_id,
                        'title': metadata.get('title', 'Untitled'),
                        'category': metadata.get('category', 'Unknown'),
                        'filename': metadata.get('filename', 'N/A'),
                        'chunk_count': 0,
                        'created_at': metadata.get('created_at', 'Unknown'),
                        'first_chunk_id': chunk_id
                    }
                documents[doc_id]['chunk_count'] += 1
        
        return {
            "documents": list(documents.values()),
            "total": len(documents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/kb/documents/{doc_id}")
async def get_document_details(doc_id: str):
    """Get detailed information about a specific document including all chunks"""
    try:
        results = kb_collection.get(
            where={"doc_id": doc_id}
        )
        
        chunks = []
        if results['ids']:
            for i, chunk_id in enumerate(results['ids']):
                chunks.append({
                    'chunk_id': chunk_id,
                    'content': results['documents'][i],
                    'metadata': results['metadatas'][i] if results['metadatas'] else {},
                    'chunk_index': results['metadatas'][i].get('chunk_index', i) if results['metadatas'] else i
                })
        
        # Sort by chunk index
        chunks.sort(key=lambda x: x['chunk_index'])
        
        if not chunks:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "doc_id": doc_id,
            "title": chunks[0]['metadata'].get('title', 'Untitled'),
            "category": chunks[0]['metadata'].get('category', 'Unknown'),
            "filename": chunks[0]['metadata'].get('filename', 'N/A'),
            "chunk_count": len(chunks),
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/kb/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and all its chunks from the knowledge base"""
    try:
        # Get all chunk IDs for this document
        results = kb_collection.get(
            where={"doc_id": doc_id}
        )
        
        if not results['ids']:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete all chunks
        kb_collection.delete(ids=results['ids'])
        
        return {
            "status": "success",
            "message": f"Deleted document {doc_id}",
            "chunks_deleted": len(results['ids'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/kb/export")
async def export_kb():
    """Export entire knowledge base as JSON"""
    try:
        results = kb_collection.get()
        
        documents = []
        if results['ids']:
            for i, chunk_id in enumerate(results['ids']):
                documents.append({
                    'chunk_id': chunk_id,
                    'content': results['documents'][i],
                    'metadata': results['metadatas'][i] if results['metadatas'] else {},
                    'embedding': results['embeddings'][i] if results['embeddings'] else None
                })
        
        return {
            "export_date": json.dumps({"timestamp": "2025-12-15"}),
            "collection_name": "fdc_knowledge_base",
            "total_chunks": len(documents),
            "documents": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/kb/clear")
async def clear_kb():
    """Clear all documents from knowledge base (admin only)"""
    try:
        global kb_collection
        chroma_client.delete_collection("fdc_knowledge_base")
        kb_collection = chroma_client.create_collection(
            name="fdc_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
        return {"status": "success", "message": "Knowledge base cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
