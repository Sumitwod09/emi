package com.varcheck.emilock.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.varcheck.emilock.service.EmiRealtimeService

class ServiceRestartReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ServiceRestartReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "com.varcheck.emilock.RESTART_SERVICE") return
        Log.i(TAG, "Restarting EmiRealtimeService")
        context.startForegroundService(Intent(context, EmiRealtimeService::class.java))
    }
}
