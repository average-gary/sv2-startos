#!/bin/bash
set -e

CONFIG_FILE="${1:-/app/config/jdc-config.toml}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "=========================================="
  echo "SV2 Job Declarator Client (JDC)"
  echo "=========================================="
  echo ""
  echo "Error: Configuration file not found at: $CONFIG_FILE"
  echo ""
  echo "Mount a config file from /app/config-examples/ as $CONFIG_FILE,"
  echo "or pass a different path as the first argument."
  echo ""
  exit 1
fi

exec jd_client_sv2 -c "$CONFIG_FILE"
