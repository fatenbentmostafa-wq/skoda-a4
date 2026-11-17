/* ════════════════════════════════════════════════════════════════
   إعدادات Firebase — نفس مشروع «مصاريف البيت» (masareef-elbeit)

   إزاي تملاه:
   1) افتح index.html بتاع masareef وانسخ منه بلوك firebaseConfig
      (أو من Firebase Console ← ⚙ Project settings ← Your apps ← Web app ← Config)
   2) الصق القيم مكان اللي تحت بالظبط، وسيب الأقواس زي ما هي.
   3) احفظ وارفع الملف.

   ملحوظة: الأرقام دي مش كلمة سر — بتبقى موجودة في أي تطبيق ويب،
   والحماية الحقيقية من قواعد firestore.rules.
   ════════════════════════════════════════════════════════════════ */

window.FB_CONFIG = {
  apiKey:            "ضع_apiKey_هنا",
  authDomain:        "masareef-elbeit.firebaseapp.com",
  projectId:         "masareef-elbeit",
  storageBucket:     "ضع_storageBucket_هنا",
  messagingSenderId: "ضع_messagingSenderId_هنا",
  appId:             "ضع_appId_هنا"
};

/* لحد ما تملا الملف ده، البرنامج بيشتغل على الجهاز من غير مزامنة. */
