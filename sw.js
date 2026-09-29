const VERSION='demovement-v0.9.0';
const CORE=[
  './','./index.html','./styles.css','./engine.js','./movements.js','./composer.js','./runner.js',
  './paths.js','./passport.js','./flow.js','./training-data.js','./training-intelligence.js',
  './assistant-engine.js','./config.js','./supabase-adapter.js','./app.js','./market-ready.js',
  './manifest.webmanifest','./app-icon.svg','./account.html','./account.js','./platform.css',
  './coach.html','./coach.js','./administrator.html','./administrator.js','./invite.html','./invite.js',
  './privacy.html','./terms.html'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    await Promise.allSettled(CORE.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(x=>x.startsWith('demovement-')&&x!==VERSION).map(x=>caches.delete(x)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  if(url.origin===location.origin){
    if(req.mode==='navigate'){
      event.respondWith((async()=>{
        try{
          const fresh=await fetch(req);
          const cache=await caches.open(VERSION);
          cache.put(req,fresh.clone());
          return fresh;
        }catch{
          return (await caches.match(req))||(await caches.match('./index.html'));
        }
      })());
      return;
    }
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached)return cached;
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(VERSION);
        cache.put(req,fresh.clone());
        return fresh;
      }catch{
        return new Response('',{status:503,statusText:'Offline'});
      }
    })());
    return;
  }

  if(url.hostname==='cdn.jsdelivr.net'){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached)return cached;
      const fresh=await fetch(req);
      const cache=await caches.open(VERSION);
      cache.put(req,fresh.clone());
      return fresh;
    })());
  }
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
