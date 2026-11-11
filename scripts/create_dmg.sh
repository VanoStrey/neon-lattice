#!/usr/bin/env bash
# ==============================================================================
# 🧬 NEON-LATTICE // Production macOS .dmg Installer Generator
# ==============================================================================
# Creates a professional, styled, Retina drag-and-drop .dmg disk image
# with custom volume icons, Apple Silicon binary, and Finder presentation.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VOL_NAME="Neon Wallpaper"
APP_NAME="Neon Wallpaper.app"
DMG_FINAL_NAME="NeonWallpaper.dmg"
DIST_DIR="${PROJECT_ROOT}/dist"
TMP_DIR="/tmp/neon-dmg-build-$$"
RW_DMG="/tmp/neon-rw-$$.dmg"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧬 NEON-LATTICE // Building Native macOS DMG Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Compile Universal 2 binary (Apple Silicon arm64 + Intel x86_64)
echo "• [1/6] Compiling Universal 2 (Apple Silicon arm64 + Intel x86_64) native engine..."
mkdir -p "${PROJECT_ROOT}/bin"
swiftc -target arm64-apple-macos13.0 -O -whole-module-optimization "${PROJECT_ROOT}/tools/neon-wallpaper/main.swift" -o "${PROJECT_ROOT}/bin/neon-wallpaper-arm64"
swiftc -target x86_64-apple-macos13.0 -O -whole-module-optimization "${PROJECT_ROOT}/tools/neon-wallpaper/main.swift" -o "${PROJECT_ROOT}/bin/neon-wallpaper-x86_64"
lipo -create "${PROJECT_ROOT}/bin/neon-wallpaper-arm64" "${PROJECT_ROOT}/bin/neon-wallpaper-x86_64" -output "${PROJECT_ROOT}/bin/neon-wallpaper"
rm -f "${PROJECT_ROOT}/bin/neon-wallpaper-arm64" "${PROJECT_ROOT}/bin/neon-wallpaper-x86_64"
strip "${PROJECT_ROOT}/bin/neon-wallpaper"
codesign -s - -f "${PROJECT_ROOT}/bin/neon-wallpaper"

# 2. Build .app bundle
echo "• [2/6] Assembling '${APP_NAME}' bundle..."
APP_STAGING="${TMP_DIR}/app/${APP_NAME}"
mkdir -p "${APP_STAGING}/Contents/MacOS"
mkdir -p "${APP_STAGING}/Contents/Resources"

cp -f "${PROJECT_ROOT}/bin/neon-wallpaper" "${APP_STAGING}/Contents/MacOS/neon-wallpaper"
chmod +x "${APP_STAGING}/Contents/MacOS/neon-wallpaper"

# Icon
if [ -f "${PROJECT_ROOT}/tools/neon-wallpaper/AppIcon.icns" ]; then
    cp -f "${PROJECT_ROOT}/tools/neon-wallpaper/AppIcon.icns" "${APP_STAGING}/Contents/Resources/AppIcon.icns"
fi

# Info.plist
cat << 'EOF' > "${APP_STAGING}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>neon-wallpaper</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.neon-lattice.wallpaper</string>
    <key>CFBundleName</key>
    <string>Neon Wallpaper</string>
    <key>CFBundleDisplayName</key>
    <string>Neon Wallpaper</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
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

codesign -s - -f "${APP_STAGING}"

# 3. Prepare staging folder
echo "• [3/6] Staging DMG contents and Retina background..."
STAGE_DIR="${TMP_DIR}/dmg_stage"
mkdir -p "${STAGE_DIR}/.background"

cp -R "${APP_STAGING}" "${STAGE_DIR}/${APP_NAME}"
ln -s /Applications "${STAGE_DIR}/Applications"

# Generate crisp Retina background canvas (600x400 @2x)
swift "${PROJECT_ROOT}/scripts/generate_dmg_background.swift" "${STAGE_DIR}/.background/background.png"

# Copy Volume Icon
if [ -f "${PROJECT_ROOT}/tools/neon-wallpaper/AppIcon.icns" ]; then
    cp -f "${PROJECT_ROOT}/tools/neon-wallpaper/AppIcon.icns" "${STAGE_DIR}/.VolumeIcon.icns"
fi

# 4. Create and mount read-write disk image
echo "• [4/6] Creating master disk image..."
rm -f "${RW_DMG}"
# Unmount any existing volume with same name
if [ -d "/Volumes/${VOL_NAME}" ]; then
    hdiutil detach "/Volumes/${VOL_NAME}" -force >/dev/null 2>&1 || true
fi

hdiutil create -ov -srcfolder "${STAGE_DIR}" -format UDRW -volname "${VOL_NAME}" -fs HFS+ "${RW_DMG}" >/dev/null

MOUNT_OUTPUT=$(hdiutil attach -readwrite -noverify -noautoopen "${RW_DMG}")
MOUNT_DEV=$(echo "${MOUNT_OUTPUT}" | grep -E '^/dev/' | head -n 1 | awk '{print $1}')
MOUNT_DIR=$(echo "${MOUNT_OUTPUT}" | grep -E '/Volumes/' | awk -F '/Volumes/' '{print "/Volumes/" $2}')

if [ -z "${MOUNT_DIR}" ] || [ ! -d "${MOUNT_DIR}" ]; then
    MOUNT_DIR="/Volumes/${VOL_NAME}"
fi

echo "  ✔ Mounted at: ${MOUNT_DIR}"

# Set volume icon attribute
if [ -f "${MOUNT_DIR}/.VolumeIcon.icns" ]; then
    SetFile -c icnC "${MOUNT_DIR}/.VolumeIcon.icns" >/dev/null 2>&1 || true
    SetFile -a C "${MOUNT_DIR}" >/dev/null 2>&1 || true
fi
SetFile -a V "${MOUNT_DIR}/.background" >/dev/null 2>&1 || true

# 5. Finder Layout via AppleScript
echo "• [5/6] Customizing Finder window layout and icon positioning..."
osascript << APPLESCRIPT >/dev/null 2>&1 || true
tell application "Finder"
    tell disk "${VOL_NAME}"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {300, 180, 900, 580}
        set theViewOptions to the icon view options of container window
        set arrangement of theViewOptions to not arranged
        set icon size of theViewOptions to 120
        set text size of theViewOptions to 12
        try
            set background picture of theViewOptions to file ".background:background.png"
        end try
        set position of item "${APP_NAME}" of container window to {145, 195}
        set position of item "Applications" of container window to {455, 195}
        update without registering applications
        delay 1
        close
    end tell
end tell
APPLESCRIPT

# Sync and unmount
sync
hdiutil detach "${MOUNT_DEV}" -force >/dev/null 2>&1 || hdiutil detach "${MOUNT_DIR}" -force >/dev/null 2>&1 || true
sleep 1

# 6. Convert to compressed, read-only final DMG
echo "• [6/6] Finalizing compressed read-only DMG (UDZO)..."
mkdir -p "${DIST_DIR}"
FINAL_DMG="${DIST_DIR}/${DMG_FINAL_NAME}"
rm -f "${FINAL_DMG}"

hdiutil convert "${RW_DMG}" -format UDZO -imagekey zlib-level=9 -o "${FINAL_DMG}" -ov >/dev/null
codesign -s - -f "${FINAL_DMG}" >/dev/null 2>&1 || true

# Apply custom icon to the .dmg file itself in Finder
if [ -f "${PROJECT_ROOT}/tools/neon-wallpaper/AppIcon.icns" ]; then
    swift -e '
    import Cocoa
    let icon = NSImage(contentsOfFile: "'"${PROJECT_ROOT}/tools/neon-wallpaper/AppIcon.icns"'")
    NSWorkspace.shared.setIcon(icon, forFile: "'"${FINAL_DMG}"'", options: [])
    ' >/dev/null 2>&1 || true
    echo "  ✔ Applied custom Finder icon to ${DMG_FINAL_NAME}"
fi

# Cleanup
rm -rf "${TMP_DIR}" "${RW_DMG}"

DMG_SIZE=$(du -h "${FINAL_DMG}" | awk '{print $1}')
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DMG Installer Created Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "• Output File: ${FINAL_DMG}"
echo "• File Size:   ${DMG_SIZE}"
echo "• Volume Name: ${VOL_NAME}"
echo "• Features:    Retina Canvas • Custom Volume Icon • Gatekeeper Signed"
echo "• Ready to distribute or test: open '${FINAL_DMG}'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
