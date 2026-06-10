package com.varcheck.emilock.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import com.varcheck.emilock.network.ApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Called once by setup-device-owner.sh via ADB:
//   adb shell am broadcast \
//     -a com.varcheck.emilock.ACTION_PROVISION \
//     -p com.varcheck.emilock \
//     --es device_id "<uuid-from-dashboard>" \
//     --es hmac_secret "<hex-from-devices-table>"
class ProvisioningReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "Provisioning"
        const val ACTION_PROVISION = "com.varcheck.emilock.ACTION_PROVISION"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_PROVISION) return

        val deviceId   = intent.getStringExtra("device_id")?.trim()
        val hmacSecret = intent.getStringExtra("hmac_secret")?.trim()

        if (deviceId.isNullOrBlank() || hmacSecret.isNullOrBlank()) {
            Log.e(TAG, "Provisioning failed: device_id or hmac_secret missing")
            return
        }

        val prefs = context.getSharedPreferences(
            EmiDeviceAdminReceiver.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit().apply {
            putString(EmiDeviceAdminReceiver.KEY_DEVICE_ID, deviceId)
            putString(EmiDeviceAdminReceiver.KEY_HMAC_SECRET, hmacSecret)
            // Clear any stale lock state from a previous provisioning
            putBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false)
            apply()
        }

        Log.i(TAG, "Device provisioned successfully: $deviceId")

        // Register this device's key with the backend so the web platform
        // knows which Supabase anon key is on this device
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ApiClient.registerDeviceKey(deviceId, "anon")
            } catch (e: Exception) {
                Log.w(TAG, "registerDeviceKey failed (will retry on next launch): ${e.message}")
            }
        }
    }
}
