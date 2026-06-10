package com.varcheck.emilock.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.varcheck.emilock.BuildConfig
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import com.varcheck.emilock.databinding.ActivityMainBinding
import com.varcheck.emilock.security.EmiSecurityManager
import com.varcheck.emilock.security.IntegrityChecker
import com.varcheck.emilock.security.SimChangeDetector
import com.varcheck.emilock.service.EmiRealtimeService
import com.varcheck.emilock.worker.LockStatusPollWorker
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "EmiMain"
    }

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applySecurityRestrictions()
        startRealtimeService()
        LockStatusPollWorker.schedule(this)
        checkIfLocked()
        runPeriodicChecks()
    }

    private fun applySecurityRestrictions() {
        EmiSecurityManager(this).applyAllRestrictions()
    }

    private fun startRealtimeService() {
        startForegroundService(Intent(this, EmiRealtimeService::class.java))
    }

    private fun checkIfLocked() {
        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, Context.MODE_PRIVATE)
        if (prefs.getBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false)) {
            Log.i(TAG, "Device locked at startup — showing lock screen")
            startActivity(Intent(this, LockScreenActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK)
            })
            finish()
            return
        }
        binding.tvStatus.text = "Device protected"
    }

    private fun runPeriodicChecks() {
        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, Context.MODE_PRIVATE)
        val deviceId = prefs.getString(EmiDeviceAdminReceiver.KEY_DEVICE_ID, null) ?: return
        val apiBase = BuildConfig.API_BASE_URL

        SimChangeDetector(this).checkAndAlert()

        lifecycleScope.launch {
            IntegrityChecker(this@MainActivity).checkAndReport(deviceId, apiBase)
        }
    }
}
