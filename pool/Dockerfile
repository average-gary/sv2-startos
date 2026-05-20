# Stage 1: Build the pool
FROM rust:1.89-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    capnproto libcapnp-dev && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Copy the sv2-apps source
COPY sv2-apps ./sv2-apps

# Build the pool from the workspace
WORKDIR /build/sv2-apps/pool-apps
RUN cargo build --release --package pool_sv2

# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim

# Create app directories
RUN mkdir -p /app/config /app/data

# Copy the binary from builder
COPY --from=builder /build/sv2-apps/pool-apps/target/release/pool_sv2 /usr/local/bin/pool_sv2

# Copy config examples for reference
COPY --from=builder /build/sv2-apps/pool-apps/pool/config-examples /app/config-examples

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set working directory
WORKDIR /app

# Expose default ports
# 34254 - Downstream (translators/proxies)
EXPOSE 34254

# Entrypoint and default command (will be overridden by StartOS)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/app/config/pool-config.toml"]
