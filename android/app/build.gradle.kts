import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

val canonicalSigningFile = File(System.getProperty("user.home"), ".config/vexel/medsims-signing/signing.properties")
val canonicalSigning = Properties().apply {
    if (canonicalSigningFile.isFile) canonicalSigningFile.inputStream().use(::load)
}
val canonicalSigningKeys = listOf("storeFile", "storePassword", "keyAlias", "keyPassword")
val hasCanonicalSigning = canonicalSigningFile.isFile && canonicalSigningKeys.all { !canonicalSigning.getProperty(it).isNullOrBlank() } && File(canonicalSigning.getProperty("storeFile", "")).isFile

android {
    namespace = "pk.vexel.medsims"
    compileSdk = 36

    defaultConfig {
        applicationId = "pk.vexel.medsims"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    signingConfigs {
        if (hasCanonicalSigning) {
            create("playRelease") {
                storeFile = file(canonicalSigning.getProperty("storeFile"))
                storePassword = canonicalSigning.getProperty("storePassword")
                keyAlias = canonicalSigning.getProperty("keyAlias")
                keyPassword = canonicalSigning.getProperty("keyPassword")
            }
        }
    }
    buildTypes {
        debug { buildConfigField("String", "API_BASE_URL", "\"https://sims.vexel.pk/\"") }
        release {
            isMinifyEnabled = false
            buildConfigField("String", "API_BASE_URL", "\"https://sims.vexel.pk/\"")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasCanonicalSigning) signingConfig = signingConfigs.getByName("playRelease")
        }
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

tasks.configureEach {
    if (name == "bundleRelease") doFirst {
        check(hasCanonicalSigning) { "MedSIMS canonical Play signing configuration not found. Expected: $canonicalSigningFile. See android/docs/PLAY_SIGNING.md." }
    }
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation(libs.androidx.core); implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime); implementation(libs.lifecycle.viewmodel)
    implementation(libs.navigation.compose)
    implementation(platform(libs.compose.bom)); implementation(libs.compose.ui); implementation(libs.compose.material3)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.hilt.android); ksp(libs.hilt.compiler); implementation(libs.hilt.navigation)
    implementation(libs.retrofit); implementation(libs.retrofit.serialization); implementation(libs.okhttp); implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization); implementation(libs.security.crypto)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit); androidTestImplementation(libs.espresso); androidTestImplementation(platform(libs.compose.bom)); androidTestImplementation(libs.compose.ui.test)
}
