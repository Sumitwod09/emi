package com.varcheck.emilock.security

import android.content.Context
import android.telephony.TelephonyManager
import android.util.Log
import com.varcheck.emilock.BuildConfig
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import java.net.HttpURLConnection
import java.net.URL

class SimChangeDetector(private val context: Context) {

    companion object {
        private const val TAG = "SimChangeDetector"
        private const val KEY_SIM_SERIAL = "sim_serial"
    }

    fun checkAndAlert() {
        val prefs = context.getSharedPreferences(
            EmiDeviceAdminReceiver.PREFS_NAME, Context.MODE_PRIVATE
        )
        val deviceId = prefs.getString(EmiDeviceAdminReceiver.KEY_DEVICE_ID, null) ?: return

        try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            @Suppress("DEPRECATION")
            val current = tm.simSerialNumber ?: return
            val stored = prefs.getString(KEY_SIM_SERIAL, null)

            if (stored == null) {
                prefs.edit().putString(KEY_SIM_SERIAL, current).apply()
                return
            }

            if (current != stored) {
                Log.w(TAG, "SIM change detected on device $deviceId")
                prefs.edit().putString(KEY_SIM_SERIAL, current).apply()
                alertServer(deviceId)
            }
        } catch (e: SecurityException) {
            Log.w(TAG, "READ_PHONE_STATE permission missing: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "SIM check failed", e)
        }
    }

    private fun alertServer(deviceId: String) {
        try {
            val url = "${BuildConfig.API_BASE_URL.trimEnd('/')}/api/devices/$deviceId/sim-changed"
            (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                outputStream.write("{}".toByteArray())
                responseCode
                disconnect()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to alert server about SIM change", e)
        }
    }
}
