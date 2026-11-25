const CACHE_NAME = 'ritm-static-v10';
const APP_FILES = ['./', './index.html', './styles.css', './app.js', './motion.css?v=1.2.0', './motion.js?v=1.2.0', './ux.css?v=1.3.3', './ux.js?v=1.3.3', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
    return response;
  }).catch(()=>request.mode==='navigate'?caches.match('./index.html'):Promise.reject(new Error('Offline resource unavailable')))));
});
