/* يظبط مشروع الأندرويد بعد ما Capacitor يعمله:
   - الصلاحيات (كاميرا لتصوير العداد، بصمة، إنترنت، إشعارات)
   - رقم النسخة من رقم التشغيل في GitHub Actions
   - إعدادات التوقيع عشان الـ APK يطلع موقّع
   التشغيل:  node scripts/patch-android.js  */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const AND = path.join(ROOT, "android");
if (!fs.existsSync(AND)) {
  console.error("android folder missing - run: npx cap add android");
  process.exit(1);
}

/* 1) الصلاحيات */
const MANIFEST = path.join(AND, "app/src/main/AndroidManifest.xml");
let man = fs.readFileSync(MANIFEST, "utf8");

const PERMS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.CAMERA",
  "android.permission.USE_BIOMETRIC",
  "android.permission.USE_FINGERPRINT",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION"
];
PERMS.forEach(function (p) {
  if (man.indexOf(p) < 0) {
    man = man.replace("</manifest>", "    <uses-permission android:name=\"" + p + "\" />\n</manifest>");
    console.log("+ " + p);
  }
});

["android.hardware.camera", "android.hardware.camera.autofocus"].forEach(function (f) {
  if (man.indexOf("android:name=\"" + f + "\"") < 0) {
    man = man.replace("</manifest>", "    <uses-feature android:name=\"" + f + "\" android:required=\"false\" />\n</manifest>");
  }
});

if (man.indexOf("android:supportsRtl") < 0) {
  man = man.replace("<application", "<application android:supportsRtl=\"true\"");
  console.log("+ RTL");
}
fs.writeFileSync(MANIFEST, man);

/* 2) رقم النسخة */
const GRADLE = path.join(AND, "app/build.gradle");
let g = fs.readFileSync(GRADLE, "utf8");
const run = parseInt(process.env.GITHUB_RUN_NUMBER || "1", 10);
g = g.replace(/versionCode\s+\d+/, "versionCode " + run);
g = g.replace(/versionName\s+"[^"]*"/, "versionName \"1.0." + run + "\"");

/* 3) التوقيع */
if (process.env.ANDROID_KEYSTORE_PASSWORD && g.indexOf("signingConfigs") < 0) {
  const block = [
    "    signingConfigs {",
    "        release {",
    "            storeFile file(System.getenv(\"ANDROID_KEYSTORE_PATH\"))",
    "            storePassword System.getenv(\"ANDROID_KEYSTORE_PASSWORD\")",
    "            keyAlias System.getenv(\"ANDROID_KEY_ALIAS\") ?: \"key0\"",
    "            keyPassword System.getenv(\"ANDROID_KEY_PASSWORD\") ?: System.getenv(\"ANDROID_KEYSTORE_PASSWORD\")",
    "        }",
    "    }",
    ""
  ].join("\n");
  g = g.replace(/android\s*\{/, "android {\n" + block);
  g = g.replace(/buildTypes\s*\{\s*release\s*\{/, "buildTypes {\n        release {\n            signingConfig signingConfigs.release");
  console.log("+ signing");
}
fs.writeFileSync(GRADLE, g);

/* 4) أيقونة البرنامج من app.png اللي في جذر المشروع */
const ICON = path.join(ROOT, "..", "app.png");
if (fs.existsSync(ICON)) {
  const RES = path.join(AND, "app/src/main/res");
  const img = fs.readFileSync(ICON);
  fs.readdirSync(RES).forEach(function (d) {
    if (d.indexOf("mipmap") !== 0) return;
    const dir = path.join(RES, d);
    if (d.indexOf("anydpi") >= 0) {
      fs.readdirSync(dir).forEach(function (f) { fs.unlinkSync(path.join(dir, f)); });
      try { fs.rmdirSync(dir); } catch (e) {}
      return;
    }
    ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"].forEach(function (n) {
      try { fs.writeFileSync(path.join(dir, n), img); } catch (e) {}
    });
  });
  console.log("+ icon");
}

/* 5) دخول جوجل من جوه التطبيق (زي مصاريف البيت) */
const VARS = path.join(AND, "variables.gradle");
if (fs.existsSync(VARS)) {
  let v = fs.readFileSync(VARS, "utf8");
  if (v.indexOf("rgcfaIncludeGoogle") < 0) {
    v = v.replace(/ext\s*\{/, "ext {\n    rgcfaIncludeGoogle = true");
    fs.writeFileSync(VARS, v);
    console.log("+ google sign-in");
  }
}
const GS = path.join(ROOT, "google-services.json");
if (fs.existsSync(GS)) {
  fs.copyFileSync(GS, path.join(AND, "app/google-services.json"));
  console.log("+ google-services.json");
}

console.log("android project patched - version 1.0." + run);
