package com.varcheck.emilock.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import com.varcheck.emilock.service.EmiRealtimeService
import com.varcheck.emilock.ui.LockScreenActivity
import com.varcheck.emilock.worker.LockStatusPollWorker

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "EmiBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        Log.i(TAG, "Boot completed")

        // Always restart the Realtime service on boot
        context.startForegroundService(Intent(context, EmiRealtimeService::class.java))

        // Schedule WorkManager polling (fallback for Realtime drops)
        LockStatusPollWorker.schedule(context)

        // Re-apply lock screen if device was locked before reboot
        val prefs = context.getSharedPreferences(
            EmiDeviceAdminReceiver.PREFS_NAME, Context.MODE_PRIVATE
        )
        if (prefs.getBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false)) {
            Log.i(TAG, "Device was locked before reboot — relaunching lock screen")
            context.startActivity(Intent(context, LockScreenActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            })
        }
    }
}
