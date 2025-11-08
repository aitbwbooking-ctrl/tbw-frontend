/* ---------------- CONFIG ---------------- */
let CFG = { API_BASE_URL:"", MAPS_API_KEY:"" };

async function loadConfig(){
  const r = await fetch('/config.json?ts='+Date.now());
  CFG = await r.json();
}
function injectMaps(){
  if(!CFG.MAPS_API_KEY) return;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${CFG.MAPS_API_KEY}&libraries=places`;
  s.async = true;
  document.head.appendChild(s);
}
async function pingBackend(){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/health`);
    document.getElementById('backendDot').style.background = r.ok ? '#27ea7a' : '#f39';
  }catch{ document.getElementById('backendDot').style.background = '#f39'; }
}

/* ---------------- INTRO (Warp + Comet + Supernova + Voice) ---------------- */
function introFX(){
  const stars = document.getElementById('stars');
  const fx = document.getElementById('fx');
  const sc = stars.getContext('2d');
  const fc = fx.getContext('2d');
  function size(){ stars.width=fx.width=innerWidth; stars.height=fx.height=innerHeight; }
  size(); addEventListener('resize', size);

  // Starfield
  const N=200, S=[];
  for(let i=0;i<N;i++){ S.push({x:Math.random()*stars.width, y:Math.random()*stars.height, z:Math.random()*1.5+0.3}); }

  // Comet
  let cx=-100, cy=stars.height*0.33, vx=6, vy=1.3, trail=[];
  let boomAt = performance.now()+3800;

  function frame(t){
    sc.clearRect(0,0,stars.width,stars.height);
    // parallax warp
    for(const s of S){
      const sp = (1.2 + s.z*1.2);
      sc.globalAlpha = 0.7;
      sc.fillStyle = '#cfffff';
      sc.fillRect(s.x, s.y, 1.2+s.z, 1.2+s.z);
      s.x -= sp; if(s.x<0){ s.x=stars.width; s.y=Math.random()*stars.height; s.z=Math.random()*1.5+0.3; }
    }

    // comet trail
    fc.clearRect(0,0,fx.width,fx.height);
    cx+=vx; cy+=vy;
    trail.push({x:cx,y:cy}); if(trail.length>140) trail.shift();
    for(let i=0;i<trail.length;i++){
      const p = trail[i], a = i/trail.length;
      fc.fillStyle = `rgba(90,255,235,${0.22*a})`;
      fc.beginPath(); fc.arc(p.x - i*1.7, p.y - i*0.35, 2 + a*3, 0, Math.PI*2); fc.fill();
    }
    // head
    fc.shadowBlur=24; fc.shadowColor='#7fffe9';
    fc.fillStyle='#a9fff2'; fc.beginPath(); fc.arc(cx, cy, 5, 0, Math.PI*2); fc.fill(); fc.shadowBlur=0;

    // supernova
    if(t>=boomAt){
      const k = Math.min(1,(t-boomAt)/420);
      fc.fillStyle = `rgba(180,255,245,${1-k})`;
      fc.beginPath(); fc.arc(cx, cy, 180*k, 0, Math.PI*2); fc.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function speakIntro(){
  try{
    const msg = new SpeechSynthesisUtterance(
      "Dobrodošli u TBW A I Premium. Vaš osobni putni concierge i sigurnosni asistent. Učitavam pametne panele i podatke u stvarnom vremenu."
    );
    msg.lang = "hr-HR";
    msg.rate = 1; msg.pitch = 1; msg.volume = 1;
    speechSynthesis.cancel(); speechSynthesis.speak(msg);
  }catch{}
}

function runIntro(){
  const intro = document.getElementById('intro');
  const audio = document.getElementById('introAudio');
  introFX();
  // zvuk + voice
  setTimeout(()=>{ audio?.play().catch(()=>{}); speakIntro(); }, 1000);
  const hide = ()=>{
    intro.classList.add('intro-hide');
    setTimeout(()=> intro.remove(), 1100);
  };
  document.getElementById('skipIntro').onclick = hide;
  setTimeout(hide, 5200);
}

/* ---------------- TICKER & PANELS ---------------- */
async function loadAlerts(city="Hrvatska"){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const t = document.getElementById('alertsTicker');
    t.textContent = (d.alerts?.length ? d.alerts.map(a=>a.message).join(' • ') :
      `Promet uredan • Nema posebnih vremenskih upozorenja za ${city}.`);
  }catch{
    document.getElementById('alertsTicker').textContent = 'Učitavanje upozorenja nije uspjelo.';
  }
}
async function loadWeather(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    document.getElementById('weatherBox').textContent =
      d?.name ? `${d.name} • ${Math.round(d.main?.temp)}°C, ${d.weather?.[0]?.description||''}` : 'N/A';
  }catch{ document.getElementById('weatherBox').textContent='N/A'; }
}
async function loadPOI(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const box = document.getElementById('poiBox'); box.innerHTML='';
    (d.items||[]).slice(0,6).forEach(p=>{
      const div=document.createElement('div'); div.className='poi-item';
      div.textContent=p.name||'Znamenitost'; box.appendChild(div);
    });
  }catch{ document.getElementById('poiBox').textContent='N/A'; }
}
async function loadRDSChips(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/traffic?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const box = document.getElementById('rdsChips'); box.innerHTML='';
    const items = d?.items || [
      {type:'radar', label:'Radar – ograničenje 50', severity:'info'},
      {type:'work',  label:'Radovi na cesti A1',    severity:'warn'},
      {type:'crash', label:'Nesreća – Karlovac',    severity:'alert'}
    ];
    for(const it of items){
      const s=document.createElement('span');
      s.textContent = (it.icon||'⚠️') + ' ' + it.label;
      if(it.severity==='alert') s.style.background='#5b1322';
      if(it.severity==='warn')  s.style.background='#4a2f00';
      box.appendChild(s);
    }
  }catch{}
}
function searchHotels(){
  const city  = (document.getElementById('hotelCity').value||'Split').trim();
  const arrive= document.getElementById('arrive').value;
  const depart= document.getElementById('depart').value;
  const guests= +document.getElementById('guests').value||2;
  const box = document.getElementById('hotelResults');
  box.innerHTML='Tražim…';
  setTimeout(()=>{
    box.innerHTML=[
      `🏨 Apartman Perla — ${city} — 60 € / noć`,
      `🏨 Villa Mare — ${city} — 82 € / noć`,
      `🏨 City Rooms — ${city} — 55 € / noć`
    ].map(x=>`<div class="list-item">${x}</div>`).join('');
  },600);
}

/* ---------------- GOOGLE MAPS ---------------- */
let gmapsReady=false, navMap, trafficMap, miniMap, streetPanorama, directions, dirRenderer;
function ensureMapsReady(cb){
  const iv=setInterval(()=>{ if(window.google?.maps){clearInterval(iv);gmapsReady=true;cb();}},120);
}
function initMaps(city="Split"){
  if(!gmapsReady) return;
  const G = google.maps;
  // Navigacija
  navMap = new G.Map(document.getElementById('navMap'), { center:{lat:43.5081,lng:16.4402}, zoom:12 });
  directions=new G.DirectionsService();
  dirRenderer=new G.DirectionsRenderer({ map:navMap });
  // Mini + Promet
  miniMap=new G.Map(document.getElementById('miniMap'),{ center:{lat:45.815,lng:15.9819}, zoom:6, mapTypeId:'terrain' });
  trafficMap=new G.Map(document.getElementById('trafficMap'),{ center:{lat:45.2,lng:15.5}, zoom:6 });
  new G.TrafficLayer().setMap(trafficMap);
  // StreetView
  streetPanorama=new G.StreetViewPanorama(document.getElementById('streetView'),{
    position:{lat:43.5079,lng:16.4419}, pov:{heading:120,pitch:0}, zoom:1
  });
  // Ruta
  document.getElementById('routeBtn').onclick=()=>{
    const from=(document.getElementById('routeFrom').value||city).trim();
    const to=(document.getElementById('routeTo').value||'Zagreb').trim();
    if(!to) return;
    directions.route({origin:from,destination:to,travelMode:G.TravelMode.DRIVING,provideRouteAlternatives:true},
      (res,st)=>{ if(st==='OK') dirRenderer.setDirections(res); });
  };
}

/* ---------------- INIT ---------------- */
(async function init(){
  // SW
  if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('/sw.js'); }catch{} }

  await loadConfig();
  injectMaps();
  await pingBackend();
  await loadAlerts('Hrvatska');

  runIntro();

  ensureMapsReady(()=> initMaps('Split'));
  loadWeather('Zagreb');
  loadPOI('Split');
  loadRDSChips('Hrvatska');

  // UI
  document.getElementById('askBtn').onclick = ()=>{
    const city=(document.getElementById('cityInput').value||'Split').trim();
    loadAlerts(city); loadWeather(city); loadPOI(city); loadRDSChips(city);
  };
  document.getElementById('bookBtn').onclick = searchHotels;
  document.getElementById('year').textContent = new Date().getFullYear();
})();
