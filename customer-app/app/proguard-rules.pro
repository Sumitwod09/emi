# Kotlin Serialization — keep all @Serializable classes from being renamed/stripped
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep all @Serializable data classes used by Supabase Kotlin SDK
-keep,includedescriptorclasses class com.varcheck.emilock.**$$serializer { *; }
-keepclassmembers class com.varcheck.emilock.** {
    *** Companion;
}
-keepclasseswithmembers class com.varcheck.emilock.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Supabase Ktor client — keep OkHttp engine
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Ktor
-keep class io.ktor.** { *; }
-keep class kotlinx.coroutines.** { *; }

# Play Integrity API
-keep class com.google.android.play.core.integrity.** { *; }

# WorkManager
-keep class androidx.work.** { *; }
-keep class * extends androidx.work.Worker
-keep class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}

# Keep Supabase serializable models
-keep @kotlinx.serialization.Serializable class * { *; }
