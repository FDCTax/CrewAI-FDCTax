# Use a stable Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy only dependency files first (for caching)
COPY requirements.txt .
COPY runtime.txt .
COPY .python-version .

# Install system dependencies required by ChromaDB & sentence-transformers
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port for DO
ENV PORT=8080
EXPOSE 8080

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
