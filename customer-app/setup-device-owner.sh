#!/bin/bash
# EMI Lock v2.0 — Device Owner Setup Script
# Run once per customer device before handing it over.
#
# Prerequisites:
#   - adb installed and in PATH
#   - USB debugging enabled on device
#   - Factory reset recommended first (no Google accounts)
#   - Build Supabase URL + anon key into the APK via gradle.properties

set -e

APK_PATH="${1:-app/build/outputs/apk/release/app-release.apk}"
PACKAGE="com.varcheck.emilock"
ADMIN_RECEIVER="$PACKAGE/.admin.EmiDeviceAdminReceiver"

echo "=== EMI Lock v2.0 Device Provisioning ==="
echo ""

# 1. Verify ADB connection
echo "[1/6] Checking ADB connection..."
adb devices -l
echo ""

# 2. Check for accounts (device owner setup fails if accounts exist)
echo "[2/6] Checking for existing accounts..."
ACCT_COUNT=$(adb shell dumpsys account 2>/dev/null | grep -c "Account {" || true)
if [ "$ACCT_COUNT" -gt "0" ]; then
  echo "WARNING: $ACCT_COUNT account(s) found. Remove them before setting device owner:"
  echo "  Settings → Accounts → Remove all accounts"
  echo "  Or factory reset the device first."
  echo ""
fi

# 3. Install APK
echo "[3/6] Installing EMI Lock APK from: $APK_PATH"
adb install -r "$APK_PATH"
echo "APK installed."
echo ""

# 4. Set Device Owner
echo "[4/6] Setting Device Owner..."
adb shell dpm set-device-owner "$ADMIN_RECEIVER"
echo "Device Owner set successfully."
echo ""

# 5. Provision device credentials (device_id and hmac_secret must match the web backend)
#    Usage: DEVICE_ID=<uuid> HMAC_SECRET=<hex> ./setup-device-owner.sh
if [ -n "$DEVICE_ID" ] && [ -n "$HMAC_SECRET" ]; then
  echo "[5/6] Provisioning device credentials..."
  adb shell am broadcast \
    -a "$PACKAGE.ACTION_PROVISION" \
    -p "$PACKAGE" \
    --es device_id "$DEVICE_ID" \
    --es hmac_secret "$HMAC_SECRET"
  echo "Credentials provisioned."
else
  echo "[5/6] Skipping credential provisioning (DEVICE_ID and HMAC_SECRET not set)."
  echo "      Re-run with:"
  echo "      DEVICE_ID=<uuid-from-web-dashboard> HMAC_SECRET=<hex-from-db> $0"
fi

# 6. Lock bootloader (recommended — run manually in fastboot)
echo ""
echo "[6/6] MANUAL STEP: Lock bootloader to prevent rooting and ROM flashing."
echo "      1. Power off the device"
echo "      2. Boot into fastboot: hold Power + Volume Down for 5s"
echo "      3. Run: fastboot flashing lock"
echo "      4. Confirm on device screen"
echo "      5. Device factory resets — reinstall APK and re-run this script"
echo "      6. Add store Google account LAST (enables FRP after factory reset)"
echo ""

echo "=== Setup Complete ==="
echo "Verify Device Owner:"
echo "  adb shell dpm list-owners"
echo ""
echo "Test Realtime lock:"
echo "  1. Open Supabase Dashboard"
echo "  2. Table Editor → devices → set status='locked' on your test row"
echo "  3. Verify lock screen appears on device within ~5s"
