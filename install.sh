#!/usr/bin/env bash
# ==============================================================================
# 🧬 NEON-LATTICE // Native macOS Apple Silicon Live Wallpaper Installer
# ==============================================================================
# Ultra-lightweight, zero-dependency installer for M-series MacBooks (M1/M2/M3/M4).
# Compiles and installs ONLY the native Metal GPU live wallpaper engine.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Locate source file
if [ -f "${SCRIPT_DIR}/tools/neon-wallpaper/main.swift" ]; then
    SOURCE_SWIFT="${SCRIPT_DIR}/tools/neon-wallpaper/main.swift"
    PROJECT_ROOT="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/main.swift" ]; then
    SOURCE_SWIFT="${SCRIPT_DIR}/main.swift"
    PROJECT_ROOT="${SCRIPT_DIR}"
else
    echo "❌ Error: Cannot find main.swift."
    exit 1
fi

# Print stylish banner
print_banner() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧬 NEON-LATTICE // macOS Apple Silicon Live Wallpaper"
    echo "   Infinite Real-Time Simulation • Metal GPU Accelerated"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Print help message
show_help() {
    print_banner
    echo ""
    echo "Usage: ./install.sh [options]"
    echo ""
    echo "Options:"
    echo "  --start         Install and start live wallpaper immediately (default)"
    echo "  --autostart     Install, start, and enable automatic launch on login"
    echo "  --no-start      Install CLI and Mac App only, do not launch daemon"
    echo "  --uninstall     Completely remove live wallpaper, CLI, and LaunchAgent"
    echo "  --help, -h      Show this help message"
    echo ""
    exit 0
}

# Parse command line flags
AUTOSTART=false
START_NOW=true
DO_UNINSTALL=false
FORCE_BUILD=false

for arg in "$@"; do
    case "$arg" in
        --autostart)
            AUTOSTART=true
            START_NOW=true
            ;;
        --no-start)
            START_NOW=false
            ;;
        --start)
            START_NOW=true
            ;;
        --build|--rebuild)
            FORCE_BUILD=true
            ;;
        --uninstall)
            DO_UNINSTALL=true
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "⚠️  Unknown option: $arg"
            echo "Run './install.sh --help' for usage."
            exit 1
            ;;
    esac
done

# Handle uninstallation
if [ "$DO_UNINSTALL" = true ]; then
    print_banner
    echo "🗑️  Initiating uninstallation..."

    # Stop daemon if running
    if command -v neon-wallpaper >/dev/null 2>&1; then
        neon-wallpaper stop 2>/dev/null || true
        neon-wallpaper autostart disable 2>/dev/null || true
    fi

    # Unload launchctl agent
    PLIST_PATH="${HOME}/Library/LaunchAgents/com.neon-lattice.wallpaper.plist"
    if [ -f "$PLIST_PATH" ]; then
        launchctl unload "$PLIST_PATH" 2>/dev/null || true
        rm -f "$PLIST_PATH"
        echo "• Removed LaunchAgent: $PLIST_PATH"
    fi

    # Remove binaries and App bundle
    TARGETS=(
        "/usr/local/bin/neon-wallpaper"
        "${HOME}/.local/bin/neon-wallpaper"
        "${HOME}/Applications/NeonWallpaper.app"
        "/Applications/NeonWallpaper.app"
        "/tmp/neon-wallpaper.pid"
    )

    for target in "${TARGETS[@]}"; do
        if [ -e "$target" ]; then
            rm -rf "$target"
            echo "• Removed: $target"
        fi
    done

    echo ""
    echo "✅ Uninstallation complete! Live wallpaper engine removed cleanly."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

print_banner

# 1. Hardware & Platform Verification
echo "• Verifying hardware environment..."

OS_NAME="$(uname -s)"
if [ "$OS_NAME" != "Darwin" ]; then
    echo "❌ Error: This live wallpaper engine requires macOS (Darwin)."
    exit 1
fi

ARCH_NAME="$(uname -m)"
CPU_BRAND="$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Apple Silicon")"
MACOS_VER="$(sw_vers -productVersion 2>/dev/null || echo "macOS")"

if [ "$ARCH_NAME" = "arm64" ]; then
    echo "  ✔ Platform: ${CPU_BRAND} (ARM64 Native)"
    echo "  ✔ OS: macOS ${MACOS_VER}"
else
    echo "⚠️  Warning: Detected architecture '${ARCH_NAME}'. This engine is specifically"
    echo "   optimized for Apple Silicon Unified Memory and Metal Compute Shaders."
fi

# 2. Binary Resolution / Compilation
BUILD_DIR="${PROJECT_ROOT}/bin"
mkdir -p "${BUILD_DIR}"
OUTPUT_BIN="${BUILD_DIR}/neon-wallpaper"

PREBUILT_FOUND=false
if [ -f "${SCRIPT_DIR}/bin/neon-wallpaper" ]; then
    OUTPUT_BIN="${SCRIPT_DIR}/bin/neon-wallpaper"
    PREBUILT_FOUND=true
elif [ -f "${BUILD_DIR}/neon-wallpaper" ]; then
    OUTPUT_BIN="${BUILD_DIR}/neon-wallpaper"
    PREBUILT_FOUND=true
fi

if [ "$PREBUILT_FOUND" = true ] && [ "$FORCE_BUILD" = false ]; then
    echo "• Found pre-compiled Apple Silicon native binary (128 KB)..."
    # Re-sign for local Mac AMFI kernel policy
    codesign -s - -f "${OUTPUT_BIN}" >/dev/null 2>&1 || true
    echo "  ✔ Binary ready: ${OUTPUT_BIN} (Zero compiler required)"
else
    echo "• Checking compiler toolchain..."
    if ! command -v swiftc >/dev/null 2>&1; then
        echo "❌ Error: 'swiftc' (Swift compiler) is not installed."
        echo ""
        echo "To install the native Apple Command Line Tools, run:"
        echo "  xcode-select --install"
        echo ""
        echo "Then rerun this installer."
        exit 1
    fi
    SWIFT_VER="$(swiftc --version | head -n 1)"
    echo "  ✔ Compiler: ${SWIFT_VER}"

    echo "• Compiling native Metal GPU engine (-O -whole-module-optimization)..."
    swiftc \
        -O \
        -whole-module-optimization \
        "${SOURCE_SWIFT}" \
        -o "${OUTPUT_BIN}"

    # Strip symbols and ad-hoc sign for Apple Silicon AMFI policy
    strip "${OUTPUT_BIN}"
    codesign -s - -f "${OUTPUT_BIN}" >/dev/null 2>&1
    BIN_SIZE="$(ls -lh "${OUTPUT_BIN}" | awk '{print $5}')"
    echo "  ✔ Binary built and signed: ${OUTPUT_BIN} (${BIN_SIZE})"
fi

# 4. Install CLI Tool to User PATH
echo "• Installing CLI tool..."
mkdir -p "${HOME}/.local/bin"
cp -f "${OUTPUT_BIN}" "${HOME}/.local/bin/neon-wallpaper"
chmod +x "${HOME}/.local/bin/neon-wallpaper"
echo "  ✔ Installed: ${HOME}/.local/bin/neon-wallpaper"

# If /usr/local/bin is writable, copy there as well
if [ -w "/usr/local/bin" ]; then
    cp -f "${OUTPUT_BIN}" "/usr/local/bin/neon-wallpaper" 2>/dev/null || true
    chmod +x "/usr/local/bin/neon-wallpaper" 2>/dev/null || true
    echo "  ✔ Installed: /usr/local/bin/neon-wallpaper"
fi

# Check PATH in user's shell configuration (~/.zshrc)
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ] || [ -f "${HOME}/.zshrc" ] || [[ "$SHELL" =~ zsh ]]; then
    SHELL_CONFIG="${HOME}/.zshrc"
elif [ -f "${HOME}/.bash_profile" ]; then
    SHELL_CONFIG="${HOME}/.bash_profile"
fi

if [[ ":$PATH:" != *":${HOME}/.local/bin:"* ]]; then
    if [ -n "$SHELL_CONFIG" ]; then
        if ! grep -q 'export PATH="\$HOME/.local/bin:\$PATH"' "$SHELL_CONFIG" 2>/dev/null; then
            echo '' >> "$SHELL_CONFIG"
            echo '# neon-wallpaper CLI' >> "$SHELL_CONFIG"
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_CONFIG"
            echo "  ✔ Configured PATH in ${SHELL_CONFIG}"
        fi
    fi
    export PATH="${HOME}/.local/bin:$PATH"
fi

# 5. Build Native macOS Application Bundle (~/Applications/NeonWallpaper.app)
echo "• Creating native macOS App bundle..."
APP_BUNDLE="${HOME}/Applications/NeonWallpaper.app"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

cp -f "${OUTPUT_BIN}" "${APP_BUNDLE}/Contents/MacOS/neon-wallpaper"
chmod +x "${APP_BUNDLE}/Contents/MacOS/neon-wallpaper"

cat << 'EOF' > "${APP_BUNDLE}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>neon-wallpaper</string>
    <key>CFBundleIdentifier</key>
    <string>com.neon-lattice.wallpaper</string>
    <key>CFBundleName</key>
    <string>Neon Wallpaper</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

codesign -s - -f "${APP_BUNDLE}" >/dev/null 2>&1
echo "  ✔ App bundle created: ${APP_BUNDLE}"
echo "    (Discoverable in Spotlight Search: Cmd+Space -> 'Neon Wallpaper')"

# 6. Autostart on login setup
if [ "$AUTOSTART" = true ]; then
    echo "• Enabling automatic start on macOS login..."
    "${HOME}/.local/bin/neon-wallpaper" autostart enable
fi

# 7. Start live wallpaper
if [ "$START_NOW" = true ]; then
    echo "• Starting live wallpaper engine..."
    # If running, stop previous instance
    "${HOME}/.local/bin/neon-wallpaper" stop >/dev/null 2>&1 || true
    "${HOME}/.local/bin/neon-wallpaper" start
fi

# 8. Print Complete Success Guide
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation Complete! Neon Live Wallpaper is Ready."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚡ HOW TO USE:"
echo ""
echo "  From Terminal:"
echo "    neon-wallpaper status           # View live FPS, GPU/CPU & memory usage"
echo "    neon-wallpaper stop             # Stop wallpaper"
echo "    neon-wallpaper start            # Start wallpaper"
echo "    neon-wallpaper toggle           # Toggle on / off"
echo "    neon-wallpaper autostart enable # Start automatically on login"
echo "    neon-wallpaper uninstall        # Completely remove from system"
echo ""
echo "  From macOS GUI:"
echo "    • Spotlight: Press Cmd + Space, type 'Neon Wallpaper', and hit Enter to toggle!"
echo "    • Finder:    Open ~/Applications/NeonWallpaper.app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
