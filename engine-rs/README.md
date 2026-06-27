# bsf-engine (Rust matching engine)

A dedicated, out-of-process order-matching service for the BSF2020 exchange. It implements
back/lay (LAGAI/KHAI) order matching and worst-case exposure, mirroring the Go in-process
engine exactly and speaking the same JSON contract.

The Go monolith uses it automatically when `ENGINE_URL` is set (e.g. `http://localhost:9090`);
with `ENGINE_URL` unset it falls back to the in-process Go engine. Callers (the betting module)
depend only on the `MatchingEngine` interface, so swapping is a config change.

## API

| Method | Path                  | Body / Query                                                   | Response |
|-------:|-----------------------|---------------------------------------------------------------|----------|
| GET    | `/health`             | —                                                             | `ok` |
| POST   | `/submit`             | `{userId, marketId, selection, side:"back"\|"lay", price, size}` | `{fills:[{matchedSize,price}], matchedSize, openSize, exposure}` |
| GET    | `/book?marketId=...`  | —                                                             | `{marketId, backs:[{price,size}], lays:[{price,size}]}` |

## Run

```bash
# local
cargo run --release            # listens on 0.0.0.0:9090 (override with ENGINE_ADDR)

# docker
docker build -t bsf-engine .
docker run -p 9090:9090 bsf-engine
```

Then point the Go app at it: `ENGINE_URL=http://localhost:9090 go run ./cmd/server`
(from `backend/`), or use `docker compose --profile app up` which wires it automatically.

## Why Rust here
The matching hot path wants predictable, GC-free tail latency. Matching is serialized through a
single `Mutex` because an exchange must process orders deterministically; throughput comes from
keeping per-order work tiny and allocation-light, not from parallelism inside a single market.
