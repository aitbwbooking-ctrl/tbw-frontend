/* ===== TBW FRONTEND ===== */
const $ = (s, d=document)=>d.querySelector(s);
const $$ = (s, d=document)=>[...d.querySelectorAll(s)];
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };
let mapsReady = false, gmap, trafficLayer, miniMap, streetPanorama;

/* 0) Učitaj config pa Maps skriptu (moderno, async) */
(async function boot(){
  try{
    const cfg = await fetch('/config.json').then(r=>r.json());
    CFG = { API_BASE_URL: cfg.API_BASE_URL, MAPS_API_KEY: cfg.MAPS_API_KEY };
    await loadGoogleMaps(CFG.MAPS_API_KEY);
    initUI();
    initIntro();
    initTicker();
    pingBackend();
  }catch(e){
    console.error('Init error:', e);
    alert('Greška pri inicijalizaciji aplikacije.');
  }
})();

function loadGoogleMaps(key){
  return new Promise((res, rej)=>{
    if(window.google?.maps) return res();
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=__gmReady`;
    window.__gmReady = ()=>res();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onerror = ()=>rej(new Error('Maps nije učitan'));
    document.head.appendChild(s);
  });
}

/* 1) UI & eventovi */
function initUI(){
  // status točkica
  $('#backendDot').style.background = '#3ceb84';

  // mic (Web Speech API)
  setupSpeech();

  // search
  $('#searchBtn').addEventListener('click', ()=> handleQuery($('#q').value));
  $('#q').addEventListener('keydown', (e)=>{ if(e.key==='Enter') $('#searchBtn').click(); });

  // navigacija
  $('#routeBtn').addEventListener('click', buildRoute);
  $$('#card-nav .chip').forEach(ch=>ch.addEventListener('click',()=>toggleLayer(ch)));

  // book
  $('#bookSearch').addEventListener('click', searchHotels);
  $('#bookReserve').addEventListener('click', ()=> speak('Rezervacija poslana.'));
  $('#bookCancel').addEventListener('click', ()=> speak('Rezervacija otkazana.'));

  // karte
  initMaps();
}

/* 2) Intro + zvijezde */
function initIntro(){
  const intro = $('#intro');
  // prikaži intro samo pri hladnom loadu
  intro.classList.remove('hidden');
  const ctx = $('#stars').getContext('2d');
  const W = intro.clientWidth, H = intro.clientHeight;
  $('#stars').width = W; $('#stars').height = H;
  const stars = Array.from({length:160},()=>({
    x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.6+0.4, s:Math.random()*0.8+0.2
  }));
  // mali "komet"
  let comet = {x:-100, y:H*0.3, vx:3.2, vy:0.6, life:160};

  const audio = $('#introAudio'); audio.volume = 0.7; audio.currentTime = 0; audio.play().catch(()=>{});
  let t=0;
  const anim = ()=>{
    ctx.fillStyle='#031018'; ctx.fillRect(0,0,W,H);
    // stars
    stars.forEach(st=>{ st.x -= st.s; if(st.x<0) st.x=W; ctx.fillStyle='#9fd9e955'; ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,Math.PI*2); ctx.fill(); });
    // comet
    if(comet.life>0){
      ctx.strokeStyle='rgba(180,255,240,.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(comet.x,comet.y); ctx.lineTo(comet.x-70,comet.y-22); ctx.stroke();
      ctx.fillStyle='rgba(200,255,250,.9)'; ctx.beginPath(); ctx.arc(comet.x,comet.y,3.5,0,Math.PI*2); ctx.fill();
      comet.x += comet.vx; comet.y += comet.vy; comet.life--;
    }
    t++; if(t<300) requestAnimationFrame(anim);
  };
  anim();

  // auto-hide nakon 5s ili preskok
  const hide = ()=> intro.classList.add('hidden');
  $('#skipIntro').onclick = hide;
  setTimeout(hide, 5000);
}

/* 3) Maps */
function initMaps(){
  // glavna navigacija
  gmap = new google.maps.Map($('#navMap'), { center:{lat:45.8,lng:16.0}, zoom:6, mapTypeControl:false, streetViewControl:false });
  trafficLayer = new google.maps.TrafficLayer(); trafficLayer.setMap(null);

  // Street View
  streetPanorama = new google.maps.StreetViewPanorama($('#streetView'), { position:{lat:45.492,lng:15.555}, pov:{heading:34,pitch:0}, zoom:1 });
  gmap.setStreetView(streetPanorama);

  // mini
  miniMap = new google.maps.Map($('#miniMap'), { center:{lat:44.8,lng:15.9}, zoom:6, mapTypeControl:false, streetViewControl:false });
}

async function buildRoute(){
  const from = $('#routeFrom').value.trim();
  const to = $('#routeTo').value.trim();
  if(!to){ speak('Upišite odredište.'); return; }
  try{
    const url = `${CFG.API_BASE_URL}/api/route?${new URLSearchParams({from,to}).toString()}`;
    const data = await fetch(url).then(r=>r.json());
    // očekuje se: { start:{lat,lng}, end:{lat,lng}, path:[[lat,lng],...]}
    const path = data.path.map(([lat,lng])=>({lat,lng}));
    const poly = new google.maps.Polyline({ path, strokeColor:'#00d7a7', strokeOpacity:.9, strokeWeight:5 });
    poly.setMap(gmap);
    gmap.fitBounds(boundsFrom(path));
  }catch(e){
    console.error(e); speak('Ruta trenutno nije dostupna.');
  }
}

function boundsFrom(path){
  const b = new google.maps.LatLngBounds();
  path.forEach(p=>b.extend(p)); return b;
}

function toggleLayer(chip){
  chip.classList.toggle('active');
  const kind = chip.dataset.layer;
  if(kind==='incidents'){
    if(chip.classList.contains('active')) trafficLayer.setMap(gmap); else trafficLayer.setMap(null);
  }
  // ostale slojeve dohvaćamo s backenda i crtamo markere – skraćeno:
  // (radari, radovi, parking, ev, shops, hospitals)
}

/* 4) Hotels */
async function searchHotels(){
  const city = $('#hotelCity').value.trim() || 'Split';
  const from = $('#arrive').value, to = $('#depart').value;
  const tags = $$('#card-book .chip.toggle.active').map(x=>x.dataset.tag);
  $('#hotelResults').innerHTML = 'Pretražujem…';
  try{
    const url = `${CFG.API_BASE_URL}/api/hotels?`+new URLSearchParams({city,from,to,tags:tags.join(',')});
    const data = await fetch(url).then(r=>r.json());
    if(!data?.length){ $('#hotelResults').innerHTML = '<div class="item">Nema rezultata.</div>'; return; }
    $('#hotelResults').innerHTML = data.map(h=>(
      `<div class="item"><strong>${h.name}</strong><br>${h.addr||''}<br><em>${h.price||'-'} € / noć</em></div>`
    )).join('');
  }catch(e){
    console.error(e);
    $('#hotelResults').innerHTML = '<div class="item">Greška pri pretrazi.</div>';
  }
}

/* 5) Query handler (AI pretraga / univerzalno) */
async function handleQuery(text){
  const q = text.trim(); if(!q) return;
  // šaljemo backendu – on dalje koristi AI/Gemini + Maps
  try{
    const res = await fetch(`${CFG.API_BASE_URL}/api/query?`+new URLSearchParams({q})).then(r=>r.json());
    // očekujemo { center:{lat,lng}, photos:[...], pois:[...], services:[...], weather:{...}, street:{lat,lng} }
    if(res.center){ gmap.setCenter(res.center); gmap.setZoom(12); miniMap.setCenter(res.center); }
    if(res.street){ streetPanorama.setPosition(res.street); }
    if(res.photos) renderPhotos(res.photos);
    if(res.pois) renderPOI(res.pois);
    if(res.services) renderServices(res.services);
    if(res.weather) renderWeather(res.weather);
    speak('Rezultati su prikazani.');
  }catch(e){ console.error(e); speak('Nešto je pošlo po zlu s pretragom.'); }
}

/* 6) Render helperi */
function renderPhotos(arr){
  $('#photoStrip').innerHTML = (arr||[]).slice(0,6).map(u=>`<img src="${u}" alt="">`).join('') || '<div class="item">—</div>';
}
function renderPOI(arr){
  $('#poiBox').innerHTML = (arr||[]).slice(0,6).map(p=>(
    `<div class="item"><h4>${p.name}</h4><div>${p.desc||''}</div></div>`
  )).join('') || '<div class="item">—</div>';
}
function renderServices(arr){
  $('#servicesBox').innerHTML = (arr||[]).map(s=>(
    `<div class="item"><strong>${s.name}</strong><br>${s.type||''} • ${s.phone||''}</div>`
  )).join('') || '<div class="item">—</div>';
}
function renderWeather(w){
  if(!w){ $('#weatherBox').innerHTML='—'; return; }
  $('#weatherBox').innerHTML =
    `<div class="item"><strong>${w.city||''}</strong> • ${w.temp??'–'}°C • vlažnost ${w.humidity??'–'}% • more ${w.sea_temp??'–'}°C</div>`;
}

/* 7) Live ticker */
async function initTicker(){
  try{
    const t = await fetch(`${CFG.API_BASE_URL}/api/alerts`).then(r=>r.json());
    $('#ticker').textContent = t?.text || 'Promet uglavnom uredan.';
  }catch{ $('#ticker').textContent = 'Promet uglavnom uredan.'; }
}

/* 8) Backend ping */
async function pingBackend(){
  try{
    await fetch(`${CFG.API_BASE_URL}/api/health`,{cache:'no-store'});
    $('#backendDot').style.background = '#3ceb84';
  }catch{
    $('#backendDot').style.background = '#ff6b6b';
  }
}

/* 9) Speech (browser ugrađeni API – bez ključa) */
function setupSpeech(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ $('#micBtn').style.display='none'; return; }
  const recog = new SR(); recog.lang = 'hr-HR'; recog.interimResults=false;
  $('#micBtn').onclick = ()=>{
    speak('Reci što tražiš.');
    recog.start();
  };
  recog.onresult = (e)=>{
    const txt = e.results[0][0].transcript;
    $('#q').value = txt; handleQuery(txt);
  };
}
function speak(text){
  try{
    const s = new SpeechSynthesisUtterance(text); s.lang='hr-HR'; s.rate=1; window.speechSynthesis.speak(s);
  }catch{}
}
