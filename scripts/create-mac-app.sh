#!/bin/bash
set -e

APP_NAME="Nexus Command Center"
TARGET_DIR="/Users/symbrook/Applications/Chrome Apps.localized/${APP_NAME}.app"
CONTENTS_DIR="${TARGET_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
PROJECT_DIR="/Users/symbrook/Applications/Chrome Apps.localized/nexus-c2"

echo "Creating macOS application wrapper at: ${TARGET_DIR}"

mkdir -p "${MACOS_DIR}"
mkdir -p "${RESOURCES_DIR}"

# 1. Info.plist
cat << 'EOF' > "${CONTENTS_DIR}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleExecutable</key>
	<string>nexus-launcher</string>
	<key>CFBundleIconFile</key>
	<string>app.icns</string>
	<key>CFBundleIdentifier</key>
	<string>com.nexus.c2.commandcenter</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Nexus Command Center</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>LSMinimumSystemVersion</key>
	<string>12.0</string>
	<key>NSHighResolutionCapable</key>
	<true/>
</dict>
</plist>
EOF

# 2. Executable launcher script
cat << 'EOF' > "${MACOS_DIR}/nexus-launcher"
#!/bin/bash
PROJECT_DIR="/Users/symbrook/Applications/Chrome Apps.localized/nexus-c2"

# Check if port 3030 is responding
if ! curl -s --head --request GET http://localhost:3030 | grep "200 OK" > /dev/null; then
    # Start the server in the background
    cd "${PROJECT_DIR}"
    nohup /opt/homebrew/bin/bun run start > /tmp/nexus-c2.log 2>&1 &
    sleep 2
fi

# Launch in Chrome app mode if Chrome exists, otherwise default browser
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "/Applications/Google Chrome.app" --args --app="http://localhost:3030"
else
    open "http://localhost:3030"
fi
EOF

chmod +x "${MACOS_DIR}/nexus-launcher"

echo "Successfully built ${APP_NAME}.app inside Chrome Apps folder!"
