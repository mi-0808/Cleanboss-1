#!/usr/bin/env bash
set -euo pipefail
ENV_NAME="${1:-dev}"
cd "$(dirname "$0")/.."
cdk deploy -c env="${ENV_NAME}" --all
