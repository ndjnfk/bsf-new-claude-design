# --- build ---
FROM rust:1.79-slim AS build
WORKDIR /src
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

# --- run ---
FROM debian:bookworm-slim
RUN useradd -r -u 10001 engine
COPY --from=build /src/target/release/bsf-engine /usr/local/bin/bsf-engine
EXPOSE 9090
USER engine
ENTRYPOINT ["/usr/local/bin/bsf-engine"]
