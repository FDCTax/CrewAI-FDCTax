FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy backend dependency file first (for caching)
COPY python_rag/requirements.txt .

# Install system dependencies required by ChromaDB and transformers
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY python_rag/ .

# Expose port for DigitalOcean
ENV PORT=8080
EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
