// API rute (backend već ima /api/*)
const API = {
  weather:  (city) => `/api/weather?city=${encodeURIComponent(city)}`,
  poi:      (city) => `/api/poi?city=${encodeURIComponent(city)}`,
  alerts:   (city) => `/api/alerts?city=${encodeURIComponent(city)}`,
  traffic:  ()     => `/api/traffic`,
  photos:   (q)    => `/api/photos?q=${encodeURIComponent(q)}`,
};

// Učitamo config da dohvatimo Google Maps API ključ i onda dinamčki učitamo Maps JS
let MAPS_KEY = null;
let gmap, trafficLayer, svService;

async function loadMaps() {
  if (MAPS_KEY) return;
  const cfg = await fetch('/config.json').then(r => r.json()).catch(()=>({}));
  MAPS_KEY = cfg.MAPS_API_KEY || "";
  if (!MAPS_KEY) { console.warn("Nema MAPS_API_KEY u config.json — karta će biti statična."); return; }

  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function initMapsContainers() {
  // Navigacija karta
  const navEl = document.getElementById('navMap');
  if (window.google && navEl) {
    gmap = new google.maps.Map(navEl, { center:{lat:43.5081,lng:16.4402}, zoom:12, disableDefaultUI:true, styles:[{featureType:"poi",stylers:[{visibility:"off"}]}] });
  }
  // Promet karta
  const trEl = document.getElementById('trafficMap');
  if (window.google && trEl) {
    const tmap = new google.maps.Map(trEl, { center:{lat:43.5081,lng:16.4402}, zoom:12, disableDefaultUI:true, styles:[{featureType:"poi",stylers:[{visibility:"off"}]}] });
    trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(tmap);
  }
  svService = (window.google) ? new google.maps.StreetViewService() : null;
}

// Uvod – 5 sekundi + zvuk
function playIntro() {
  const a = document.getElementById('introAudio');
  setTimeout(()=>{ a?.play().catch(()=>{}); }, 300); // diskretno
}

// StreetView statična slika preko Google Static Street View API-ja
function setStreetViewByCoords(lat, lng) {
  const img = document.getElementById('streetImg');
  if (!img) return;
  if (!MAPS_KEY) {
    img.src = "https://images.unsplash.com/photo-1520931737576-7b8750f4dcd7?w=1200&q=60";
    document.getElementById('streetNote').textContent = "Street View: potreban Google Maps ključ u config.json (MAPS_API_KEY).";
    return;
  }
  const url = `https://maps.googleapis.com/maps/api/streetview?size=800x420&location=${lat},${lng}&fov=90&pitch=0&key=${MAPS_KEY}`;
  img.src = url;
  document.getElementById('streetNote').textContent = `Lokacija: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Prikaži navigacijsku rutu + POI oznake (mini demo)
function drawRouteAndPoi(pois) {
  const note = document.getElementById('navNote');
  if (!window.google || !gmap) {
    note.textContent = "Karta bez Google Maps ključa – prikaz ograničen.";
    return;
  }
  // centriraj na prvi POI ako postoji
  if (pois?.length) {
    const p = pois[0];
    gmap.setCenter({lat:p.lat, lng:p.lon});
  }
  // markeri (ograniči na 6)
  (pois||[]).slice(0,6).forEach(p=>{
    new google.maps.Marker({map:gmap, position:{lat:p.lat,lng:p.lon}, title:p.name});
  });
  note.textContent = "Označeno nekoliko znamenitosti.";
}

// WEATHER -> SEA (grubo: morska temp ~ zrak - 2°C kad je > 12°C)
function fillSeaFromWeather(w) {
  const t = w?.main?.temp ?? null;
  const hum = w?.main?.humidity ?? null;
  const seaT = (t!==null) ? Math.max(6, (t>12 ? t-2 : t-4)) : "—";
  document.getElementById('seaTemp').textContent = (seaT==="—") ? "— °C" : `${seaT.toFixed(1)} °C`;
  document.getElementById('seaMeta').textContent = `H - ${hum ?? "—"}%`;
}

async function loadDashboard(city) {
  const c = city || document.getElementById('cityInput').value.trim() || "Split";
  document.getElementById('cityInput').value = c;
  document.getElementById('bkCity').value = c;

  // ALERTS
  fetch(API.alerts(c)).then(r=>r.json()).then(d=>{
    if (d?.alerts?.length) {
      const line = d.alerts.map(a=>a.message).join(" • ");
      document.querySelector('#alertBar .alertsLine').innerHTML = line.split("•").map(x=>`<span>${x.trim()}</span>`).join('<span>•</span>');
    }
  }).catch(()=>{});

  // VRIJEME
  try{
    const w = await fetch(API.weather(c)).then(r=>r.json());
    const temp = (w?.main?.temp!=null) ? `${Math.round(w.main.temp)}°C` : "—";
    const desc = w?.weather?.[0]?.description || "—";
    document.getElementById('wTemp').textContent = temp;
    document.getElementById('wDesc').textContent = desc;
    document.getElementById('weatherNote').textContent = `${(w?.name||c)}, vjetar ${(w?.wind?.speed??"—")} m/s`;
    fillSeaFromWeather(w);
  }catch(e){ document.getElementById('weatherNote').textContent = "Greška pri dohvaćanju vremena."; }

  // POI
  let pois = [];
  try{
    const d = await fetch(API.poi(c)).then(r=>r.json());
    pois = d?.items || [];
    drawRouteAndPoi(pois);
    if (pois.length) setStreetViewByCoords(pois[0].lat, pois[0].lon);
  }catch(e){
    document.getElementById('navNote').textContent = "POI nedostupni.";
  }

  // PROMET
  fetch(API.traffic()).then(r=>r.json()).then(d=>{
    document.getElementById('trafficNote').textContent = `Stanje: ${d?.status || "—"}, ažurirano: ${new Date(d?.last_update||Date.now()).toLocaleTimeString()}`;
  }).catch(()=>{ document.getElementById('trafficNote').textContent = "Promet nedostupan."; });

  // SEA THUMBS (fotke)
  try{
    const ph = await fetch(API.photos(`${c} seaside`)).then(r=>r.json());
    const imgs = (ph?.results||[]).slice(0,4).map(p=>p.urls?.small).filter(Boolean);
    const box = document.getElementById('seaThumbs'); box.innerHTML = "";
    imgs.forEach(u=>{
      const img = new Image(); img.src = u; box.appendChild(img);
    });
  }catch{}
}

function wireUI(){
  document.getElementById('goBtn').addEventListener('click', ()=>loadDashboard());
  document.getElementById('bkBtn').addEventListener('click', ()=>{
    const city = document.getElementById('bkCity').value || "Split";
    const arrive = document.getElementById('bkArrive').value || "24.09";
    const leave  = document.getElementById('bkLeave').value || "30.09";
    const price  = document.getElementById('bkPrice').value || "60";
    const guests = document.getElementById('bkGuests').value || "2 osobe";
    alert(`Rezervacija poslana!\n\nLokacija: ${city}\nDolazak: ${arrive}\nOdlazak: ${leave}\nCijena: ${price} €/noć\nGosti: ${guests}`);
  });
  document.getElementById('bkPrice').addEventListener('input', (e)=>{
    document.getElementById('bkPriceShow').textContent = `${e.target.value||60} € po noći`;
  });
}

window.addEventListener('load', async ()=>{
  playIntro();
  await loadMaps();
  initMapsContainers();
  wireUI();
  loadDashboard("Split");
});
