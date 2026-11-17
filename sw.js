/* SKODA A4 — Service Worker
   كل ما تعدّل في index.html زوّد الرقم ده واحد: v1 -> v2 -> v3 ... */
const VERSION = "v15";
const CACHE = "skoda-" + VERSION;

/* الملفات اللي بتتخزن للاستخدام من غير نت */
const SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./app.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* الصفحة: الشبكة الأول عشان التحديث يوصل فورًا، والكاش احتياطي */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      /* Firebase والخطوط تعدي عادي */

  const isPage = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  if (isPage) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match("./offline.html")))
    );
    return;
  }

  /* الأيقونات والملفات التانية: من الكاش الأول وبعدين الشبكة */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => hit))
  );
});

/* الصفحة بتسأل السيرفس ووركر عن رقم النسخة */
self.addEventListener("message", e => {
  if (e.data === "version" && e.source) e.source.postMessage({ version: VERSION });
});
