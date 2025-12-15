#!/usr/bin/env python3
"""
Update specific documents to be marked as 'Core' in ChromaDB
"""

import chromadb

# Initialize ChromaDB
chroma_client = chromadb.PersistentClient(path="/app/python_rag/chroma_db")
kb_collection = chroma_client.get_collection(name="fdc_knowledge_base")

# Documents to mark as Core
CORE_DOCS = [
    "bbc83c2b-ffa5-4d9f-b5e6-3c9742a6df35",  # Luna Style Guide
    "f1b4234c-2743-417d-a582-dd86ad848ed9",  # Luna Mgt Duties
]

print("Updating Core documents...")

for doc_id in CORE_DOCS:
    # Get all chunks for this document
    results = kb_collection.get(where={"doc_id": doc_id})
    
    if not results['ids']:
        print(f"❌ Document {doc_id} not found")
        continue
    
    # Update each chunk's metadata
    for i, chunk_id in enumerate(results['ids']):
        metadata = results['metadatas'][i]
        metadata['category'] = 'Core'
        
        kb_collection.update(
            ids=[chunk_id],
            metadatas=[metadata]
        )
    
    print(f"✅ Updated {len(results['ids'])} chunks for doc {doc_id} to Core category")

print("\n✅ Core documents updated successfully!")
