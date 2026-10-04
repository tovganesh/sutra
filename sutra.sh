#!/usr/bin/env bash
# Sutra Enterprise Operating System - Docker Management CLI Wrapper
# Unified control script for containers, builds, status, logs, and provisioning.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_CLI="${SCRIPT_DIR}/scripts/sutra-docker.mjs"

if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is required but was not found in PATH." >&2
    exit 1
fi

if [ $# -eq 0 ]; then
    node "${DOCKER_CLI}" help
else
    node "${DOCKER_CLI}" "$@"
fi
