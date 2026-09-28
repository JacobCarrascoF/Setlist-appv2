// Service Worker: cachea todos los archivos de la app para que funcione sin conexión
// tras la primera visita. El PDF de letras va embebido dentro de index.html, así
// que cachear index.html ya incluye todo lo necesario.

var CACHE_NAME = 'setlist-app-v7'; // <-- incrementar en cada actualización para forzar refresco
var FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Librerías externas usadas por la app (pdf-lib). Se cachean también para que
// la generación de PDFs funcione sin conexión una vez cargadas la primera vez.
var EXTERNAL_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE).then(function(){
        return Promise.all(
          EXTERNAL_LIBS.map(function(url){
            return cache.add(url).catch(function(){ /* ignorar fallo, se reintentará al usarla */ });
          })
        );
      });
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        if(response && response.status === 200){
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function(){
        if(event.request.mode === 'navigate'){
          return caches.match('./index.html');
        }
      });
    })
  );
});
