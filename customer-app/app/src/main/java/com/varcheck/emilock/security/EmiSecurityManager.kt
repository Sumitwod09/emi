package com.varcheck.emilock.security

import android.app.admin.DevicePolicyManager
import android.app.admin.FactoryResetProtectionPolicy
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.os.UserManager
import android.util.Log
import com.varcheck.emilock.admin.EmiDeviceAdminReceiver

class EmiSecurityManager(private val context: Context) {

    companion object {
        private const val TAG = "EmiSecurity"
    }

    private val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val admin = ComponentName(context, EmiDeviceAdminReceiver::class.java)

    fun applyAllRestrictions() {
        if (!dpm.isDeviceOwnerApp(context.packageName)) {
            Log.w(TAG, "Not device owner — restrictions not applied")
            return
        }

        // Block factory reset from Settings
        dpm.addUserRestriction(admin, UserManager.DISALLOW_FACTORY_RESET)

        // Block safe boot (would bypass startup lock)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_SAFE_BOOT)

        // Block ADB and developer options
        // Prevents: adb shell dpm remove-active-admin
        dpm.addUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)

        // Block adding new user profiles
        dpm.addUserRestriction(admin, UserManager.DISALLOW_ADD_USER)

        // Block external storage mounting
        dpm.addUserRestriction(admin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA)

        // Factory Reset Protection — after any reset, requires store Google account
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            dpm.setFactoryResetProtectionPolicy(
                admin,
                FactoryResetProtectionPolicy.Builder()
                    .setFactoryResetProtectionEnabled(true)
                    .build()
            )
        }

        Log.i(TAG, "All device restrictions applied")
    }

    fun disableStatusBar() {
        if (dpm.isDeviceOwnerApp(context.packageName)) {
            dpm.setStatusBarDisabled(admin, true)
        }
    }

    fun enableStatusBar() {
        if (dpm.isDeviceOwnerApp(context.packageName)) {
            dpm.setStatusBarDisabled(admin, false)
        }
    }
}
