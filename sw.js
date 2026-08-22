// Gia Sư PWA Service Worker v1.2.0
const CACHE_NAME = 'giasu-cache-v1.2.0';
const STATIC_ASSETS = [
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://i.postimg.cc/66rKbPmb/trinh-duyet.png'
];

// Cài đặt Service Worker và lưu trước các file tĩnh quan trọng
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA SW] Một số tài nguyên tĩnh không cache được:', err);
      });
    })
  );
  self.skipWaiting();
});

// Kích hoạt Service Worker và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý Request: Network-First (Luôn lấy dữ liệu mới nhất từ mạng, không cache API)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Bỏ qua các yêu cầu không phải GET hoặc là gọi API Supabase, Google Apps Script, Google Drive
  if (
    event.request.method !== 'GET' ||
    url.includes('supabase.co') ||
    url.includes('script.google.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('drive.google.com')
  ) {
    return;
  }

  // Network-First chiến lược cho các trang và file code
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Nếu tải thành công từ mạng và là asset tĩnh hợp lệ, lưu vào cache
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.includes('.css') || url.includes('.png') || url.includes('.jpg') || url.includes('fonts.'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Nếu mất mạng, fallback lấy từ cache nếu có
        return caches.match(event.request);
      })
  );
});
