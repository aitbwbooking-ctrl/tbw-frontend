// Učitavanje configa (API_BASE_URL, MAPS_API_KEY)
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };
async function loadConfig() {
  const r = await fetch("/config.json"); CFG = await r.json();
}

// Dinamično učitaj Google Maps (da sakrijemo key iz HTML-a)
function loadMaps(callbackName = "initMaps") {
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CFG.MAPS_API_KEY)}&libraries=places&callback=${callbackName}`;
  s.async = true; s.defer = true;
  document.head.appendChild(s);
}

/* GLOBAL */
let navMap, miniMap, trafficMap, directions, directionsSvc, streetViewPanorama;

/* INTRO + APP START */
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  // registracija SW
  if ("serviceWorker" in navigator) try { navigator.serviceWorker.register("/sw.js"); } catch {}
  // backend health
  pingBackend();

  // intro
  const overlay = document.getElementById("introOverlay");
  const audio = document.getElementById("introAudio");
  const skipBtn = document.getElementById("skipIntro");
  let introTimer;
  const endIntro = () => { overlay.classList.add("hidden"); try{ audio.pause(); }catch{} };
  skipBtn.onclick = endIntro;

  // pokušaj autoplay; u nekim browserima traži interakciju
  audio.play().catch(()=>{ /* tiho ignoriraj */ });
  introTimer = setTimeout(endIntro, 5000);

  // UI hooks
  document.getElementById("askBtn").onclick = () => loadDashboard();
  document.getElementById("sendBtn").onclick = () => sendMessage();
  document.getElementById("routeBtn").onclick = () => makeRoute();
  document.getElementById("bookBtn").onclick = () => searchHotels();

  // Enter za chat i tražilicu
  document.getElementById("assistantInput").addEventListener("keydown", e => { if(e.key==="Enter") sendMessage(); });
  document.getElementById("cityInput").addEventListener("keydown", e => { if(e.key==="Enter") loadDashboard(); });

  // učitaj Google Maps pa inicijaliziraj karte
  window.initMaps = () => { initMaps(); };
  loadMaps();
});

/* BACKEND STATUS */
async function pingBackend(){
  const dot = document.getElementById("backendDot");
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/health`);
    dot.style.background = r.ok ? "#2cf1c4" : "#ff9f0a";
  }catch{ dot.style.background = "#ff9f0a"; }
}

/* DASHBOARD LOAD */
async function loadDashboard(){
  const city = (document.getElementById("cityInput").value || "Split").trim();
  await Promise.all([
    loadWeather(city),
    loadPhotos(city),
    loadPOI(city),
    loadAlerts(city),
    loadSea(city),
    loadTraffic()
  ]);
  focusMaps(city);
}

/* WEATHER */
async function loadWeather(city){
  const box = document.getElementById("weatherBox");
  box.innerHTML = "Učitavam…";
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    if(d?.main){
      const t = Math.round(d.main.temp);
      const desc = (d.weather?.[0]?.description || "").toLowerCase();
      box.innerHTML = `<div class="big">${t}°C</div><div>${city}</div><div>${desc}</div>`;
    }else{
      box.textContent = "N/A";
    }
  }catch{ box.textContent = "Greška vremena"; }
}

/* PHOTOS */
async function loadPhotos(city){
  const wrap = document.querySelector('[data-photos]') || createPhotosBox();
  wrap.innerHTML = "";
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/photos?q=${encodeURIComponent(city)}`);
    const d = await r.json();
    (d.results||[]).slice(0,6).forEach(p=>{
      const img = document.createElement("img");
      img.src = p.urls?.small; img.alt = city; img.loading="lazy";
      img.referrerPolicy="no-referrer";
      wrap.appendChild(img);
    });
  }catch{ wrap.textContent = "Greška fotografija"; }
}
function createPhotosBox(){
  const photosCard = [...document.querySelectorAll(".card")].find(c=>c.querySelector("h2")?.textContent.includes("Fotografije"));
  const wrap = document.createElement("div");
  wrap.className = "photos"; wrap.dataset.photos = "1";
  photosCard?.appendChild(wrap);
  return wrap;
}

/* POI */
async function loadPOI(city){
  const box = document.getElementById("poiBox");
  box.innerHTML = "Učitavam…";
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    if(!d?.items?.length){ box.textContent="Nema podataka"; return; }
    box.innerHTML = "";
    d.items.forEach(p=>{
      const it = document.createElement("div");
      it.className = "poi-item";
      it.innerHTML = `<strong>${p.name}</strong><div class="muted">${p.short||""}</div>`;
      it.onclick = ()=> moveStreet(p.lat,p.lon);
      box.appendChild(it);
    });
  }catch{ box.textContent="Greška POI"; }
}

/* ALERTS */
async function loadAlerts(city){
  const tick = document.getElementById("alertsTicker");
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    tick.textContent = (d.alerts||[]).map(a=>a.message).join("  •  ");
  }catch{ tick.textContent = "Alert sustav trenutno nije dostupan"; }
}

/* SEA (placeholder – koristi se meteo info) */
async function loadSea(city){
  const sea = document.getElementById("seaBox");
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const t = Math.round(d.main?.temp || 18);
    const h = Math.round(d.main?.humidity || 72);
    sea.innerHTML = `<div class="big">${t}.0 °C</div><div>Vlažnost ${h}%</div>`;
  }catch{ sea.textContent="Greška mora"; }
}

/* TRAFFIC (placeholder) */
async function loadTraffic(){
  const t = document.getElementById("trafficMap");
  if(!trafficMap) return;
  // demo sloj prometa
  const trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(trafficMap);
}

/* CHAT */
async function sendMessage(){
  const input = document.getElementById("assistantInput");
  const msg = input.value.trim();
  if(!msg) return;
  input.value = "";
  addMsg("user", msg);

  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/chat`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message: msg })
    });
    const d = await r.json();
    addMsg("bot", d.reply || "OK.");
  }catch{
    addMsg("bot", "Backend nedostupan. Pokušaj ponovno.");
  }
}
function addMsg(who, text){
  const box = document.getElementById("messages");
  const div = document.createElement("div"); div.className = who;
  div.textContent = text; box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* MAPS */
function initMaps(){
  const split = { lat: 43.5081, lng: 16.4402 };

  navMap = new google.maps.Map(document.getElementById("navMap"), { center: split, zoom: 12, mapId:"TBW_NAV" });
  miniMap = new google.maps.Map(document.getElementById("miniMap"), { center: split, zoom: 11, mapId:"TBW_MINI" });
  trafficMap = new google.maps.Map(document.getElementById("trafficMap"), { center: split, zoom: 11, mapId:"TBW_TRF" });

  // Directions
  directionsSvc = new google.maps.DirectionsService();
  directions = new google.maps.DirectionsRenderer({ map: navMap });

  // Street View
  streetViewPanorama = new google.maps.StreetViewPanorama(document.getElementById("streetView"), {
    position: split, pov: { heading: 34, pitch: 0 }, zoom: 1
  });
}

function moveStreet(lat,lon){
  if(streetViewPanorama) streetViewPanorama.setPosition({lat, lng:lon});
  if(miniMap) miniMap.panTo({lat, lng:lon});
}

async function focusMaps(city){
  try{
    const g = new google.maps.Geocoder();
    g.geocode({ address: city }, (res, status)=>{
      if(status==="OK" && res[0]){
        const loc = res[0].geometry.location;
        [navMap, miniMap, trafficMap].forEach(m=> m && m.panTo(loc));
        if(streetViewPanorama) streetViewPanorama.setPosition(loc);
      }
    });
  }catch{}
}

function makeRoute(){
  const from = document.getElementById("routeFrom").value.trim();
  const to = document.getElementById("routeTo").value.trim();
  if(!to) return alert("Unesi odredište");

  const req = {
    origin: from || navMap.getCenter(),
    destination: to,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsSvc.route(req).then(r=> directions.setDirections(r))
    .catch(()=> alert("Rutu nije moguće izračunati."));
}

/* HOTELS (demo preko Google Places ‘textSearch’) */
async function searchHotels(){
  const city = (document.getElementById("hotelCity").value || "Split").trim();
  const service = new google.maps.places.PlacesService(navMap);
  const list = document.getElementById("hotelResults");
  list.innerHTML = "Tražim…";
  service.textSearch({ query: `hotels in ${city}`, type: "lodging" }, (res,status)=>{
    if(status !== google.maps.places.PlacesServiceStatus.OK || !res?.length){
      list.textContent = "Nema rezultata."; return;
    }
    list.innerHTML = "";
    res.slice(0,6).forEach(p=>{
      const it = document.createElement("div"); it.className = "poi-item";
      const price = Math.floor(40 + Math.random()*80);
      it.innerHTML = `<strong>${p.name}</strong><div class="muted">${p.formatted_address||""}</div><div>≈ ${price} € / noć</div>`;
      list.appendChild(it);
    });
  });
}
