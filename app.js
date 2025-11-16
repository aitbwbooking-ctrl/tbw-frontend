// FRONTEND TBW AI – FIXED VERSION

const API_BASE = "https://tbw-backend.vercel.app/api/tbw";

let currentLang = "hr";
let currentCity = "Split";

// ------ i18n -----

const TEXT = {
  hr: {
    searchPlaceholder: "Pretraži (Split…)",
    searchBtn: "Traži",
    weather: "Vrijeme",
    traffic: "Promet uživo",
    sea: "Stanje mora",
    services: "Servisi",
    transit: "Javni prijevoz",
    airport: "Letovi",
    heroLine: "Upozorenja · Vrijeme · Promet · More · Letovi",
    loading: "Učitavanje...",
    online: "Backend: online",
    offline: "Backend: offline",
  },
  en: {
    searchPlaceholder: "Search (Split…)",
    searchBtn: "Search",
    weather: "Weather",
    traffic: "Live traffic",
    sea: "Sea",
    services: "Services",
    transit: "Transit",
    airport: "Airport",
    heroLine: "Alerts · Weather · Traffic · Sea · Flights",
    loading: "Loading...",
    online: "Backend online",
    offline: "Backend offline",
  }
};

function t(k){return TEXT[currentLang][k]}

// helper
function qs(id){return document.getElementById(id)}

// API fetch
async function callApi(route) {
  const url = `${API_BASE}?route=${route}&city=${currentCity}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(res.status);
  return res.json();
}

// ----- LOADERS -----

async function checkBackend(){
  const el = qs("backendStatus");
  try {
    await callApi("weather");
    el.textContent = t("online");
    el.className = "ok";
  } catch {
    el.textContent = t("offline");
    el.className = "err";
  }
}

async function loadWeather(){
  const box = qs("weatherContent");
  box.textContent = t("loading");

  try{
    const d = await callApi("weather");
    box.innerHTML = `
      <b>${d.city}</b><br>
      <span style="font-size:22px">${d.temperature}°C</span><br>
      ${d.condition}
    `;
    runWeatherAnim(d.condition);
  }catch{ box.textContent="Greška" }
}

async function loadTraffic(){
  const box = qs("trafficContent");
  box.textContent = t("loading");
  try {
    const d = await callApi("traffic");
    box.innerHTML = `
      Status: <b>${d.traffic_status}</b><br>
      Brzina: ${d.speed}<br>
      Kašnjenje: ${d.delay}
    `;
  } catch { box.textContent = "Greška"; }
}

async function loadSea(){
  const box = qs("seaContent");
  box.textContent = t("loading");
  try {
    const d = await callApi("sea");
    box.innerHTML = `
      Temperatura: ${d.temperature}°C<br>
      ${d.note}
    `;
  } catch { box.textContent = "Greška"; }
}

async function loadServices(){
  const box = qs("servicesContent");
  box.textContent = t("loading");
  try {
    const d = await callApi("services");
    box.innerHTML = d.items.map(s => `${s.name} – ${s.status}`).join("<br>");
  } catch { box.textContent = "Greška"; }
}

async function loadTransit(){
  const box = qs("transitContent");
  box.textContent = t("loading");
  try {
    const d = await callApi("transit");
    box.innerHTML = d.buses
      .map(b => `${b.line}: ${b.from} → ${b.to} · ${b.next}`)
      .join("<br>");
  } catch { box.textContent = "Greška"; }
}

async function loadAirport(){
  const box = qs("airportContent");
  box.textContent = t("loading");
  try {
    const d = await callApi("airport");
    box.innerHTML = d.flights
      .map(f => `${f.flight_no}: ${f.from} → ${f.to} · ${f.eta} (${f.status})`)
      .join("<br>");
  } catch { box.textContent = "Greška"; }
}

async function loadAlerts(){
  const box = qs("tickerContent");
  try{
    const d = await callApi("alerts");
    box.textContent = d.alerts.map(a=>a.message).join(" · ");
  }catch{
    box.textContent = "Upozorenja nedostupna";
  }
}

// WEATHER ANIM
function runWeatherAnim(condition){
  const canvas = qs("weatherAnim");
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  let dropY = 0;

  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#90caf9";

    if(/rain/i.test(condition)){
      ctx.fillRect(50, dropY, 2, 10);
      dropY += 4;
      if(dropY > canvas.height) dropY = -20;
    }

    requestAnimationFrame(frame);
  }

  frame();
}

// LANGUAGE
function applyLang(){
  qs("globalSearch").placeholder = t("searchPlaceholder");
  qs("searchBtn").textContent = t("searchBtn");
  qs("weatherTitle").textContent = t("weather");
  qs("trafficTitle").textContent = t("traffic");
  qs("seaTitle").textContent = t("sea");
  qs("servicesTitle").textContent = t("services");
  qs("transitTitle").textContent = t("transit");
  qs("airportTitle").textContent = t("airport");
  qs("heroLine").textContent = t("heroLine");
}

// SEARCH
function initSearch(){
  const box = qs("globalSearch");
  const btn = qs("searchBtn");

  function go(){
    if(!box.value.trim()) return;
    currentCity = box.value.trim();
    loadAll();
  }

  btn.onclick = go;
  box.onkeydown = e => { if(e.key==="Enter") go() }
}

// LOAD ALL
function loadAll(){
  checkBackend();
  loadAlerts();
  loadWeather();
  loadTraffic();
  loadSea();
  loadServices();
  loadTransit();
  loadAirport();
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  applyLang();
  initSearch();
  loadAll();

  qs("langHR").onclick = () => { currentLang="hr"; applyLang(); loadAll(); }
  qs("langEN").onclick = () => { currentLang="en"; applyLang(); loadAll(); }
});
