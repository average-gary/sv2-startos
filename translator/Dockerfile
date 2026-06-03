# Stage 1: Build the translator
FROM rust:1.89-bookworm AS builder

# Set working directory
WORKDIR /build

# Copy the sv2-apps source
COPY sv2-apps ./sv2-apps

# Cargo features to enable. Default ships with iroh-transport so the [iroh]
# config block is honored. Pass --build-arg CARGO_FEATURES="" to disable.
ARG CARGO_FEATURES="iroh-transport"

# Build the translator from the workspace
WORKDIR /build/sv2-apps/miner-apps
RUN cargo build --release --package translator_sv2 --features "${CARGO_FEATURES}"

# Stage 2: Create minimal runtime image
FROM debian:bookworm-slim

# Create app directories
RUN mkdir -p /app/config /app/data

# Copy the binary from builder
COPY --from=builder /build/sv2-apps/miner-apps/target/release/translator_sv2 /usr/local/bin/translator_sv2

# Copy config examples for reference
COPY --from=builder /build/sv2-apps/miner-apps/translator/config-examples /app/config-examples

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set working directory
WORKDIR /app

# Expose default ports
# 34255 - Downstream (mining devices)
EXPOSE 34255

# Entrypoint and default command (will be overridden by StartOS)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/app/config/tproxy-config.toml"]
