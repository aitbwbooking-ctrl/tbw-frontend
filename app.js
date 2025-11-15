// =====================================================
// TBW AI PREMIUM – FRONTEND MAIN SCRIPT (SYNCED WITH tbw.js BACKEND)
// =====================================================

const BACKEND = "https://tbw-backend.vercel.app/api/tbw";

// Universal backend call
async function api(route, params = {}) {
  const qs = new URLSearchParams({ route, ...params }).toString();
  const res = await fetch(`${BACKEND}?${qs}`);
  if (!res.ok) throw new Error("Backend error: " + res.status);
  return res.json();
}

// DOM refs
const weatherBox = document.getElementById("weatherBox");
const trafficBox = document.getElementById("trafficInfo");
const seaBox = document.getElementById("seaBox");
const servicesBox = document.getElementById("servicesBox");
const transitBox = document.getElementById("transitBox");
const airportBox = document.getElementById("airportBox");
const tickerContent = document.getElementById("tickerContent");
const globalSearch = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");

// =====================================================
// LOAD WEATHER
// =====================================================
async function loadWeather() {
  try {
    const data = await api("weather", { city: "Split" });
    weatherBox.querySelector(".weatherContent").innerHTML = `
      <div class="weatherNow">${data.temp}°C</div>
      <div class="weatherDesc">${data.condition}</div>
    `;
  } catch {
    weatherBox.innerHTML = "<h3>Vrijeme</h3><div>Greška.</div>";
  }
}

// =====================================================
// LOAD TRAFFIC
// =====================================================
async function loadTraffic() {
  try {
    const d = await api("traffic", { city: "Split" });
    trafficBox.innerHTML = `
      <h3>Promet uživo</h3>
      <div>Status: ${d.traffic_status}</div>
      <div>Brzina: ${d.speed} km/h</div>
    `;
  } catch {
    trafficBox.innerHTML = "<h3>Promet uživo</h3><div>Greška.</div>";
  }
}

// =====================================================
// LOAD SEA & FERRIES
// =====================================================
async function loadSea() {
  try {
    const d = await api("sea");
    seaBox.innerHTML = `
      <h3>Stanje mora & trajekti</h3>
      <div>${d.info || "N/A"}</div>
    `;
  } catch {
    seaBox.innerHTML = "<h3>Stanje mora</h3><div>Greška.</div>";
  }
}

// =====================================================
// LOAD SHOPS & SERVICES
// =====================================================
async function loadServices() {
  try {
    const d = await api("shops", { city: "Split" });
    servicesBox.innerHTML = `
      <h3>Servisi i trgovine</h3>
      ${d.items
        .map(
          (x) => `<div>${x.name} – ${x.status} (zatvara ${x.closes})</div>`
        )
        .join("")}
    `;
  } catch {
    servicesBox.innerHTML = "<h3>Servisi</h3><div>Greška.</div>";
  }
}

// =====================================================
// LOAD TRANSIT
// =====================================================
async function loadTransit() {
  try {
    const d = await api("transit");
    transitBox.innerHTML = `
      <h3>Javni prijevoz</h3>
      ${d.buses.map((b) => `<div>Bus ${b.line}: ${b.next}</div>`).join("")}
    `;
  } catch {
    transitBox.innerHTML = "<h3>Javni prijevoz</h3><div>Greška.</div>";
  }
}

// =====================================================
// LOAD AIRPORTS & RDS
// =====================================================
async function loadAirport() {
  try {
    const d = await api("airport");
    airportBox.innerHTML = `
      <h3>Aerodromi & RDS alarmi</h3>
      ${d.flights
        .map((f) => `<div>${f.flight_no} – ETA ${f.eta}</div>`)
        .join("")}
    `;
  } catch {
    airportBox.innerHTML = "<h3>Aerodromi</h3><div>Greška.</div>";
  }
}

// =====================================================
// LOAD ALERT TICKER
// =====================================================
async function loadAlerts() {
  try {
    const d = await api("alerts");
    tickerContent.innerText = d.alerts.map((a) => a.message).join(" • ");
  } catch {
    tickerContent.innerText = "Upozorenja nedostupna.";
  }
}

// SEARCH HANDLER
searchBtn.onclick = () => {
  alert("Tražim: " + globalSearch.value);
};

// =====================================================
// INIT
// =====================================================
loadWeather();
loadTraffic();
loadSea();
loadServices();
loadTransit();
loadAirport();
loadAlerts();

console.log("TBW FRONTEND LOADED");
