#!/bin/bash
set -a
source /app/.env
set +a
cd /app/python_rag
exec /root/.venv/bin/python3 main.py
