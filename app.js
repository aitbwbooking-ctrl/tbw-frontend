// Dinamički učitaj config (backend + Maps ključ)
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };

async function loadConfig(){
  const r = await fetch('/config.json?ts=' + Date.now());
  CFG = await r.json();
}

// Dinamički ubaci Google Maps <script>
function injectMaps(){
  if (!CFG.MAPS_API_KEY) return;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${CFG.MAPS_API_KEY}&libraries=places`;
  s.async = true;
  document.head.appendChild(s);
}

// Status backend točkastog indikatora
async function pingBackend(){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/health`);
    document.getElementById('backendDot').style.background = r.ok ? '#27ea7a' : '#f39';
  }catch{ document.getElementById('backendDot').style.background = '#f39'; }
}

// TOP ticker
async function loadAlerts(city="Hrvatska"){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const t = document.getElementById('alertsTicker');
    if (!d.alerts?.length){ t.textContent = `Promet uredan • Nema posebnih vremenskih upozorenja za ${city}.`; return; }
    t.textContent = d.alerts.map(a=>a.message).join(' • ');
  }catch{
    document.getElementById('alertsTicker').textContent = 'Učitavanje upozorenja nije uspjelo.';
  }
}

/* ---------- Intro: zvijezde + komet + supernova ---------- */
function introStars(){
  const cvs = document.getElementById('stars');
  const ctx = cvs.getContext('2d');
  const comet = document.getElementById('comet');
  const cctx = comet.getContext('2d');
  function size(){ cvs.width = comet.width = innerWidth; cvs.height = comet.height = innerHeight; }
  size(); addEventListener('resize', size);

  // Starfield
  const N=180, stars=[];
  for(let i=0;i<N;i++){
    stars.push({x:Math.random()*cvs.width,y:Math.random()*cvs.height,r:Math.random()*1.5+0.2,s:Math.random()*0.6+0.2});
  }
  // Comet state
  let cx=-100, cy=cvs.height*0.3, vx=5, vy=1.2, trail=[];
  let boomAt = performance.now()+3800; // supernova u ~3.8s

  function frame(ts){
    // background stars
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for(const s of stars){
      ctx.globalAlpha = 0.6 + 0.4*Math.sin((ts/4000)*s.s);
      ctx.fillStyle = '#cfffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      s.x -= s.s*0.15; if(s.x<0){ s.x=cvs.width; s.y=Math.random()*cvs.height; }
    }
    // comet
    cctx.clearRect(0,0,comet.width,comet.height);
    cx += vx; cy += vy;
    trail.push({x:cx,y:cy,life:1}); if(trail.length>120) trail.shift();
    // trail
    for(let i=0;i<trail.length;i++){
      const t = trail[i];
      const a = (i/trail.length);
      cctx.fillStyle = `rgba(79,255,235,${0.25*a})`;
      cctx.beginPath(); cctx.arc(t.x - i*1.5, t.y - i*0.3, 2 + a*3, 0, Math.PI*2); cctx.fill();
      t.life -= .01;
    }
    // head
    cctx.shadowBlur = 24; cctx.shadowColor = '#7fffe9';
    cctx.fillStyle = '#a9fff2';
    cctx.beginPath(); cctx.arc(cx, cy, 4.5, 0, Math.PI*2); cctx.fill();
    cctx.shadowBlur = 0;

    // supernova flash
    if (ts>=boomAt){
      const k = Math.min(1, (ts-boomAt)/400);
      cctx.fillStyle = `rgba(160,255,240,${1-k})`;
      cctx.beginPath(); cctx.arc(cx, cy, 160*k, 0, Math.PI*2); cctx.fill();
      if (k>=1) boomAt = Infinity;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Sakrij intro nakon 5s ili Preskoči
function runIntro(){
  const intro = document.getElementById('intro');
  const audio = document.getElementById('introAudio');
  introStars();
  const hide = ()=> intro.classList.add('intro-hide');
  document.getElementById('skipIntro').onclick = hide;
  audio?.play().catch(()=>{});
  setTimeout(hide, 5000);
}

/* ---------- Google Maps & moduli ---------- */
let gmapsReady = false, navMap, trafficMap, miniMap, streetPanorama, placesService, directions, dirRenderer;

function ensureMapsReady(cb){
  const iv = setInterval(()=>{
    if (window.google?.maps){ clearInterval(iv); gmapsReady = true; cb(); }
  }, 120);
}

function initMaps(city="Split"){
  if(!gmapsReady) return;
  const G = google.maps;

  // Navigacija
  navMap = new G.Map(document.getElementById('navMap'), { center:{lat:43.5081,lng:16.4402}, zoom:12, mapId:'TBW_NAV' });
  directions = new G.DirectionsService();
  dirRenderer = new G.DirectionsRenderer({ suppressMarkers:false, map:navMap });

  // Mini i promet
  miniMap = new G.Map(document.getElementById('miniMap'), { center:{lat:45.815,lng:15.9819}, zoom:6, mapTypeId:'terrain' });
  trafficMap = new G.Map(document.getElementById('trafficMap'), { center:{lat:45.2,lng:15.5}, zoom:6, mapTypeId:'roadmap' });
  new G.TrafficLayer().setMap(trafficMap);

  // Street view
  streetPanorama = new G.StreetViewPanorama(document.getElementById('streetView'), {
    position:{lat:43.5079,lng:16.4419}, pov:{heading:120,pitch:0}, zoom:1
  });

  // Places
  placesService = new G.places.PlacesService(navMap);

  // RDS chips (demo iz backenda)
  loadRDSChips(city);

  // Kreni s rutom kad klikneš
  document.getElementById('routeBtn').onclick = async ()=>{
    const from = document.getElementById('routeFrom').value.trim() || city;
    const to   = document.getElementById('routeTo').value.trim();
    if(!to) return;
    directions.route({
      origin: from, destination: to, travelMode: G.TravelMode.DRIVING, provideRouteAlternatives:true
    }, (res, status)=>{
      if(status === 'OK'){ dirRenderer.setDirections(res); }
    });
  };
}

/* ---------- RDS (prometne točke/opasnosti) ---------- */
async function loadRDSChips(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/traffic?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const box = document.getElementById('rdsChips');
    box.innerHTML = '';
    const items = d?.items || [
      {type:'radar', label:'Radar – ograničenje 50', severity:'info'},
      {type:'work',  label:'Radovi na cesti A1',    severity:'warn'},
      {type:'crash', label:'Nesreća – Karlovac',    severity:'alert'}
    ];
    for(const it of items){
      const span = document.createElement('span');
      span.textContent = (it.icon || '⚠️') + ' ' + it.label;
      if(it.severity==='alert') span.style.background = '#5b1322';
      if(it.severity==='warn')  span.style.background = '#4a2f00';
      box.appendChild(span);
    }
  }catch{}
}

/* ---------- UI akcije ---------- */
async function loadWeather(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    document.getElementById('weatherBox').textContent =
      d?.name ? `${d.name} • ${Math.round(d.main?.temp)}°C, ${d.weather?.[0]?.description || ''}` : 'N/A';
  }catch{ document.getElementById('weatherBox').textContent = 'N/A'; }
}

async function loadPOI(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const box = document.getElementById('poiBox'); box.innerHTML='';
    (d.items||[]).slice(0,6).forEach(p=>{
      const div=document.createElement('div'); div.className='poi-item';
      div.textContent = p.name; box.appendChild(div);
    });
  }catch{ document.getElementById('poiBox').textContent = 'N/A'; }
}

async function searchHotels(){
  const city  = document.getElementById('hotelCity').value.trim() || 'Split';
  const arrive= document.getElementById('arrive').value;
  const depart= document.getElementById('depart').value;
  const guests= +document.getElementById('guests').value || 2;

  const resBox = document.getElementById('hotelResults'); resBox.innerHTML='Tražim…';
  // Demo – backend bi tu zvao pravi provider.
  setTimeout(()=>{
    resBox.innerHTML = [
      `🏨 Apartman Perla — ${city} — 60 € / noć`,
      `🏨 Villa Mare — ${city} — 82 € / noć`,
      `🏨 City Rooms — ${city} — 55 € / noć`
    ].map(t=>`<div class="list-item">${t}</div>`).join('');
  }, 600);
}

/* ---------- Init ---------- */
(async function init(){
  // PWA
  if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('/sw.js'); }catch{} }

  await loadConfig();
  injectMaps();
  await pingBackend();
  await loadAlerts('Hrvatska');

  runIntro();

  ensureMapsReady(()=> initMaps('Split'));
  loadWeather('Zagreb');
  loadPOI('Split');

  // UI kontrole
  document.getElementById('askBtn').onclick = ()=>{
    const city = (document.getElementById('cityInput').value || 'Split').trim();
    loadAlerts(city); loadWeather(city); loadPOI(city);
    loadRDSChips(city);
  };
  document.getElementById('bookBtn').onclick = searchHotels;

  // footer godina
  document.getElementById('year').textContent = new Date().getFullYear();
})();
