.PHONY: dev dev-backend dev-frontend build migrate install smoke-generate

# Install all dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Start backend (port 8000)
dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

# Start frontend (port 5173, proxies /api to backend)
dev-frontend:
	cd frontend && npm run dev

# Start both (run in separate terminals, or use & on Unix)
dev:
	@echo "Run these in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# Build frontend for production
build:
	cd frontend && npm run build

# Run data migration from JSON to SQLite
migrate:
	python scripts/migrate_json_to_sqlite.py

# Local smoke test: clean ports, start frontend/backend, run Playwright order->generate->result flow
smoke-generate:
	bash scripts/playwright_smoke_generate.sh
