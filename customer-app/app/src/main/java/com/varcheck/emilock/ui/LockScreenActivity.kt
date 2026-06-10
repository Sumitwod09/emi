package com.varcheck.emilock.ui

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver
import com.varcheck.emilock.databinding.ActivityLockScreenBinding
import com.varcheck.emilock.security.EmiSecurityManager

class LockScreenActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "LockScreen"
        const val ACTION_UNLOCK = "com.varcheck.emilock.ACTION_UNLOCK"
    }

    private lateinit var binding: ActivityLockScreenBinding
    private lateinit var securityManager: EmiSecurityManager

    private val unlockReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == ACTION_UNLOCK) {
                Log.i(TAG, "Unlock broadcast received — exiting kiosk")
                exitKioskMode()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over existing lock screen and turn on display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        (getSystemService(KEYGUARD_SERVICE) as KeyguardManager).let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                it.requestDismissKeyguard(this, null)
            }
        }

        binding = ActivityLockScreenBinding.inflate(layoutInflater)
        setContentView(binding.root)

        securityManager = EmiSecurityManager(this)

        loadPaymentInfo()
        startKioskMode()
        registerUnlockReceiver()
        setupButtons()
    }

    override fun onResume() {
        super.onResume()
        securityManager.disableStatusBar()
        // Re-enter kiosk if still locked
        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, MODE_PRIVATE)
        if (prefs.getBoolean(EmiDeviceAdminReceiver.KEY_IS_LOCKED, false)) {
            try { startLockTask() } catch (_: Exception) {}
        }
    }

    override fun onPause() {
        super.onPause()
        securityManager.enableStatusBar()
    }

    override fun onStop() {
        super.onStop()
        // Re-launch self to prevent home screen access
        startActivity(Intent(this, LockScreenActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        })
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Blocked — no super call
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_HOME,
            KeyEvent.KEYCODE_APP_SWITCH,
            KeyEvent.KEYCODE_MENU -> true
            else -> super.onKeyDown(keyCode, event)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(unlockReceiver)
    }

    private fun startKioskMode() {
        try {
            startLockTask()
            Log.i(TAG, "Lock task mode started")
        } catch (e: Exception) {
            Log.w(TAG, "startLockTask failed (device owner not set?): ${e.message}")
        }
    }

    private fun exitKioskMode() {
        try { stopLockTask() } catch (e: Exception) {
            Log.w(TAG, "stopLockTask failed: ${e.message}")
        }
        finish()
    }

    private fun loadPaymentInfo() {
        val prefs = getSharedPreferences(EmiDeviceAdminReceiver.PREFS_NAME, MODE_PRIVATE)
        val storeName   = prefs.getString(EmiDeviceAdminReceiver.KEY_STORE_NAME, "Your Store") ?: "Your Store"
        val outstanding = prefs.getString(EmiDeviceAdminReceiver.KEY_OUTSTANDING_AMOUNT, "0") ?: "0"
        val missedCount = prefs.getString(EmiDeviceAdminReceiver.KEY_MISSED_COUNT, "1") ?: "1"
        val storeAddr   = prefs.getString(EmiDeviceAdminReceiver.KEY_STORE_ADDRESS, "") ?: ""
        val storePhone  = prefs.getString(EmiDeviceAdminReceiver.KEY_STORE_PHONE, null)

        binding.tvStoreName.text    = storeName
        binding.tvAmountDue.text    = "₹ $outstanding"
        binding.tvMissedCount.text  = "$missedCount payment${if (missedCount != "1") "s" else ""} missed"
        binding.tvStoreAddress.text = "📍 $storeAddr"
        binding.btnCallStore.text   = "📞 Call Store${if (!storePhone.isNullOrBlank()) ": $storePhone" else ""}"
        binding.btnCallStore.tag    = storePhone
    }

    private fun registerUnlockReceiver() {
        val filter = IntentFilter(ACTION_UNLOCK)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(unlockReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(unlockReceiver, filter)
        }
    }

    private fun setupButtons() {
        binding.btnCallStore.setOnClickListener {
            val phone = it.tag as? String
            if (!phone.isNullOrBlank()) {
                startActivity(Intent(Intent.ACTION_CALL, Uri.parse("tel:$phone")))
            }
        }

        binding.btnEmergency.setOnClickListener {
            startActivity(Intent(Intent.ACTION_CALL, Uri.parse("tel:112")))
        }
    }
}
