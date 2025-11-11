// app.js
let CFG = { API_BASE_URL: "https.//tbw-backend.vercel.app", MAPS_API_KEY: "AIzaSyD6EsP-yJHpIdBBy-Iw9IRWtxP0lwpu2lA" };
const $ = (q,el=document)=>el.querySelector(q);
const $$ = (q,el=document)=>[...el.querySelectorAll(q)];

async function loadConfig(){
  const res = await fetch('/config.json'); CFG = await res.json();
}
function qs(name){return $(name.startsWith('#')?name:'#'+name)}
function setText(el,txt){ if(typeof el==='string') el=qs(el); if(el) el.textContent=txt }

async function boot(){
  await loadConfig();

  // Intro
  const intro = qs('intro'), introSnd = qs('introSnd'), skip = qs('skipIntro');
  const hideIntro = ()=> intro.style.display='none';
  skip.addEventListener('click', hideIntro);
  // automatski tihi zvuk (korisnik može stisnuti bilo što pa će se pustiti)
  const tryPlay = ()=> { introSnd.volume=.25; introSnd.play().catch(()=>{}); document.removeEventListener('pointerdown',tryPlay); };
  document.addEventListener('pointerdown', tryPlay);
  setTimeout(hideIntro, 1800);

  // Ticker
  startTicker();

  // Grad
  $('#applyCity').addEventListener('click',()=>applyCity($('#city').value.trim()));
  // Global search
  $('#globalSearch').addEventListener('submit', e=>{
    e.preventDefault(); handleQuery($('#q').value.trim());
  });
  // Mic (web speech API)
  initMic();

  // Cards expand
  $$('.expand').forEach(btn=> btn.addEventListener('click', ()=>openModal(btn.closest('.card')) ));
  $('#closeModal').addEventListener('click', closeModal);

  // Maps boot
  await loadGoogleMaps(CFG.MAPS_API_KEY);
  initMaps(); initStreetView(); initTrafficMap();

  // Nav
  $('#go').addEventListener('click', routeNow);
  $('#exitNav').addEventListener('click', clearRoute);
  $('#trafficBtn').addEventListener('click', ()=>toggleTraffic(true));
  // Servisi
  $('#serviceChips').addEventListener('click', e=>{
    if(e.target.dataset.type){ nearby(e.target.dataset.type); }
  });

  // Booking
  $('#searchStay').addEventListener('click', openMetaSearch);
  $('#reserveStay').addEventListener('click', openMetaSearch);
  $('#cancelStay').addEventListener('click', ()=>alert('Otkazano (demo).'));

  // Auto: grad iz geolokacije
  try {
    navigator.geolocation.getCurrentPosition(async pos=>{
      const c = await revGeo(pos.coords.latitude,pos.coords.longitude);
      if(c) { $('#city').value=c; applyCity(c); }
    });
  } catch(_) {}
}

/* ---------------- TICKER ---------------- */
async function startTicker(){
  const wrap = $('#ticker'), led = $('#led');
  async function pull(){
    try{
      const u = `${CFG.API_BASE_URL}/api/ticker?city=${encodeURIComponent($('#city').value||'Hrvatska')}`;
      const r = await fetch(u); const data = await r.json();
      const items = (data.items||[]).map(x=>`• ${x}`).join('    ');
      wrap.innerHTML = `<span>${items||'Nema posebnih vremenskih upozorenja za Hrvatsku.'}</span>`;
      led.style.background = '#18e08a';
    }catch(e){
      wrap.innerHTML = `<span>TBW LIVE • Veza stabilna •</span>`;
      led.style.background = '#f9a53b';
    }
  }
  await pull(); setInterval(pull, 60000);
}

/* ---------------- MAPS ---------------- */
let map, dirService, dirRenderer, trafficLayer, sv, pano;
async function loadGoogleMaps(key){
  if (window.google && window.google.maps) return;
  await new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.onload=res; s.onerror=rej; document.head.appendChild(s);
  });
}
function initMaps(){
  map = new google.maps.Map($('#map'), { center:{lat:45.815, lng:15.982}, zoom:8, mapTypeControl:false, streetViewControl:false });
  dirService = new google.maps.DirectionsService();
  dirRenderer = new google.maps.DirectionsRenderer({ map });
  trafficLayer = new google.maps.TrafficLayer();

  $('#from').value=''; $('#to').value='';
}
function initStreetView(){
  sv = new google.maps.StreetViewService();
  pano = new google.maps.StreetViewPanorama($('#pano'), { pov:{heading:0,pitch:0}, zoom:1 });
}
function initTrafficMap(){
  const tmap = new google.maps.Map($('#trafficMap'), {center:{lat:45.5,lng:15.5}, zoom:7, mapTypeControl:false, streetViewControl:false});
  const tl = new google.maps.TrafficLayer(); tl.setMap(tmap);
}
function toggleTraffic(on){ trafficLayer.setMap(on?map:null); }

async function routeNow(){
  const from = $('#from').value.trim();
  const to = $('#to').value.trim();
  if(!to){ alert('Upišite odredište.'); return; }
  const req = { origin: from||'My Location', destination: to, travelMode: 'DRIVING' };
  dirService.route(req,(res,stat)=>{
    if(stat==='OK'){ dirRenderer.setDirections(res); svAt(res.routes[0].legs[0].end_location); }
    else alert('Ruta nije pronađena: '+stat);
  });
}
function svAt(latlng){
  sv.getPanorama({ location: latlng, radius: 80 }, (data, status)=>{
    if(status==='OK'){ pano.setPano(data.location.pano); pano.setVisible(true); }
  });
}
function clearRoute(){ dirRenderer.set('directions', null); }

/* Nearby (hitne & servisi) */
let places;
function nearby(type){
  if(!places) places = new google.maps.places.PlacesService(map);
  const req = { location: map.getCenter(), radius: 5000, type:[type] };
  places.nearbySearch(req, (res, status)=>{
    if(status==='OK' && res?.length){
      res.slice(0,10).forEach(p=> new google.maps.Marker({position:p.geometry.location,map,title:p.name}));
    } else {
      alert('Nema rezultata u blizini (ili Places quota).');
    }
  });
}

/* ---------------- BOOKING ---------------- */
function openMetaSearch(){
  const loc = $('#stayCity').value || $('#city').value || 'Hrvatska';
  const ci = $('#checkin').value, co = $('#checkout').value, g = $('#guests').value||2;
  const q = new URLSearchParams({ checkin:ci, checkout:co, group_adults:g, ss:loc });
  // Po defaultu Booking
  window.open(`https://www.booking.com/searchresults.html?${q.toString()}`,'_blank');
}

/* ---------------- CITY CONTEXT ---------------- */
async function applyCity(city){
  if(!city) return;
  try{
    const ge = new google.maps.Geocoder();
    ge.geocode({address:city}, (res,stat)=>{
      if(stat==='OK' && res[0]){
        const ll = res[0].geometry.location;
        map.setCenter(ll); map.setZoom(12);
        // update traffic map implicitly; weather & sea:
        loadWeather(city); loadSea(city);
      }
    });
  }catch(e){}
}

/* ---------------- DATA (backend) ---------------- */
async function revGeo(lat,lon){
  try{
    const u = `${CFG.API_BASE_URL}/api/revgeo?lat=${lat}&lon=${lon}`;
    const r = await fetch(u); const d = await r.json(); return d.city||'';
  }catch(_){ return '' }
}
async function loadWeather(city){
  try{
    const u = `${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`;
    const r = await fetch(u); const d = await r.json();
    const L = $('#wxList'); L.innerHTML='';
    (d.items||[{t:'Nema podataka, prikazujem demo.'}]).forEach(x=>{
      const li=document.createElement('li'); li.textContent = x.t || `${x.time}: ${x.desc} ${x.temp}`;
      L.appendChild(li);
    });
  }catch(_){ $('#wxList').innerHTML='<li>Nema podataka (offline).</li>'; }
}
async function loadSea(city){
  try{
    const u = `${CFG.API_BASE_URL}/api/sea?city=${encodeURIComponent(city)}`;
    const r = await fetch(u); const d = await r.json();
    const L = $('#seaList'); L.innerHTML='';
    (d.items||[{t:'Nema podataka za more.'}]).forEach(x=>{
      const li=document.createElement('li'); li.textContent = x.t || `${x.spot}: more ${x.temp}°C, valovi ${x.waves}`;
      L.appendChild(li);
    });
  }catch(_){ $('#seaList').innerHTML='<li>Nema podataka.</li>'; }
}

/* ---------------- MODAL ---------------- */
function openModal(card){
  const clone = card.cloneNode(true);
  $('#modalContent').innerHTML='';
  $('#modalContent').appendChild(clone);
  $('#modal').classList.add('show');
}
function closeModal(){ $('#modal').classList.remove('show'); }

/* ---------------- MIC ---------------- */
function initMic(){
  const btn = $('#mic');
  let rec, on = false;
  btn.addEventListener('click', ()=>{
    if(on){ rec.stop(); on=false; btn.classList.remove('primary'); return; }
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ alert('Glasovno nije dostupno u ovom pregledniku.'); return; }
    rec = new SR(); rec.lang='hr-HR'; rec.continuous=true; rec.interimResults=false;
    rec.onresult = e=>{
      const txt = e.results[e.results.length-1][0].transcript.trim();
      $('#q').value = txt; handleQuery(txt);
    };
    rec.start(); on=true; btn.classList.add('primary');
  });
}

/* ---------------- QUERY router ---------------- */
function handleQuery(txt){
  if(!txt) return;
  // jednostavna pravila
  if(/ruta|vozi|idi|put/i.test(txt)){
    $('#to').value = txt.replace(/^(ruta|vozi|idi|put)\s*(do|prema)?/i,'').trim() || txt;
    routeNow(); return;
  }
  if(/vrijeme|prognoz/i.test(txt)){ openModal($('[data-card="weather"]')); return; }
  if(/promet/i.test(txt)){ openModal($('[data-card="traffic"]')); return; }
  if(/smje|rezerv/i.test(txt)){ openModal($('[data-card="booking"]')); return; }
  // inače – traži odredište
  $('#to').value = txt; routeNow();
}

boot();
