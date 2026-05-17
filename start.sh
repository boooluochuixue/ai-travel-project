#!/bin/bash
# Start all services for the AI travel planner project.
# Usage: bash start.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "==> Starting MySQL..."
brew services start mysql 2>/dev/null

echo "==> Starting Redis..."
brew services start redis 2>/dev/null

# Wait for services to be ready
sleep 2

echo "==> Activating Python virtualenv..."
source .venv/bin/activate

echo "==> Starting backend (port 8000)..."
python -m src.main &
BACKEND_PID=$!

echo "==> Starting agent worker..."
python -m src.services.queue.consumer &
WORKER_PID=$!

echo "==> Starting frontend (port 3000)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

cd "$PROJECT_DIR"

echo ""
echo "All services started:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Worker:   PID $WORKER_PID"
echo ""
echo "To stop: kill $BACKEND_PID $WORKER_PID $FRONTEND_PID; brew services stop mysql redis"
echo ""

wait
