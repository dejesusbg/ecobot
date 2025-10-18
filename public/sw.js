const CACHE_NAME = 'ecobot-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = ['/', '/offline.html', '/manifest.json'];

self.addEventListener('install', (event) => {
	self.skipWaiting();
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.catch(() => {})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME) return caches.delete(key);
				})
			)
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request)
				.then((response) => {
					// Put a copy in the cache for next time
					if (response && response.status === 200 && response.type === 'basic') {
						const resClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
					}
					return response;
				})
				.catch(() => caches.match(OFFLINE_URL));
		})
	);
});
