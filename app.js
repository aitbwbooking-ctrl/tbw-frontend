// --- Feature flags ---
const FEATURES = { voice: true, intro: true };

// --- Global state ---
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };
let mapsLoaded = false;
let map, miniMap, trafficMap, trafficLayer, directions, renderer, street;

// --- Boot ---
(async function boot(){
  CFG = await (await fetch('/config.json?_v=' + Date.now())).json();

  // backend ping
  try{
    const pong = await fetch(CFG.API_BASE_URL + '/api/health', {cache:'no-store'});
    document.getElementById('backendDot').style.background = pong.ok ? '#19c37d' : '#ff5577';
  }catch{ document.getElementById('backendDot').style.background = '#ff5577'; }

  // load Maps JS
  await loadMaps(CFG.MAPS_API_KEY);

  initUI();
  initMaps();
  initStreetView();
  initTraffic();
  initTicker();
  initServices();

  if(FEATURES.voice) initVoice();

  if(FEATURES.intro) runIntro(); else document.getElementById('intro')?.remove();
})();

// --- Load Google Maps JS (v=weekly, libraries=maps,marker,places) ---
function loadMaps(key){
  return new Promise((res, rej)=>{
    if(mapsLoaded) return res();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=maps,marker,places`;
    s.async = true; s.defer = true;
    s.onload = ()=>{ mapsLoaded = true; res(); };
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

// --- UI ---
function initUI(){
  byId('searchBtn').onclick = onGlobalSearch;
  byId('voiceBtn').onclick = onVoiceToggle;
  byId('routeBtn').onclick = makeRoute;
  byId('bookSearch').onclick = hotelSearch;
  byId('bookReserve').onclick = ()=>toast('Rezervacija poslana (demo)');
  byId('bookCancel').onclick = ()=>toast('Rezervacija otkazana');

  // chips klik u navigaciji -> POI pretraga na karti
  document.querySelectorAll('.chips .chip').forEach(ch=>{
    ch.addEventListener('click',()=>findPOI(ch.dataset.tag));
  });

  // default datumi
  const d1 = new Date(); const d2 = new Date(); d2.setDate(d1.getDate()+2);
  byId('arrive').valueAsDate = d1; byId('depart').valueAsDate = d2;
}

// --- Maps ---
function initMaps(){
  // glavna karta (navigacija)
  map = new google.maps.Map(byId('navMap'), {
    center:{lat:45.8150,lng:15.9819}, zoom:6, mapTypeControl:false, streetViewControl:false
  });
  directions = new google.maps.DirectionsService();
  renderer = new google.maps.DirectionsRenderer({map});

  // mini karta
  miniMap = new google.maps.Map(byId('mini'), {
    center:{lat:44.5,lng:16.5}, zoom:6, mapTypeControl:true, streetViewControl:false
  });

  // autocomplete (global i hotelCity i routeTo)
  const acGlobal = new google.maps.places.Autocomplete(byId('globalQuery'), {types:['(cities)']});
  acGlobal.addListener('place_changed', ()=>{
    const p = acGlobal.getPlace();
    if(p.geometry?.location){ map.setCenter(p.geometry.location); map.setZoom(12); street.setPosition(p.geometry.location); }
    // povuci sadržaj
    fetchAllForPlace(p.formatted_address || byId('globalQuery').value, p.geometry?.location);
  });

  const acHotel = new google.maps.places.Autocomplete(byId('hotelCity'), {types:['(cities)']});
  const acTo = new google.maps.places.Autocomplete(byId('routeTo'));

  // inicijalno
  fetchAllForPlace('Zagreb', new google.maps.LatLng(45.8150,15.9819));
}

// --- Street View ---
function initStreetView(){
  street = new google.maps.StreetViewPanorama(byId('street'), {
    position:{lat:45.8150,lng:15.9819}, pov:{heading:34,pitch:10}, zoom:1
  });
  map.setStreetView(street);
}

// --- Traffic ---
function initTraffic(){
  trafficMap = new google.maps.Map(byId('traffic'), {
    center:{lat:45.5,lng:16.3}, zoom:7, disableDefaultUI:true
  });
  trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(trafficMap);
}

// --- Global search (Jarvis light) ---
async function onGlobalSearch(){
  const q = byId('globalQuery').value.trim();
  if(!q) return;
  // heuristike:
  if(/ruta|dođi|vozi|put|route/i.test(q)){
    // pokušaj izdvojiti destinaciju - sve nakon "do"/"to"/"za"
    const m = q.match(/(?:do|za|to)\s+(.+)$/i);
    byId('routeTo').value = m ? m[1] : q.replace(/ruta|put|vozi/gi,'').trim();
    makeRoute();
    return;
  }
  // grad: “Split”, “Zadar apartmani”
  const place = q.replace(/apartmani|smještaj|rezervacija/gi,'').trim();
  goToPlace(place);
  if(/apartman|smještaj|rezervacija|hotel/i.test(q)) hotelSearch();
  loadPhotos(place);
  loadPOIs(place);
}

// --- Go to place with Places Autocomplete geocode ---
function goToPlace(text){
  const service = new google.maps.places.AutocompleteService();
  service.getPlacePredictions({ input: text, types:['(cities)'] }, (preds)=>{
    if(!preds?.length) return;
    const places = new google.maps.places.PlacesService(map);
    places.getDetails({placeId:preds[0].place_id, fields:['geometry','formatted_address']}, (det, status)=>{
      if(status!=='OK'||!det?.geometry?.location) return;
      map.setCenter(det.geometry.location); map.setZoom(12);
      miniMap.setCenter(det.geometry.location); miniMap.setZoom(6);
      street.setPosition(det.geometry.location);
      fetchAllForPlace(det.formatted_address || text, det.geometry.location);
    });
  });
}

// --- Route ---
function makeRoute(){
  const from = byId('routeFrom').value.trim();
  const to = byId('routeTo').value.trim();
  if(!to){ toast('Unesi odredište'); return; }
  const req = {
    origin: from || map.getCenter(),
    destination: to,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directions.route(req,(res,st)=>{
    if(st==='OK'){ renderer.setDirections(res); toast('Ruta spremna'); }
    else toast('Ne mogu izračunati rutu');
  });
}

// --- Hotels (JS-only: otvorimo Google Hotels za grad i datume) ---
function hotelSearch(){
  const city = byId('hotelCity').value || byId('globalQuery').value || 'Zagreb';
  const a = byId('arrive').value; const d = byId('depart').value;
  const url = `https://www.google.com/travel/hotels/${encodeURIComponent(city)}?hl=hr&rp=OAFIAg&ap=${a}&dp=${d}`;
  byId('hotelResults').innerHTML = `<div class="item"><div>🔗 Otvori pretragu smještaja za <b>${city}</b></div><a class="btn sm" target="_blank" href="${url}">Otvori</a></div>`;
}

// --- POI chips (na mapi preko Places Autocomplete + nearby search “new style”) ---
function findPOI(tag){
  const center = map.getCenter();
  const q = ({
    radar:'police speed camera',
    nesreca:'traffic accidents',
    radovi:'road works',
    parking:'parking',
    punionice:'ev charging',
    trgovine:'supermarket',
    bolnice:'hospital'
  })[tag] || 'poi';

  // “new” Places API: Text Search preko JS (bez PlacesService starog)
  const request = { textQuery: q, locationBias: center, openNow: false };
  // @ts-ignore
  const { PlacesService, SearchByTextRequest } = google.maps.places;
  if(!google.maps.places.Place){
    // Fallback – ako korisnikov projekt još nema “new Places JS”
    toast('POI pretraga: koristiti ću klasični tekstualni upit.');
  }

  // koristit ćemo SearchBox preko AutocompleteService kao fallback
  const service = new google.maps.places.PlacesService(map);
  service.textSearch({query:q, location:center, radius:4000}, (res, st)=>{
    if(st!=='OK'||!res?.length){ toast('Nema rezultata u blizini.'); return; }
    res.slice(0,8).forEach(p=>{
      new google.maps.Marker({map, position:p.geometry.location, title:p.name});
    });
    map.setZoom(13);
  });
}

// --- Fetch all widgets for a place ---
function fetchAllForPlace(placeName, latLng){
  loadWeather(latLng);
  loadPhotos(placeName);
  loadPOIs(placeName);
}

// --- Weather/Sea/Air (met.no – bez ključa) ---
async function loadWeather(latLng){
  try{
    const lat = latLng.lat?.() ?? latLng.lat, lng = latLng.lng?.() ?? latLng.lng;
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`;
    const r = await fetch(url,{headers:{'User-Agent':'tbw-ai-premium'}}); 
    const j = await r.json();
    const now = j.properties.timeseries[0];
    const t = now.data.instant.details;
    const sea = j.properties.meta?.units?.['sea_water_temperature'] ? now.data.instant.details['sea_water_temperature'] : null;

    byId('wxBox').innerHTML = `
      <div class="item">
        <div>🌡️ Temp: <b>${Math.round(t.air_temperature)}°C</b></div>
        <div>💨 Vjetar: <b>${Math.round(t.wind_speed)} m/s</b></div>
        <div>💧 Vlažnost: <b>${Math.round(t.relative_humidity)}%</b></div>
        <div>🌊 Temp mora: <b>${sea?sea+'°C':'—'}</b></div>
      </div>`;
  }catch{
    byId('wxBox').innerHTML = `<div class="item">Vrijeme trenutno nije dostupno.</div>`;
  }
}

// --- Photos (Wikimedia) ---
async function loadPhotos(place){
  try{
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&origin=*&format=json&prop=pageimages|images&generator=search&gsrsearch=${encodeURIComponent(place)}&gsrlimit=12&pithumbsize=400`);
    const j = await r.json();
    const pages = Object.values(j.query?.pages||{});
    const imgs = pages.map(p=>p.thumbnail?.source).filter(Boolean).slice(0,9);
    byId('photos').innerHTML = imgs.map(src=>`<img loading="lazy" src="${src}" alt="">`).join('') || `<div class="item">Nema fotografija.</div>`;
  }catch{
    byId('photos').innerHTML = `<div class="item">Greška pri dohvaćanju fotografija.</div>`;
  }
}

// --- POIs (Wikipedia geosearch) ---
async function loadPOIs(place){
  try{
    const geo = await geocodeText(place);
    if(!geo) return byId('poiBox').innerHTML = `<div class="poi-item">Nije pronađena lokacija.</div>`;
    const r = await fetch(`https://hr.wikipedia.org/w/api.php?action=query&origin=*&list=geosearch&gscoord=${geo.lat}|${geo.lng}&gsradius=8000&gslimit=10&format=json`);
    const j = await r.json();
    byId('poiBox').innerHTML = (j.query?.geosearch||[]).map(p=>`
      <div class="poi-item">
        <b>${p.title}</b><br/>
        ${Math.round(p.dist)} m • <a target="_blank" href="https://hr.wikipedia.org/?curid=${p.pageid}">Detalji</a>
      </div>
    `).join('') || `<div class="poi-item">Nema znamenitosti u blizini.</div>`;
  }catch{
    byId('poiBox').innerHTML = `<div class="poi-item">Greška pri dohvaćanju znamenitosti.</div>`;
  }
}

function geocodeText(text){
  return new Promise((resolve)=>{
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({address:text}, (res, st)=>{
      if(st==='OK' && res[0]) resolve({lat:res[0].geometry.location.lat(), lng:res[0].geometry.location.lng()});
      else resolve(null);
    });
  });
}

// --- Services & emergency ---
function initServices(){
  const items = [
    {icon:'🚓', name:'Policija 192', href:'tel:192'},
    {icon:'🚑', name:'Hitna 194',  href:'tel:194'},
    {icon:'🚒', name:'Vatrogasci 193', href:'tel:193'},
    {icon:'🆘', name:'EU 112', href:'tel:112'},
    {icon:'⚡', name:'EV punionice (mapa)', href:'https://www.plugshare.com/'},
    {icon:'🏥', name:'Najbliža bolnica', href:'https://www.google.com/maps/search/hospital/'}
  ];
  byId('services').innerHTML = items.map(i=>`<a class="svc" target="_blank" href="${i.href}"><div>${i.icon}</div><div>${i.name}</div></a>`).join('');
}

// --- Ticker ---
function initTicker(){
  byId('alertsTicker').textContent = 'Promet uglavnom uredan. • Nema posebnih vremenskih upozorenja za Hrvatsku.';
}

// --- Voice (Web Speech API) ---
let rec, speaking=false;
function initVoice(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ byId('voiceBtn').disabled = true; return; }
  rec = new SR(); rec.lang='hr-HR'; rec.interimResults=false;
  rec.onresult = (e)=>{ const t = e.results[0][0].transcript; byId('globalQuery').value = t; onGlobalSearch(); speak(`Tražim ${t}`); };
  rec.onerror = ()=>toast('Glasovna pretraga nije uspjela.');
}
function onVoiceToggle(){
  if(!rec) return;
  rec.start(); toast('Slušam…');
}
function speak(txt){
  try{
    const ut = new SpeechSynthesisUtterance(txt); ut.lang='hr-HR'; speechSynthesis.speak(ut);
  }catch{}
}

// --- Intro animation ---
function runIntro(){
  const wrap = byId('intro'), cnv = byId('stars'), ctx = cnv.getContext('2d');
  const audio = byId('introAudio'); const btn = byId('introBtn');
  let w,h,stars=[], comet={x:-200,y:120,dx:6,dy:-1.8,len:120};

  const fit=()=>{ w=cnv.width=innerWidth; h=cnv.height=innerHeight; };
  addEventListener('resize',fit); fit();
  for(let i=0;i<160;i++){ stars.push({x:Math.random()*w,y:Math.random()*h,s:Math.random()*2}); }

  const tick = ()=>{
    ctx.clearRect(0,0,w,h);
    // stars
    ctx.fillStyle='#9ed4ff';
    stars.forEach(s=>{ ctx.globalAlpha=.3+Math.random()*.7; ctx.fillRect(s.x,s.y,s.s,s.s); s.x-=.1; if(s.x<0){ s.x=w; s.y=Math.random()*h; }});
    // comet
    ctx.globalAlpha=.9; const grd = ctx.createLinearGradient(comet.x,comet.y, comet.x-comet.len, comet.y+comet.len*.3);
    grd.addColorStop(0,'#bff3ff'); grd.addColorStop(1,'rgba(191,243,255,0)');
    ctx.strokeStyle=grd; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(comet.x,comet.y); ctx.lineTo(comet.x-comet.len,comet.y+comet.len*.3); ctx.stroke();
    ctx.globalAlpha=1;
    comet.x+=comet.dx; comet.y+=comet.dy;
    if(comet.x>w+200){ // supernova “pop”
      ctx.beginPath(); ctx.arc(w/2,h/2,80,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fill();
      cancelAnimationFrame(anim);
      setTimeout(()=>{ wrap.classList.add('hide'); setTimeout(()=>wrap.remove(),400); },400);
    }else anim=requestAnimationFrame(tick);
  }; let anim=requestAnimationFrame(tick);

  // start audio
  audio.volume=.6; audio.play().catch(()=>{});
  btn.onclick = ()=>{ wrap.classList.add('hide'); setTimeout(()=>wrap.remove(),400); };
}

// --- helpers ---
const byId = (id)=>document.getElementById(id);
function toast(t){ console.log('[TBW]',t); }
