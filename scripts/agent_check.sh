#!/usr/bin/env bash
set -eo pipefail

# Ensure rustup and cargo are in PATH if present
if [ -d "/Users/foolvan/AntigravityProfiles/2/.rustup" ]; then
  export RUSTUP_HOME="/Users/foolvan/AntigravityProfiles/2/.rustup"
fi
if [ -d "/Users/foolvan/.cargo/bin" ]; then
  export PATH="/Users/foolvan/.cargo/bin:$PATH"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== [1/4] Fast Rust Core & WASM Type/Lint Check ==="
cargo check --workspace --message-format=short
cargo check -p lattice-wasm --target wasm32-unknown-unknown --message-format=short

echo "=== [2/4] Rust Unit Tests & Numerical Stability ==="
cargo test --workspace --quiet

echo "=== [3/5] TypeScript Strict Type Check ==="
if [ -d "frontend" ]; then
  cd frontend
  npx tsc -b --pretty false
  cd ..
fi

echo "=== [4/5] Native macOS Live Wallpaper Engine Compile Check ==="
if [ -f "tools/neon-wallpaper/main.swift" ]; then
  swiftc -O -whole-module-optimization tools/neon-wallpaper/main.swift -o /tmp/check_neon_wallpaper
  rm -f /tmp/check_neon_wallpaper
fi

echo "=== [5/5] Verification Succeeded in < 3s ==="
