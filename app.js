/* TBW AI PREMIUM – Hybrid UI (Google + AI) */
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };

// ---------- helperi ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function loadConfig() {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) throw 0;
    CFG = await res.json();
  } catch {
    console.warn("config.json nije dostupan – koristim fallback");
  }
}

// robust fetch na backend
async function api(path, params = {}) {
  if (!CFG.API_BASE_URL) return { ok:false };
  try {
    const url = new URL(path, CFG.API_BASE_URL);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
    const res = await fetch(url.toString());
    if (!res.ok) throw res.status;
    return await res.json();
  } catch (e) {
    console.warn("API fail", path, e);
    return { ok:false };
  }
}

// ---------- Ticker ----------
async function initTicker(cityValue) {
  const track = $("#tickerTrack");
  const chunks = [];

  // Alerts / news
  const alerts = await api("/api/alerts", { city: cityValue || "Zagreb" });
  if (alerts?.items?.length) {
    alerts.items.forEach(a => chunks.push(`⚠️ ${a.title}`));
  } else {
    chunks.push("TBW LIVE · promet uglavnom uredan.");
  }

  // Otvorene trgovine (demo ili backend)
  const shops = await api("/api/shops/open", { city: cityValue || "Zagreb" });
  if (shops?.items?.length) {
    const txt = shops.items.slice(0,4).map(s => `${s.name} ${s.status}`).join(" • ");
    chunks.push(`🛒 ${txt}`);
  } else {
    chunks.push("🛒 Lidl i Kaufland otvoreni · Konzum zatvara u 21:00");
  }

  // Prometni događaji
  const traffic = await api("/api/traffic/events", { city: cityValue || "Zagreb" });
  if (traffic?.items?.length) {
    chunks.push(...traffic.items.slice(0,3).map(t => `🚧 ${t.msg}`));
  }

  track.textContent = "  •  " + chunks.join("  •  ") + "  •  ";
}

// ---------- Google Maps ----------
let gmap, gdir, gsv, gmarker, trafficLayer;

function injectMapsScript(key) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&callback=__ginit`;
    s.async = true;
    s.onerror = reject;
    window.__ginit = () => resolve();
    document.head.appendChild(s);
  });
}

async function initMap(city="Zagreb") {
  await injectMapsScript(CFG.MAPS_API_KEY);
  const center = { lat: 45.813, lng: 15.977 }; // Zagreb default

  gmap = new google.maps.Map($("#map"), {
    center, zoom: 8, mapId: "TBW_DARK",
    streetViewControl: false, fullscreenControl: true
  });
  gdir = new google.maps.DirectionsService();
  const dr = new google.maps.DirectionsRenderer({ map: gmap, suppressMarkers:false });
  gmarker = new google.maps.Marker({ position:center, map:gmap });
  gsv = new google.maps.StreetViewPanorama($("#pano"), { position:center, pov:{heading:0,pitch:0}, visible:true });
  gmap.setStreetView(gsv);

  // mini promet
  const mini = new google.maps.Map($("#trafficMini"), { center, zoom: 6, streetViewControl:false, mapTypeControl:false });
  const tl = new google.maps.TrafficLayer(); tl.setMap(mini);

  // Traffic toggle
  $("#trafficToggle").addEventListener("click", () => {
    if (!trafficLayer) trafficLayer = new google.maps.TrafficLayer();
    const isOn = !!trafficLayer.getMap();
    trafficLayer.setMap(isOn ? null : gmap);
  });

  // Simple geocode global search -> set maps center
  $("#searchBtn").addEventListener("click", async () => {
    const q = $("#globalSearch").value.trim();
    if (!q) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: q }, (res, status) => {
      if (status === "OK" && res[0]) {
        const loc = res[0].geometry.location;
        gmap.panTo(loc); gmap.setZoom(12);
        gmarker.setPosition(loc);
        gsv.setPosition(loc);
        // refresh info kartica:
        initTicker(q);
        loadWeather(q);
        loadSea(q);
      }
    });
  });

  // Route
  $("#routeBtn").addEventListener("click", async () => {
    const from = $("#navFrom").value.trim();
    const to = $("#navTo").value.trim() || $("#globalSearch").value.trim();
    if (!to) return alert("Upiši odredište.");
    const req = { origin: from || undefined, destination: to, travelMode: google.maps.TravelMode.DRIVING };
    gdir.route(req, (res, status) => {
      if (status === "OK") dr.setDirections(res);
    });
  });

  // klik na karticu -> fullscreen
  bindFullscreenModules();
}

// ---------- Vrijeme, more ----------
async function loadWeather(city="Zagreb"){
  const out = $("#weatherList");
  out.innerHTML = "<li>Učitavam…</li>";
  const data = await api("/api/weather", { city });
  const now = [];
  if (data?.temp) now.push(`🌡️ Temp: ${data.temp}°C`);
  if (data?.wind) now.push(`🌬️ Vjetar: ${data.wind} m/s`);
  if (data?.humidity) now.push(`💧 Vlažnost: ${data.humidity}%`);
  if (data?.air) now.push(`🫁 Zrak: ${data.air}`);
  if (!now.length) now.push("Nema podataka, prikazujem demo.");
  out.innerHTML = now.map(x=>`<li>${x}</li>`).join("");
}

async function loadSea(city="Split"){
  const t = $("#seaTemp"), w = $("#seaWaves"), v = $("#seaWind"), ph = $("#seaPhotos");
  t.textContent = "–"; w.textContent = "–"; v.textContent="–"; ph.innerHTML = "";
  const data = await api("/api/sea", { city });
  if (data?.temp) t.textContent = `${data.temp} °C`;
  if (data?.waves) w.textContent = data.waves;
  if (data?.wind) v.textContent = data.wind;
  const photos = (data?.photos && data.photos.length ? data.photos : []).slice(0,6);
  photos.forEach(u => {
    const img = new Image(); img.src = u; img.loading="lazy"; ph.appendChild(img);
  });
}

// ---------- Rezervacije (otvara partnere) ----------
function buildStayUrl(engine, q){
  const city = encodeURIComponent(q.where || "Split");
  const start = q.from ? `checkin=${q.from}` : "";
  const end   = q.to   ? `&checkout=${q.to}`: "";
  const guests= `&group_adults=${q.guests||2}`;
  if (engine==="booking") return `https://www.booking.com/searchresults.html?ss=${city}${start}${end}${guests}`;
  if (engine==="expedia") return `https://www.expedia.com/Hotel-Search?destination=${city}`;
  if (engine==="airbnb")  return `https://www.airbnb.com/s/${city}/homes?adults=${q.guests||2}`;
  return "#";
}

function initStay(){
  $("#staySearch").addEventListener("click", () => openStay("booking"));
  $("#stayBook").addEventListener("click", () => openStay("booking"));
  $("#stayCancel").addEventListener("click", () => {
    $("#stayLocation").value = ""; $("#dateArrive").value = ""; $("#dateLeave").value = "";
  });

  function openStay(engine){
    const q = {
      where: $("#stayLocation").value || $("#globalSearch").value,
      from: $("#dateArrive").value,
      to: $("#dateLeave").value,
      guests: +$("#guests").value || 2
    };
    const url = buildStayUrl(engine, q);
    window.open(url, "_blank","noopener");
  }
}

// ---------- Glas (Web Speech API) ----------
let recog, speaking = false;
function initVoice(){
  const micBtn = $("#micBtn");
  const search = $("#globalSearch");

  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recog = new SR();
    recog.lang = "hr-HR";
    recog.interimResults = false;
    recog.continuous = true;

    micBtn.addEventListener("click", () => {
      const on = micBtn.getAttribute("aria-pressed")==="true";
      if (on){ recog.stop(); micBtn.setAttribute("aria-pressed","false"); micBtn.textContent="🎤"; }
      else   { recog.start(); micBtn.setAttribute("aria-pressed","true");  micBtn.textContent="🛑"; }
    });

    recog.onresult = (e)=>{
      const txt = [...e.results].slice(-1)[0][0].transcript.trim();
      search.value = txt;
      // jednostavna namjera: “ruta do …”
      const m = txt.toLowerCase().match(/ruta do (.+)/);
      if (m) { $("#navTo").value = m[1]; $("#routeBtn").click(); tts(`Pokrećem rutu do ${m[1]}`); }
      else { $("#searchBtn").click(); tts(`Tražim ${txt}`); }
    };
  } else {
    micBtn.disabled = true; micBtn.title = "Glas nije podržan u ovom pregledniku";
  }
}

function tts(text){
  try{
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hr-HR";
    speechSynthesis.speak(u);
  }catch{}
}

// ---------- Fullscreen modal ----------
function bindFullscreenModules(){
  $$("[data-expand]").forEach(b=>{
    b.onclick = ()=>{
      const card = b.closest(".card");
      const title = card.querySelector(".card-head h3")?.textContent || "Detalji";
      $("#modalTitle").textContent = title;
      const body = $("#modalBody");
      body.innerHTML = "";
      // kloniramo tijelo kartice u modal
      const clone = card.querySelector(".card-body").cloneNode(true);
      clone.querySelectorAll("input").forEach(i=>i.setAttribute("readonly","readonly"));
      body.appendChild(clone);
      $("#modal").setAttribute("aria-hidden","false");
    };
  });
  $("#modalClose").onclick = ()=> $("#modal").setAttribute("aria-hidden","true");
  $("#modal").addEventListener("click",(e)=>{ if(e.target.id==="modal") $("#modal").setAttribute("aria-hidden","true"); });
}

// ---------- Init ----------
(async function main(){
  await loadConfig();

  // status backend veze
  try{
    const res = await fetch(new URL("/api/health", CFG.API_BASE_URL), { cache:"no-store" });
    if (res.ok) $("#connDot").classList.add("ok");
  }catch{}

  // UI init
  initVoice();
  initStay();
  await initMap("Zagreb");
  await loadWeather("Zagreb");
  await loadSea("Split");
  await initTicker("Zagreb");

  // global search enter
  $("#globalSearch").addEventListener("keydown",(e)=>{ if(e.key==="Enter") $("#searchBtn").click(); });
})();
