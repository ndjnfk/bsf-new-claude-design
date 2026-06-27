.PHONY: up down logs api ui tidy build clean

# Start datastores only.
up:
	docker compose up -d mysql mongo redis

# Stop everything (keep volumes).
down:
	docker compose down

# Wipe everything including data volumes (re-runs migrations next up).
clean:
	docker compose down -v

logs:
	docker compose logs -f

# Run the Go API on the host against compose DBs.
api:
	cd backend && go run ./cmd/api

tidy:
	cd backend && go mod tidy

build:
	cd backend && go build ./...

# Run the frontend dev server.
ui:
	cd frontend && npm run dev
