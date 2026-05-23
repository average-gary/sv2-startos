#!/bin/sh
set -e

# Service tag passed in via CONFIGD_SERVICE env var (set by per-service Dockerfile.ui).
: "${CONFIGD_SERVICE:=pool}"
export CONFIGD_SERVICE

# configd reads /data/config.toml and serves redacted JSON on :9091
configd -config /data/config.toml -service "$CONFIGD_SERVICE" -addr :9091 &
CONFIGD_PID=$!

# Pass control to Caddy as PID 1's foreground child
trap 'kill $CONFIGD_PID 2>/dev/null || true' INT TERM EXIT

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
