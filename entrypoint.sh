#!/bin/sh
set -e

echo "Starting Anvil..."

exec anvil \
    --host 0.0.0.0 \
    --port 8545