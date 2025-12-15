#!/usr/bin/env python3
import chromadb

chroma_client = chromadb.PersistentClient(path="/app/python_rag/chroma_db")
kb_collection = chroma_client.get_collection(name="fdc_knowledge_base")

# Find Luna Style Guide by title
all_results = kb_collection.get()

for i, metadata in enumerate(all_results['metadatas']):
    if 'Luna Style Guide' in metadata.get('title', ''):
        doc_id = metadata.get('doc_id')
        print(f"Found Luna Style Guide with doc_id: {doc_id}")
        
        # Update all chunks for this doc
        doc_results = kb_collection.get(where={"doc_id": doc_id})
        
        for j, chunk_id in enumerate(doc_results['ids']):
            chunk_meta = doc_results['metadatas'][j]
            chunk_meta['category'] = 'Core'
            kb_collection.update(ids=[chunk_id], metadatas=[chunk_meta])
        
        print(f"✅ Updated {len(doc_results['ids'])} chunks to Core category")
        break
