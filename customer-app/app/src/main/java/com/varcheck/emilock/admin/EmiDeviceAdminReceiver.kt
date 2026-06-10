package com.varcheck.emilock.admin

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.varcheck.emilock.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.HttpURLConnection
import java.net.URL

class EmiDeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "EmiDeviceAdmin"
        const val PREFS_NAME = "emi_lock_prefs"
        const val KEY_DEVICE_ID = "device_id"
        const val KEY_HMAC_SECRET = "hmac_secret"
        const val KEY_IS_LOCKED = "is_locked"
        const val KEY_STORE_PHONE = "store_phone"
        const val KEY_STORE_NAME = "store_name"
        const val KEY_STORE_ADDRESS = "store_address"
        const val KEY_OUTSTANDING_AMOUNT = "outstanding_amount"
        const val KEY_MISSED_COUNT = "missed_count"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device admin enabled")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.w(TAG, "Device admin disabled — notifying server")
        notifyServerAdminDisabled(context)
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        notifyServerAdminDisabled(context)
        return "Disabling EMI Lock admin may violate your EMI agreement."
    }

    private fun notifyServerAdminDisabled(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val deviceId = prefs.getString(KEY_DEVICE_ID, null) ?: return
        val apiBase = BuildConfig.API_BASE_URL.trimEnd('/')
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = "$apiBase/api/devices/$deviceId/integrity-alert"
                (URL(url).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    outputStream.write("""{"reason":"device_admin_disabled"}""".toByteArray())
                    responseCode
                    disconnect()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to notify server of admin disable", e)
            }
        }
    }
}
