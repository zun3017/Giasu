// Service Worker - Ngăn iOS PWA reload trang khi chọn file từ camera/gallery
const CACHE_NAME = 'giasu-tutor-v1';

// Các file cần cache để offline + ngăn reload
const STATIC_ASSETS = [
    '/tutor-dashboard.html',
    '/js/tutor.js',
    '/js/api.js',
    '/js/student.js',
];

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS).catch(function() {
                // Bỏ qua lỗi nếu file không tồn tại
            });
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Network first, fallback to cache — giữ trang hoạt động khi offline
self.addEventListener('fetch', function(event) {
    // Chỉ xử lý GET requests, bỏ qua API/Supabase/Drive
    if (event.request.method !== 'GET') return;
    var url = event.request.url;
    if (url.includes('supabase.co') || url.includes('googleapis.com') || url.includes('script.google.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Cache lại response mới nhất
                if (response && response.status === 200 && response.type === 'basic') {
                    var responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(function() {
                // Fallback to cache khi offline
                return caches.match(event.request);
            })
    );
});
