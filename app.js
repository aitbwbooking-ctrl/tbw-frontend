/* TBW AI PREMIUM – Frontend bootstrap
   - čita config.json (API_BASE_URL, MAPS_API_KEY)
   - dinamički učita Google Maps SDK
   - inicijalizira: Navigacija, Promet, Street View, Mini map
   - povezuje tražilicu s ostalim karticama
   - intro sa zvijezdama + glazba + komet
*/
const S = (sel, root=document) => root.querySelector(sel);
const SA = (sel, root=document) => [...root.querySelectorAll(sel)];

let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };
let mapsReady = false;
let navigationMap, trafficMap, miniMap, streetView, placesService, directions, directionsRenderer;

/* ===== Intro: zvijezde + komet + audio ===== */
(function introSetup(){
  const intro = S('#intro'); const canvas = S('#stars'); const skip = S('#introSkip');
  const audio = S('#introAudio'); let t0; const ctx = canvas.getContext('2d');
  const stars = Array.from({length:120}, ()=>({
    x: Math.random(), y: Math.random(), s: Math.random()*1.2 + .2, v: .0005+.0006*Math.random()
  }));
  const comet = { x:-0.2, y:0.15, vx:0.0032, vy:0.0009, trail:[] };

  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', resize); resize();

  function drawStar(st){
    const x = st.x*canvas.width, y=st.y*canvas.height;
    ctx.globalAlpha = .5 + .5*Math.sin((performance.now()*st.v)%6.28);
    ctx.fillStyle = '#c9f7ff';
    ctx.beginPath(); ctx.arc(x,y,st.s,0,Math.PI*2); ctx.fill();
  }
  function drawComet(){
    comet.trail.push({x:comet.x, y:comet.y, t:performance.now()});
    comet.trail = comet.trail.slice(-120);
    for(let i=0;i<comet.trail.length;i++){
      const p = comet.trail[i];
      const age = (i/comet.trail.length);
      ctx.globalAlpha = age*0.5;
      ctx.fillStyle = '#36ffd2';
      ctx.beginPath(); ctx.arc(p.x*canvas.width,p.y*canvas.height, 2+(6*age), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.fillStyle='#36ffd2';
    ctx.beginPath(); ctx.arc(comet.x*canvas.width, comet.y*canvas.height, 3.5, 0, Math.PI*2); ctx.fill();
  }
  function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(drawStar);
    drawComet();
    comet.x += comet.vx; comet.y += comet.vy;
    requestAnimationFrame(loop);
  }
  loop();

  function endIntro(){
    intro.classList.add('hidden');
    setTimeout(()=> intro.remove(), 800);
  }
  skip.onclick = endIntro;
  setTimeout(()=> { try{audio.currentTime=0; audio.play().catch(()=>{});}catch{} }, 300);
  setTimeout(endIntro, 5000);
})();

/* ===== Ticker + backend health ===== */
async function initTopbar(){
  const ticker = S('#ticker'); const dot = S('#backendDot');
  try{
    const r = await fetch('/config.json'); // just to warm
    const ok = await fetch(`${CFG.API_BASE_URL}/api/health`, {cache:'no-store'});
    dot.style.background = ok.ok ? '#11d07f' : '#ff5c6c';
  }catch{ dot.style.background = '#ff5c6c'; }
  const msgs = [
    'Obavijest: provjerite lokalne kamere i ograničenja brzine.',
    'TBW LIVE: promet uglavnom uredan.',
    'Vrijeme: nema posebnih upozorenja.',
  ];
  let i=0; setInterval(()=>{ ticker.textContent = msgs[i++%msgs.length]; }, 3500);
}

/* ===== Config & Google Maps loader ===== */
async function bootstrap(){
  const cfg = await fetch('/config.json', {cache:'no-store'}).then(r=>r.json());
  CFG = cfg;
  await initTopbar();
  await loadGoogleMaps(CFG.MAPS_API_KEY);
}

function loadGoogleMaps(key){
  return new Promise((resolve,reject)=>{
    if (mapsReady) return resolve();
    window.initMaps = function(){
      mapsReady = true;
      try{
        initNavigationMap();
        initTrafficMap();
        initStreetView();
        initMiniMap();
        wireSearch();
        wireHotel();
      }catch(e){ console.error(e); }
      resolve();
    };
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=maps,marker,places&loading=async&callback=initMaps`;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ===== Maps ===== */
function defaultCenter(){ return { lat:45.815, lng:15.981 }; } // Zagreb

function initNavigationMap(){
  const el = S('#navigation-map'); if(!el) return;
  navigationMap = new google.maps.Map(el, { zoom: 8, center: defaultCenter(), mapId: 'TBW_NAV' });
  placesService = new google.maps.places.PlacesService(navigationMap);
  directions = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers:false });
  directionsRenderer.setMap(navigationMap);

  S('#routeBtn').onclick = async ()=>{
    const from = S('#routeFrom').value.trim();
    const to   = S('#routeTo').value.trim();
    if(!to) return;
    const req = {
      origin: from || defaultCenter(),
      destination: to,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives:true
    };
    try{
      const res = await directions.route(req);
      directionsRenderer.setDirections(res);
    }catch(e){ console.warn('Ruta nije izračunata', e); }
  };

  // slojevi “chip”
  SA('.chip[data-layer]').forEach(ch=>{
    ch.onclick = ()=> ch.classList.toggle('active');
  });
}

function initTrafficMap(){
  const el = S('#live-traffic-map'); if(!el) return;
  trafficMap = new google.maps.Map(el, { zoom: 7, center: defaultCenter() });
  const tl = new google.maps.TrafficLayer(); tl.setMap(trafficMap);
}

function initStreetView(){
  const el = S('#streetview'); if(!el) return;
  streetView = new google.maps.StreetViewPanorama(el, {
    position: defaultCenter(), pov: { heading: 165, pitch: 0 }, zoom: 1
  });
}

function initMiniMap(){
  const el = S('#mini'); if(!el) return;
  miniMap = new google.maps.Map(el, { zoom: 6, center: defaultCenter() });
}

/* ===== Search (tražilica, mic) ===== */
function wireSearch(){
  const q = S('#q'); const go = S('#go'); const mic = S('#mic');

  async function applyCity(city){
    q.value = city;
    // geocode preko Places TextSearch (client-side)
    try{
      const req = { query: city };
      placesService.textSearch(req, (results,status)=>{
        if(status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) return;
        const p = results[0].geometry.location;
        const center = { lat:p.lat(), lng:p.lng() };
        navigationMap?.setCenter(center);
        trafficMap?.setCenter(center);
        miniMap?.setCenter(center);
        streetView?.setPosition(center);
      });
    }catch(e){ console.warn(e); }

    // backend spajanja (ne ruši UI ako nema)
    try{ loadWeather(city); }catch{}
    try{ loadPhotos(city); }catch{}
    try{ loadPOI(city); }catch{}
    try{ loadEmergency(city); }catch{}
  }

  go.onclick = ()=> q.value.trim() && applyCity(q.value.trim());
  q.addEventListener('keydown',e=>{ if(e.key==='Enter') go.click(); });

  // mic
  mic.onclick = ()=>{
    try{
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR) return alert('Govorno pretraživanje nije podržano.');
      const rec = new SR(); rec.lang='hr-HR'; rec.onresult = e=>{
        q.value = e.results[0][0].transcript; go.click();
      }; rec.start();
    }catch(e){ alert('Mikrofon nije dostupan.'); }
  };
}

/* ===== Hotel search / book / cancel ===== */
function wireHotel(){
  const cityEl = S('#hotelCity'), arrive=S('#arrive'), depart=S('#depart');
  const results = S('#hotelResults');

  S('#hotelSearch').onclick = async ()=>{
    results.innerHTML = '<div class="item">Pretraga…</div>';
    try{
      const url = `${CFG.API_BASE_URL}/api/hotels/search?city=${encodeURIComponent(cityEl.value||'Split')}&checkin=${arrive.value}&checkout=${depart.value}`;
      const r = await fetch(url); const data = await r.json();
      if(!Array.isArray(data)||!data.length){ results.innerHTML = '<div class="item">Nema rezultata.</div>'; return; }
      results.innerHTML = data.slice(0,5).map(h=>(
        `<div class="item">
           <div><strong>${h.name||'Smještaj'}</strong><br><small>${h.address||''}</small></div>
           <div><strong>${h.price||'-'}</strong></div>
         </div>`
      )).join('');
    }catch(e){
      results.innerHTML = '<div class="item">Greška pri pretraži.</div>';
    }
  };

  S('#hotelBook').onclick = ()=> alert('Rezervacija poslana ✔ (demo UI)');
  S('#hotelCancel').onclick = ()=> alert('Rezervacija otkazana ✔ (demo UI)');
}

/* ===== Weather + Air + Sea (u jedan box) ===== */
async function loadWeather(city){
  const el = S('#weather'); if(!el) return;
  el.innerHTML = '<div class="item">Učitavam…</div>';
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const w = await r.json();
    el.innerHTML = `
      <div class="item"><strong>${w.city||city}</strong><br>${w.desc||''}</div>
      <div class="item">🌡️ ${w.temp??'-'}°C  •  💧 ${w.humidity??'-'}%  •  💨 ${w.wind??'-'} m/s</div>
    `;
  }catch{
    el.innerHTML = `<div class="item">Vrijeme: nedostupno.</div>`;
  }
}

/* ===== Photos (fotografije) ===== */
async function loadPhotos(city){
  const el = S('#photos'); if(!el) return;
  el.innerHTML = '';
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/photos?city=${encodeURIComponent(city)}`);
    const arr = await r.json();
    if(Array.isArray(arr) && arr.length){
      el.innerHTML = arr.slice(0,6).map(u=>`<img src="${u}" alt="${city}" loading="lazy">`).join('');
    }else{
      el.innerHTML = '<div class="item">Nema fotografija.</div>';
    }
  }catch{
    el.innerHTML = '<div class="item">Fotografije: nedostupno.</div>';
  }
}

/* ===== POI / emergency ===== */
async function loadPOI(city){
  const el = S('#poi'); if(!el) return;
  el.innerHTML = '';
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`);
    const arr = await r.json();
    el.innerHTML = (arr||[]).slice(0,6).map(p=>`
      <div class="item"><div><strong>${p.name||'POI'}</strong><br><small>${p.category||''}</small></div>
      <div>${p.dist? (p.dist.toFixed? p.dist.toFixed(1):p.dist) +' km':''}</div></div>
    `).join('') || '<div class="item">Nema podataka.</div>';
  }catch{ el.innerHTML = '<div class="item">Znamenitosti: nedostupno.</div>'; }
}

async function loadEmergency(city){
  const el = S('#emergency'); if(!el) return;
  el.innerHTML = '';
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/emergency?city=${encodeURIComponent(city)}`);
    const arr = await r.json();
    el.innerHTML = (arr||[]).slice(0,6).map(s=>`
      <div class="item"><div><strong>${s.name||'Servis'}</strong><br><small>${s.type||''}</small></div>
      <div>${s.phone?`☎ ${s.phone}`:''}</div></div>
    `).join('') || '<div class="item">Nema zapisa.</div>';
  }catch{ el.innerHTML = '<div class="item">Servisi: nedostupno.</div>'; }
}

/* STARTUP */
bootstrap().catch(console.error);
