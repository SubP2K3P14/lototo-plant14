/* Service worker Digital LOTOTO Register.
   Menyimpan tampilan aplikasi supaya cepat dibuka dari ikon di ponsel.
   Data LOTOTO TIDAK disimpan di sini: selalu diambil langsung dari Supabase.
   Naikkan angka VERSI setiap kali file aplikasi diperbarui. */
const VERSI = "lototo-v2";
const SUPABASE_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSI)
    .then(c => c.addAll(SHELL).then(() => c.add(SUPABASE_LIB).catch(() => {})))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSI).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Halaman aplikasi: ambil versi terbaru dari internet, pakai simpanan kalau sedang offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(VERSI).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }

  // Pustaka Supabase (versi terkunci) dan ikon: pakai simpanan dulu
  if (req.url === SUPABASE_LIB || (url.origin === location.origin && /\.(png|webmanifest)$/.test(url.pathname))) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSI).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // Selain itu (database, login, foto bukti Supabase, font): langsung ke internet, tidak disimpan
});
