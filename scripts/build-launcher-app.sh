#!/bin/bash
# Cria Sense Barbershop.app — duplo-clique sem abrir o Terminal

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Sense Barbershop.app"
APP_DIR="$ROOT/$APP_NAME"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"

rm -rf "$APP_DIR"
mkdir -p "$MACOS" "$RESOURCES"

cat > "$MACOS/Sense Barbershop" <<'LAUNCHER'
#!/bin/bash
APP_BUNDLE="$(cd "$(dirname "$0")/../.." && pwd)"
ROOT="$(cd "$APP_BUNDLE/../../.." && pwd)"
# App fica em PROJECT/Sense Barbershop.app → subir 1 nível
if [ -f "$APP_BUNDLE/../../scripts/sense-server.sh" ]; then
    ROOT="$(cd "$APP_BUNDLE/../.." && pwd)"
fi

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
"$ROOT/scripts/install-autostart.sh" >/dev/null 2>&1 || true
"$ROOT/scripts/sense-server.sh" start >/dev/null 2>&1 || true
sleep 1
open "http://localhost:3000"
LAUNCHER

# Corrigir ROOT no launcher (app dentro do projeto)
cat > "$MACOS/Sense Barbershop" <<LAUNCHER
#!/bin/bash
ROOT="$ROOT"
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:\$PATH"
"\$ROOT/scripts/install-autostart.sh" >/dev/null 2>&1 || true
"\$ROOT/scripts/sense-server.sh" start >/dev/null 2>&1 || true
sleep 1
open "http://localhost:3000"
LAUNCHER

chmod +x "$MACOS/Sense Barbershop"

cat > "$CONTENTS/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Sense Barbershop</string>
    <key>CFBundleIdentifier</key>
    <string>pt.sensebarbershop.launcher</string>
    <key>CFBundleName</key>
    <string>Sense Barbershop</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
PLIST

if [ -f "$ROOT/frontend/assets/logo.png" ]; then
    cp "$ROOT/frontend/assets/logo.png" "$RESOURCES/AppIcon.png" 2>/dev/null || true
fi

echo "✓ $APP_NAME criado em $ROOT"
