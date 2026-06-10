plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

// Extract gradle.properties values first — avoids nested-quote issues in buildConfigField
val supabaseUrl: String = project.findProperty("SUPABASE_URL")?.toString() ?: ""
val supabaseAnonKey: String = project.findProperty("SUPABASE_ANON_KEY")?.toString() ?: ""
val apiBaseUrl: String = project.findProperty("API_BASE_URL")?.toString() ?: ""

android {
    namespace = "com.varcheck.emilock"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.varcheck.emilock"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        buildConfigField("String", "SUPABASE_URL",    "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$supabaseAnonKey\"")
        buildConfigField("String", "API_BASE_URL",    "\"$apiBaseUrl\"")
    }
    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions { jvmTarget = "11" }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)

    // Supabase Kotlin SDK
    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.realtime)
    implementation(libs.supabase.gotrue)
    implementation(libs.ktor.android)
    implementation(libs.ktor.websockets)

    // WorkManager
    implementation(libs.work.runtime.ktx)

    // Coroutines
    implementation(libs.coroutines.android)
    implementation(libs.coroutines.play)   // needed by IntegrityChecker .await()

    // Lifecycle
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.lifecycle.service)

    // Play Integrity
    implementation(libs.play.integrity)

    // HTTP client
    implementation(libs.okhttp)

    // Java 8+ backport for minSdk 23
    coreLibraryDesugaring(libs.desugar.jdk.libs)
}
