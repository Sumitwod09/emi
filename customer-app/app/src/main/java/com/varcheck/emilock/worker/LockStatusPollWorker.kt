package com.varcheck.emilock.worker

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.varcheck.emilock.BuildConfig
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import com.varcheck.emilock.ui.LockScreenActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class LockStatusPollWorker(
    private val appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    companion object {
        private const val TAG = "LockStatusPoller"
        private const val WORK_NAME = "lock_status_poll"

        fun schedule(context: Context) {
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<LockStatusPollWorker>(15, TimeUnit.MINUTES)
                    .setConstraints(
                        Constraints.Builder()
                            .setRequiredNetworkType(NetworkType.CONNECTED)
                            .build()
                    )
                    .build()
            )
        }
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val prefs = appContext.getSharedPreferences(
                EmiDeviceAdminReceiver.PREFS_NAME, Context.MODE_PRIVATE
            )
            val deviceId = prefs.getString(EmiDeviceAdminReceiver.KEY_DEVICE_ID, null)
                ?: return@withContext Result.success()

            val apiBase = BuildConfig.API_BASE_URL.trimEnd('/')
            val request = Request.Builder()
                .url("$apiBase/api/devices/$deviceId/status")
                .get()
                .build()

            val responseBody = httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext Result.retry()
                response.body?.string() ?: return@withContext Result.retry()
            }

            val json = JSONObject(responseBody)
            val serverStatus = json.optString("status")
            val isLocallyLocked = prefs.getBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false)

            if (serverStatus == "locked" && !isLocallyLocked) {
                Log.i(TAG, "WorkManager detected device should be locked — activating lock screen")
                prefs.edit().putBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, true).apply()

                // Extract lock payload for store info if available
                val lockPayload = json.optJSONObject("lock_payload")
                if (lockPayload != null) {
                    prefs.edit().apply {
                        lockPayload.optString("due_amount").takeIf { it.isNotEmpty() }?.let {
                            putString(EmiDeviceAdminReceiver.KEY_OUTSTANDING_AMOUNT, it)
                        }
                        lockPayload.optString("store_name").takeIf { it.isNotEmpty() }?.let {
                            putString(EmiDeviceAdminReceiver.KEY_STORE_NAME, it)
                        }
                        lockPayload.optString("store_phone").takeIf { it.isNotEmpty() }?.let {
                            putString(EmiDeviceAdminReceiver.KEY_STORE_PHONE, it)
                        }
                        lockPayload.optString("store_address").takeIf { it.isNotEmpty() }?.let {
                            putString(EmiDeviceAdminReceiver.KEY_STORE_ADDRESS, it)
                        }
                        apply()
                    }
                }

                appContext.startActivity(
                    Intent(appContext, LockScreenActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    }
                )
            } else if (serverStatus == "active" && isLocallyLocked) {
                Log.i(TAG, "WorkManager detected device should be unlocked — sending unlock broadcast")
                prefs.edit().putBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false).apply()
                appContext.sendBroadcast(Intent(LockScreenActivity.ACTION_UNLOCK))
            }

            Result.success()
        } catch (e: Exception) {
            Log.w(TAG, "Poll failed: ${e.message}")
            Result.retry()
        }
    }
}
