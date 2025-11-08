// === CONFIG ===
const CONFIG_URL = "/config.json";
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };

async function loadConfig(){
  const r = await fetch(CONFIG_URL, { cache:"no-store" });
  CFG = await r.json();
}

// === UI HELPERS ===
const $ = (q) => document.querySelector(q);
const $box = (id) => document.getElementById(id);

function setTicker(text){ $box("alertsTicker").textContent = text; }
function msg(html){ return `<div class="result-item">${html}</div>`; }

// === MAPS ===
let navMap, miniMap, trafficMap, streetView;
function initMaps(){
  // Nav
  navMap = new google.maps.Map($box("navMap"), { center:{lat:45.8,lng:16.0}, zoom:7, mapId:"TBW_NAV" });
  // Mini
  miniMap = new google.maps.Map($box("miniMap"), { center:{lat:45.6,lng:16.5}, zoom:6, mapId:"TBW_OVERVIEW" });
  // Traffic
  trafficMap = new google.maps.Map($box("trafficMap"), { center:{lat:45.3,lng:15.8}, zoom:7, mapId:"TBW_TRAFFIC" });
  new google.maps.TrafficLayer().setMap(trafficMap);
  // Street
  streetView = new google.maps.StreetViewPanorama($box("streetView"), {
    position:{lat:43.5081,lng:16.4402}, pov:{ heading: 100, pitch: 0 }, zoom:1
  });
}

// Simple directions via URL (otvara Google Maps s rutom)
function openRoute(){
  const from = encodeURIComponent($box("routeFrom").value || "");
  const to = encodeURIComponent($box("routeTo").value || "");
  if(!to){ alert("Upiši odredište"); return; }
  const url = from
    ? `https://www.google.com/maps/dir/${from}/${to}`
    : `https://www.google.com/maps/dir/${to}`;
  window.open(url, "_blank");
}

// === DATA LOADERS (BACKEND) ===
async function checkHealth(){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/health`);
    $box("backendDot").style.background = r.ok ? "#3df0d1" : "#ff3b4e";
  }catch{
    $box("backendDot").style.background = "#ff3b4e";
  }
}

async function loadAlerts(city="Hrvatska"){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const txt = d.alerts.map(a=>a.message).join(" • ");
    setTicker(txt || "Nema posebnih upozorenja.");
  }catch{ setTicker("Nema posebnih upozorenja."); }
}

async function loadWeather(city="Zagreb"){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const t = Math.round(d.main?.temp ?? 17);
    const desc = d.weather?.[0]?.description || "-";
    $box("weatherBox").innerHTML = `<div>${city} • ${t}°C, ${desc}</div>`;
  }catch{ $box("weatherBox").textContent = "-"; }
}

async function loadPhotos(q="Split"){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/photos?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    const items = (d.results||[]).slice(0,6).map(p=>`<img src="${p.urls?.small}" alt="${q}">`).join("");
    $box("mediaBox").innerHTML = items || "<div>Nema fotografija.</div>";
  }catch{ $box("mediaBox").textContent = "-"; }
}

async function loadPOI(city="Split"){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    const html = (d.items||[]).slice(0,6).map(i=>msg(`<div><strong>${i.name}</strong><div class="meta">${i.short||""}</div></div>`)).join("");
    $box("poiBox").innerHTML = html || "<div class='meta'>Nema podataka.</div>";
  }catch{ $box("poiBox").textContent = "-"; }
}

async function loadSea(city="Split"){
  // placeholder (možeš kasnije spojiti svoj izvor/boje plave zastave)
  $box("seaBox").innerHTML = `
    ${msg(`<div><strong>Temperatura mora</strong> <span class="price">17.8 °C</span><div class="meta">Vlaga 74%</div></div>`)}
  `;
}

// === BOOKING UI ===
function bookingGoogleUrl(city, arrive, depart, guests){
  const q = encodeURIComponent(`${city} hotels from ${arrive||""} to ${depart||""} ${guests||1} guests`);
  return `https://www.google.com/maps/search/${q}`;
}

function bookingRenderPlaceholder(city){
  const list = [
    {name:"Apartman Perla", city, price:60},
    {name:"Villa Mare", city, price:82},
    {name:"City Rooms", city, price:55},
  ];
  $box("hotelResults").innerHTML = list.map(h => (
    `<div class="result-item">
      <div>
        <div><strong>${h.name}</strong> — ${h.city}</div>
        <div class="meta">Besplatan otkaz, doručak dostupan</div>
      </div>
      <div>
        <div class="price">${h.price} € / noć</div>
        <div class="meta"><a target="_blank" href="${bookingGoogleUrl(h.city)}">Prikaži na karti</a></div>
      </div>
    </div>`
  )).join("");
}

function onBookingSearch(){
  const city = $box("hotelCity").value.trim() || "Split";
  const a = $box("arrive").value;
  const d = $box("depart").value;
  const g = +($box("guests").value||2);
  // sada placeholder + link na Maps — backend end-to-end može kasnije
  bookingRenderPlaceholder(city);
  const url = bookingGoogleUrl(city, a, d, g);
  // spremi “odabir” na dataset (za Rezerviraj/Otkaži)
  $box("hotelResults").dataset.pendingUrl = url;
}

function onBookingConfirm(){
  const url = $box("hotelResults").dataset.pendingUrl;
  if(!url){ alert("Prvo pretraži smještaj."); return; }
  window.open(url, "_blank");
}

function onBookingCancel(){
  $box("hotelResults").innerHTML = "";
  delete $box("hotelResults").dataset.pendingUrl;
}

// === SEARCH (input + mic) ===
function onSearch(){
  const city = $box("cityInput").value.trim() || "Split";
  loadAlerts(city);
  loadWeather(city);
  loadPhotos(city);
  loadPOI(city);
  loadSea(city);

  // pomakni StreetView na tu lokaciju (geocode preko Maps Places)
  if(window.google?.maps?.places){
    const service = new google.maps.places.PlacesService(navMap);
    const req = { query: city, fields:["name","geometry"] };
    service.findPlaceFromQuery(req, (res, status) => {
      if(status === google.maps.places.PlacesServiceStatus.OK && res[0]?.geometry?.location){
        const loc = res[0].geometry.location;
        streetView.setPosition(loc);
        navMap.setCenter(loc); navMap.setZoom(11);
      }
    });
  }
}

function initMic(){
  const btn = $box("micBtn");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ btn.style.display="none"; return; }
  const rec = new SpeechRecognition();
  rec.lang = "hr-HR";
  btn.addEventListener("click", ()=>{
    rec.start();
    btn.textContent = "🔴";
  });
  rec.onresult = (e)=>{
    const txt = e.results[0][0].transcript;
    $box("cityInput").value = txt;
    btn.textContent = "🎤";
    onSearch();
  };
  rec.onend = ()=> btn.textContent = "🎤";
}

// === BOOT ===
(async function start(){
  await loadConfig();
  await checkHealth();
  await loadAlerts("Hrvatska");
  await loadWeather("Zagreb");
  await loadPhotos("Split");
  await loadPOI("Split");
  await loadSea("Split");

  // events
  $box("askBtn").addEventListener("click", onSearch);
  $box("routeBtn").addEventListener("click", openRoute);
  $box("bookSearchBtn").addEventListener("click", onBookingSearch);
  $box("bookConfirmBtn").addEventListener("click", onBookingConfirm);
  $box("bookCancelBtn").addEventListener("click", onBookingCancel);
  initMic();

  // load Maps JS (sa tvojim API ključem) — async loading (best-practice)
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${CFG.MAPS_API_KEY}&libraries=places&callback=__tbwMapsReady`;
  s.async = true; s.defer = true;
  document.head.appendChild(s);
})();
window.__tbwMapsReady = function(){
  initMaps();
};
