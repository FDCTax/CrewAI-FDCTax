#!/bin/bash

# Setup script for AnythingLLM + Ollama (Phase 1)
# Run this script to initialize the Luna AI Knowledge Base system

set -e

echo "🚀 FDC Tax - Luna AI Setup (Phase 1)"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Navigate to app directory
cd /app

# Start services
echo "📦 Starting AnythingLLM and Ollama containers..."
docker-compose -f docker-compose-anythingllm.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check Ollama health
echo "🔍 Checking Ollama service..."
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "⚠️  Ollama is starting up (may take a minute)..."
fi

# Pull llama3:8b model
echo ""
echo "📥 Pulling llama3:8b model (this may take several minutes)..."
docker exec fdc-ollama ollama pull llama3:8b

# Pull nomic-embed-text for embeddings
echo ""
echo "📥 Pulling nomic-embed-text for embeddings..."
docker exec fdc-ollama ollama pull nomic-embed-text

# Check AnythingLLM health
echo ""
echo "🔍 Checking AnythingLLM service..."
sleep 5
if curl -f http://localhost:3001/api/ping > /dev/null 2>&1; then
    echo "✅ AnythingLLM is running"
else
    echo "⚠️  AnythingLLM is starting up..."
fi

echo ""
echo "✨ Phase 1 Setup Complete!"
echo ""
echo "📊 Service Status:"
echo "  - Ollama API: http://localhost:11434"
echo "  - AnythingLLM UI: http://localhost:3001"
echo ""
echo "🔐 Default Auth Token: fdc-auth-token-12345"
echo "   (Change in .env for production)"
echo ""
echo "📝 Next Steps:"
echo "  1. Access AnythingLLM at http://localhost:3001"
echo "  2. Create a workspace for 'FDC Tax Central Luna'"
echo "  3. Upload FDC tax documents for ingestion"
echo "  4. Test KB queries"
echo ""
echo "🛠️  Useful Commands:"
echo "  - View logs: docker-compose -f docker-compose-anythingllm.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose-anythingllm.yml down"
echo "  - Restart: docker-compose -f docker-compose-anythingllm.yml restart"
echo ""
