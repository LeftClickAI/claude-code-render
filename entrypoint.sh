#!/usr/bin/env bash
set -euo pipefail

# Ensure persisted config dirs exist (on /data)
mkdir -p /data/home/coder/.config/code-server
mkdir -p /data/home/coder/.local/share/code-server
mkdir -p /data/projects
[ -d /home/coder/.config ] || ln -s /data/home/coder/.config /home/coder/.config
[ -d /home/coder/.local ]  || ln -s /data/home/coder/.local  /home/coder/.local

# Optional: create a default workspace folder
[ -d /workspace ] || mkdir -p /workspace

# Launch code-server; auth via PASSWORD env var, listen on 0.0.0.0:8080
exec code-server \
  --bind-addr 0.0.0.0:8080 \
  --auth password \
  --disable-telemetry \
  /workspace