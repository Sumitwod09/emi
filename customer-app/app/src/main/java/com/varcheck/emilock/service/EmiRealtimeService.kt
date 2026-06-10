package com.varcheck.emilock.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.util.Base64
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import com.varcheck.emilock.BuildConfig
import com.varcheck.emilock.R
import com.varcheck.emilock.SupabaseClient
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import com.varcheck.emilock.ui.LockScreenActivity
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.Duration
import java.time.Instant
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class EmiRealtimeService : LifecycleService() {

    companion object {
        private const val TAG = "EmiRealtime"
        private const val CHANNEL_ID = "emi_realtime"
        private const val NOTIFICATION_ID = 1001
    }

    private var realtimeChannel: RealtimeChannel? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        subscribeToDeviceChanges()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }

    override fun onDestroy() {
        // Remove channel BEFORE super.onDestroy() cancels lifecycleScope
        realtimeChannel?.let {
            CoroutineScope(Dispatchers.IO).launch {
                try { SupabaseClient.client.removeChannel(it) } catch (_: Exception) {}
            }
        }
        super.onDestroy()
        sendBroadcast(Intent("com.varcheck.emilock.RESTART_SERVICE"))
    }

    private fun subscribeToDeviceChanges() {
        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, MODE_PRIVATE)
        val deviceId = prefs.getString(EmiDeviceAdminReceiver.KEY_DEVICE_ID, null) ?: run {
            Log.w(TAG, "No device_id provisioned — Realtime subscription skipped")
            return
        }

        realtimeChannel = SupabaseClient.client.channel("device-$deviceId")

        realtimeChannel!!
            .postgresChangeFlow<PostgresAction.Update>(schema = "public") {
                table = "devices"
                filter = "id=eq.$deviceId"
            }
            .onEach { change ->
                val status = change.record["status"]?.jsonPrimitive?.content
                val payloadElement = change.record["lock_payload"]
                Log.i(TAG, "Device row updated: status=$status")
                when (status) {
                    "locked"  -> payloadElement?.let { handleLock(it) }
                    "active"  -> handleUnlock()
                }
            }
            .catch { e -> Log.e(TAG, "Realtime flow error", e) }
            .launchIn(lifecycleScope)

        lifecycleScope.launch {
            try {
                realtimeChannel!!.subscribe()
                Log.i(TAG, "Subscribed to device $deviceId")
            } catch (e: Exception) {
                Log.e(TAG, "Subscribe failed", e)
            }
        }
    }

    private fun handleLock(payloadElement: JsonElement) {
        val payload   = payloadElement.jsonObject
        val action    = payload["action"]?.jsonPrimitive?.content ?: return
        val deviceId  = payload["device_id"]?.jsonPrimitive?.content ?: return
        val timestamp = payload["timestamp"]?.jsonPrimitive?.content ?: return
        val signature = payload["hmac_signature"]?.jsonPrimitive?.content ?: return

        if (!verifyHmac(action, deviceId, timestamp, signature)) {
            Log.e(TAG, "HMAC verification failed — ignoring LOCK command")
            return
        }

        // Reject commands older than 5 minutes (replay protection)
        try {
            val age = Duration.between(Instant.parse(timestamp), Instant.now()).toMinutes()
            if (age > 5) {
                Log.w(TAG, "Stale LOCK command ($age min old) — ignoring")
                return
            }
        } catch (e: Exception) {
            Log.w(TAG, "Timestamp parse failed: ${e.message}")
        }

        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, true)
            payload["due_amount"]?.jsonPrimitive?.content?.let    { putString(EmiDeviceAdminReceiver.KEY_OUTSTANDING_AMOUNT, it) }
            payload["store_name"]?.jsonPrimitive?.content?.let    { putString(EmiDeviceAdminReceiver.KEY_STORE_NAME, it) }
            payload["store_phone"]?.jsonPrimitive?.content?.let   { putString(EmiDeviceAdminReceiver.KEY_STORE_PHONE, it) }
            payload["store_address"]?.jsonPrimitive?.content?.let { putString(EmiDeviceAdminReceiver.KEY_STORE_ADDRESS, it) }
            apply()
        }

        startActivity(Intent(this, LockScreenActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        })
        Log.i(TAG, "Lock screen launched")
    }

    private fun handleUnlock() {
        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false).apply()
        sendBroadcast(Intent(LockScreenActivity.ACTION_UNLOCK))
        Log.i(TAG, "Unlock broadcast sent")
    }

    private fun verifyHmac(action: String, deviceId: String, ts: String, sig: String): Boolean {
        return try {
            val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, MODE_PRIVATE)
            val secret = prefs.getString(EmiDeviceAdminReceiver.KEY_HMAC_SECRET, null) ?: return false
            val mac = Mac.getInstance("HmacSHA256")
            mac.init(SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256"))
            val computed = Base64.encodeToString(
                mac.doFinal("$action|$deviceId|$ts".toByteArray(Charsets.UTF_8)),
                Base64.NO_WRAP
            )
            computed == sig
        } catch (e: Exception) {
            Log.e(TAG, "HMAC computation failed", e)
            false
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "EMI Lock Service",
            NotificationManager.IMPORTANCE_MIN
        ).apply {
            description = "Keeps EMI Lock monitoring active"
            setShowBadge(false)
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("EMI Lock")
            .setContentText("Device protection active")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }
}
