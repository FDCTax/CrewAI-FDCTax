#!/bin/bash
set -a
source /app/.env
set +a
cd /app/python_rag
exec python3 main.py
