// UČITAJ CONFIG (backend i Google Maps ključ)
let CONFIG = { API_BASE_URL: "", MAPS_API_KEY: "" };
async function loadConfig() {
  try {
    const r = await fetch("/config.json?v=6");
    CONFIG = await r.json();
  } catch (e) {
    console.error("Config load failed", e);
  }
}

// Dinamički učitaj Google Maps
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Global
let maps = {
  nav: null, mini: null, traffic: null, street: null,
  dirService: null, dirRenderer: null
};

// INIT
window.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  registerSW();
  wireUI();
  await startIntro();
  heartbeatBackend();
  startTicker();

  // Default grad
  const defaultCity = "Split";
  document.getElementById("cityInput").value = defaultCity;
  document.getElementById("hotelCity").value = defaultCity;

  await loadGoogleMaps(CONFIG.MAPS_API_KEY);
  initMaps(defaultCity);
  loadWeather(defaultCity);
  loadSea(defaultCity);
  loadPOI(defaultCity);
});

// Intro (5s + zvuk + preskok)
function startIntro() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("introOverlay");
    const audio = document.getElementById("introAudio");
    const btn = document.getElementById("skipIntro");
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      overlay.style.display = "none";
      resolve();
    };

    audio?.play().catch(()=>{});
    btn.addEventListener("click", finish);
    setTimeout(finish, 5000);
  });
}

// SW
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(()=>{});
  }
}

// UI events
function wireUI() {
  document.getElementById("askBtn").addEventListener("click", onCitySearch);
  document.getElementById("routeBtn").addEventListener("click", drawRoute);
  document.getElementById("sendBtn").addEventListener("click", sendAI);
}
async function onCitySearch() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;
  if (!window.google?.maps) await loadGoogleMaps(CONFIG.MAPS_API_KEY);
  recenterMaps(city);
  loadWeather(city);
  loadSea(city);
  loadPOI(city);
}

// Backend status + zelena točka
async function heartbeatBackend() {
  const dot = document.getElementById("backendDot");
  try {
    const r = await fetch(`${CONFIG.API_BASE_URL}/api/health`);
    dot.style.background = r.ok ? "#30e091" : "#ff9966";
  } catch {
    dot.style.background = "#ff6b6b";
  }
}

// Ticker alerts
async function startTicker() {
  const t = document.getElementById("alertsTicker");
  try {
    const city = document.getElementById("cityInput").value || "Hrvatska";
    const r = await fetch(`${CONFIG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const text = (d.alerts || []).map(a => `• ${a.message}`).join("     ");
    t.innerHTML = `<span>${text || "Nema aktivnih upozorenja."}</span>`;
  } catch {
    t.innerHTML = `<span>Nema aktivnih upozorenja.</span>`;
  }
}

/* ------------------ MAPS ------------------ */
function initMaps(city) {
  maps.dirService = new google.maps.DirectionsService();
  maps.dirRenderer = new google.maps.DirectionsRenderer({ suppressMarkers:false });

  maps.nav = new google.maps.Map(document.getElementById("navMap"), { zoom:13, center:{lat:43.5081,lng:16.4402}, mapId:"TBW_NAV" });
  maps.mini = new google.maps.Map(document.getElementById("miniMap"), { zoom:10, center:{lat:43.5081,lng:16.4402}, mapId:"TBW_MINI" });
  maps.traffic = new google.maps.Map(document.getElementById("trafficMap"), { zoom:12, center:{lat:43.5081,lng:16.4402} });
  new google.maps.TrafficLayer().setMap(maps.traffic);

  maps.dirRenderer.setMap(maps.nav);

  // Street View pano
  maps.street = new google.maps.StreetViewPanorama(
    document.getElementById("streetView"),
    { position:{lat:43.5081,lng:16.4402}, pov:{heading:165,pitch:0}, zoom:1 }
  );

  recenterMaps(city);
}

// Geocode grad i recenter
function recenterMaps(city){
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: city }, (res, status) => {
    if (status === "OK" && res[0]) {
      const loc = res[0].geometry.location;
      [maps.nav, maps.mini, maps.traffic].forEach(m => m.setCenter(loc));
      maps.street.setPosition(loc);
      new google.maps.Marker({ map: maps.nav, position: loc });
      new google.maps.Marker({ map: maps.mini, position: loc });
    }
  });
}

// Rute
function drawRoute(){
  const from = document.getElementById("routeFrom").value.trim();
  const to = document.getElementById("routeTo").value.trim();
  if (!to) return;
  const req = {
    origin: from || maps.nav.getCenter(),
    destination: to,
    travelMode: google.maps.TravelMode.DRIVING
  };
  maps.dirService.route(req,(result,status)=>{
    if(status==="OK"){ maps.dirRenderer.setDirections(result); }
  });
}

/* ------------------ WEATHER / SEA / POI ------------------ */
async function loadWeather(city){
  const box = document.getElementById("weatherBox");
  box.innerHTML = "Učitavam vrijeme…";
  try{
    const r = await fetch(`${CONFIG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    if (d?.main) {
      const icon = d.weather?.[0]?.icon || "01d";
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" width="64" height="64" alt="">
          <div>
            <div style="font-size:28px;font-weight:700">${Math.round(d.main.temp)}°C</div>
            <div>${d.weather?.[0]?.description || ""}</div>
            <div>Vjetar: ${Math.round(d.wind?.speed || 0)} m/s • Vlaga: ${d.main.humidity}%</div>
          </div>
        </div>`;
    } else {
      box.innerHTML = "Nema podataka.";
    }
  }catch{ box.innerHTML = "Greška pri dohvaćanju vremena."; }
}

// Jednostavan “sea state” placeholder (možeš kasnije spojiti na svoj izvor)
async function loadSea(city){
  const box = document.getElementById("seaBox");
  box.innerHTML = `
    <div style="font-size:26px">🌊 18.2 °C</div>
    <div>Valovi niski • UV umjeren</div>
    <div>${city} – informativno</div>
  `;
}

async function loadPOI(city){
  const box = document.getElementById("poiBox");
  box.innerHTML = "Učitavam znamenitosti…";
  try{
    const r = await fetch(`${CONFIG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const items = (d.items||[]).slice(0,6).map(p=>`
      <div class="hotel">
        <div style="flex:1">
          <h4>${p.name}</h4>
          <div style="color:#9ec2d1">${p.short || ""}</div>
        </div>
      </div>`).join("");
    box.innerHTML = items || "Nema zapisa.";
  }catch{ box.innerHTML = "Greška pri dohvaćanju znamenitosti."; }
}

/* ------------------ REZERVACIJE (Google Places TextSearch) ------------------ */
async function searchHotels(){
  const city = document.getElementById("hotelCity").value.trim() || "Split";
  const results = document.getElementById("hotelResults");
  results.innerHTML = "Pretražujem smještaj…";

  // TextSearch preko Places web servisa (client-side)
  const qs = new URLSearchParams({
    query: `${city} hotels`,
    key: CONFIG.MAPS_API_KEY
  }).toString();

  try{
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${qs}`);
    const d = await r.json();
    const html = (d.results||[]).slice(0,6).map(h=>{
      const photoRef = h.photos?.[0]?.photo_reference;
      const photo = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${CONFIG.MAPS_API_KEY}`
        : "https://via.placeholder.com/120x80?text=Hotel";
      return `
        <div class="hotel">
          <img src="${photo}" width="120" height="80" style="border-radius:8px;object-fit:cover"/>
          <div style="flex:1">
            <h4>${h.name}</h4>
            <div>${h.formatted_address || ""}</div>
            <div>Ocjena: ${h.rating || "–"} ⭐</div>
          </div>
          <a class="btn sm" target="_blank" href="https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${h.place_id}">Detalji</a>
        </div>`;
    }).join("");
    results.innerHTML = html || "Nema rezultata.";
  }catch{
    results.innerHTML = "Greška pri pretrazi.";
  }
}

/* ------------------ AI CHAT DEMO (/api/describe) ------------------ */
async function sendAI(){
  const input = document.getElementById("assistantInput");
  const msg = input.value.trim();
  if (!msg) return;
  pushMsg("user", msg);
  input.value = "";

  // demo: koristi /api/describe?name=
  try{
    const r = await fetch(`${CONFIG.API_BASE_URL}/api/describe?name=${encodeURIComponent(msg)}&city=${encodeURIComponent(document.getElementById("cityInput").value || "Hrvatska")}`);
    const d = await r.json();
    pushMsg("bot", d.speech || "Nemam podatke.");
  }catch{
    pushMsg("bot", "Greška pri odgovoru.");
  }
}
function pushMsg(role,text){
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = role === "user" ? "user" : "bot";
  div.textContent = text;
  box.appendChild(div);
}

/* ------------------ Events ------------------ */
document.addEventListener("click", (e)=>{
  if (e.target?.id === "bookBtn") searchHotels();
});

/* ------------------ Kraj ------------------ */
