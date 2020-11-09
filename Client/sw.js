/*
*caching pages
*/
var staticCacheName = 'restaurant-reviews-cache-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        'manifest.json',
      ]);
    })
  );
});

/*
*fetching pages from cache
*/
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse.status === 404) {
          return;
        }
        return caches.open(staticCacheName).then(cache => {
          cache.put(event.request.url, networkResponse.clone());
          return networkResponse;
        })
      })
    }).catch(error => {
      console.log('Error:', error);
      return;
    })
  );
});