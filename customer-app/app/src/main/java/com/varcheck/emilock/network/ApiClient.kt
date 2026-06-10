package com.varcheck.emilock.network

import android.util.Log
import com.varcheck.emilock.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

object ApiClient {

    private const val TAG = "EmiApiClient"
    private val JSON = "application/json; charset=utf-8".toMediaType()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val baseUrl get() = BuildConfig.API_BASE_URL.trimEnd('/')

    suspend fun registerDeviceKey(deviceId: String, deviceKey: String) = withContext(Dispatchers.IO) {
        put("/api/devices/$deviceId/device-key", """{"device_key":"$deviceKey"}""")
    }

    suspend fun reportAdminDisabled(deviceId: String) = withContext(Dispatchers.IO) {
        post("/api/devices/$deviceId/integrity-alert", """{"reason":"device_admin_disabled"}""")
    }

    suspend fun reportSimChanged(deviceId: String) = withContext(Dispatchers.IO) {
        post("/api/devices/$deviceId/sim-changed", "{}")
    }

    private fun put(path: String, jsonBody: String) {
        try {
            val request = Request.Builder()
                .url("$baseUrl$path")
                .put(jsonBody.toRequestBody(JSON))
                .build()
            httpClient.newCall(request).execute().use { response ->
                Log.i(TAG, "PUT $path → ${response.code}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "PUT $path failed: ${e.message}")
        }
    }

    private fun post(path: String, jsonBody: String) {
        try {
            val request = Request.Builder()
                .url("$baseUrl$path")
                .post(jsonBody.toRequestBody(JSON))
                .build()
            httpClient.newCall(request).execute().use { response ->
                Log.i(TAG, "POST $path → ${response.code}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "POST $path failed: ${e.message}")
        }
    }
}
