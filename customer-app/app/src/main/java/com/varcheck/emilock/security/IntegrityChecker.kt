package com.varcheck.emilock.security

import android.content.Context
import android.util.Base64
import android.util.Log
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.StandardIntegrityManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

class IntegrityChecker(private val context: Context) {

    companion object {
        private const val TAG = "IntegrityChecker"
        // Replace with your Google Cloud project number from Play Console
        private const val CLOUD_PROJECT_NUMBER = 0L
    }

    suspend fun checkAndReport(deviceId: String, apiBaseUrl: String) = withContext(Dispatchers.IO) {
        if (CLOUD_PROJECT_NUMBER == 0L) {
            Log.w(TAG, "CLOUD_PROJECT_NUMBER not configured — integrity check skipped")
            return@withContext
        }
        try {
            val manager = IntegrityManagerFactory.createStandard(context)
            val provider = manager.prepareIntegrityToken(
                StandardIntegrityManager.PrepareIntegrityTokenRequest.builder()
                    .setCloudProjectNumber(CLOUD_PROJECT_NUMBER)
                    .build()
            ).await()

            val token = provider.request(
                StandardIntegrityManager.StandardIntegrityTokenRequest.builder()
                    .setRequestHash(generateRequestHash(deviceId))
                    .build()
            ).await().token()

            postJson("${apiBaseUrl.trimEnd('/')}/api/devices/$deviceId/integrity", """{"token":"$token"}""")
            Log.i(TAG, "Integrity token sent to backend")
        } catch (e: Exception) {
            Log.e(TAG, "Integrity check failed: ${e.message}")
            try {
                postJson(
                    "${apiBaseUrl.trimEnd('/')}/api/devices/$deviceId/integrity-alert",
                    """{"reason":"${e.message?.replace("\"", "'")}"}"""
                )
            } catch (_: Exception) {}
        }
    }

    private fun generateRequestHash(deviceId: String): String {
        val data = "$deviceId${System.currentTimeMillis() / 60_000}"
        return Base64.encodeToString(
            MessageDigest.getInstance("SHA-256").digest(data.toByteArray()),
            Base64.NO_WRAP
        )
    }

    private fun postJson(url: String, body: String) {
        (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            connectTimeout = 10_000
            readTimeout = 10_000
            doOutput = true
            outputStream.write(body.toByteArray())
            responseCode // triggers request
            disconnect()
        }
    }
}
