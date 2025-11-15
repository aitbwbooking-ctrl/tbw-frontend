// ==========================================
// TBW AI PREMIUM – FRONTEND (FINAL)
// Spojeno na: https://tbw-backend.vercel.app/api/tbw
// ==========================================

const BACKEND_BASE = "https://tbw-backend.vercel.app/api/tbw";

// -------------------------------------------------
// Helper za API pozive
// -------------------------------------------------
async function api(route, params = {}) {
  const qs = new URLSearchParams({ route, ...params }).toString();
  const res = await fetch(`${BACKEND_BASE}?${qs}`);
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

// -------------------------------------------------
// INTRO – komet + supernova
// -------------------------------------------------
const introOverlay = document.getElementById("introOverlay");
const introCanvas = document.getElementById("introCanvas");
const introAudio  = document.getElementById("introAudio");
const skipIntroBtn = document.getElementById("skipIntro");

function runIntro() {
  if (!introCanvas) return;
  const ctx = introCanvas.getContext("2d");
  let w, h;

  function resize() {
    w = introCanvas.width = window.innerWidth;
    h = introCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * 1.2 + 0.2
  }));

  let comet = { x: -50, y: h * 0.3, vx: 6, vy: 1.1 };
  let start = null;

  function frame(t) {
    if (!start) start = t;
    const dt = t - start;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    // zvijezde
    for (const s of stars) {
      s.x -= s.z * 0.6;
      if (s.x < 0) s.x = w;
      ctx.fillStyle = "white";
      ctx.fillRect(s.x, s.y, 1.5 * s.z, 1.5 * s.z);
    }

    // komet
    comet.x += comet.vx;
    comet.y += comet.vy;
    ctx.beginPath();
    ctx.fillStyle = "#ffd180";
    ctx.arc(comet.x, comet.y, 5, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(
      comet.x,
      comet.y,
      comet.x - 90,
      comet.y - 30
    );
    grad.addColorStop(0, "rgba(255,255,255,0.7)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(comet.x - 2, comet.y);
    ctx.lineTo(comet.x - 90, comet.y - 30);
    ctx.stroke();

    if (dt < 4600) {
      requestAnimationFrame(frame);
    } else {
      // supernova
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 200, 0, Math.PI * 2);
      ctx.fill();
      setTimeout(() => {
        introOverlay.style.opacity = "0";
        setTimeout(() => (introOverlay.style.display = "none"), 600);
      }, 200);
    }
  }

  if (introAudio) {
    introAudio.currentTime = 0;
    introAudio.play().catch(() => {});
  }
  requestAnimationFrame(frame);
}

if (introOverlay) {
  if (localStorage.getItem("tbw_intro_seen")) {
    introOverlay.style.display = "none";
  } else {
    localStorage.setItem("tbw_intro_seen", "1");
    runIntro();
  }
  if (skipIntroBtn) {
    skipIntroBtn.onclick = () => {
      introOverlay.style.display = "none";
      if (introAudio) introAudio.pause();
    };
  }
}

// -------------------------------------------------
// Jezik HR / EN – utječe na govor + tekst
// -------------------------------------------------
let currentLang = localStorage.getItem("tbw_lang") || "hr";

const langHR = document.getElementById("langHR");
const langEN = document.getElementById("langEN");

function updateLangButtons() {
  if (!langHR || !langEN) return;
  if (currentLang === "hr") {
    langHR.style.background = "#0aa";
    langEN.style.background = "#033";
  } else {
    langEN.style.background = "#0aa";
    langHR.style.background = "#033";
  }
}
updateLangButtons();

function getSpeechLang() {
  return currentLang === "hr" ? "hr-HR" : "en-US";
}

if (langHR) {
  langHR.onclick = () => {
    currentLang = "hr";
    localStorage.setItem("tbw_lang", "hr");
    updateLangButtons();
  };
}
if (langEN) {
  langEN.onclick = () => {
    currentLang = "en";
    localStorage.setItem("tbw_lang", "en");
    updateLangButtons();
  };
}

// -------------------------------------------------
// Backend health + geolocation
// -------------------------------------------------
const backendStatusEl = document.querySelector(".backendStatus");
const geoStatusEl = document.querySelector(".geoStatus");

// (ako želiš tekst statusa, možeš dodati elemente s tim klasama u HTML-u)

api("health")
  .then(() => {
    if (backendStatusEl) backendStatusEl.textContent = "Backend online";
  })
  .catch(() => {
    if (backendStatusEl) backendStatusEl.textContent = "Backend offline";
  });

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (geoStatusEl) {
        geoStatusEl.textContent = `Lokacija: ${pos.coords.latitude.toFixed(
          3
        )}, ${pos.coords.longitude.toFixed(3)}`;
      }
    },
    () => {
      if (geoStatusEl) geoStatusEl.textContent = "Lokacija onemogućena";
    }
  );
}

// -------------------------------------------------
// Ticker – alerts
// -------------------------------------------------
const tickerContent = document.getElementById("tickerContent");

async function loadTicker() {
  try {
    const data = await api("alerts");
    const msgs = (data.alerts || []).map((a) => a.message);
    tickerContent.textContent =
      msgs.length > 0 ? msgs.join(" • ") : "Nema posebnih upozorenja.";
  } catch (e) {
    tickerContent.textContent = "Upozorenja trenutno nisu dostupna.";
  }
}
loadTicker();

// -------------------------------------------------
// Helper – grad iz glavne tražilice
// -------------------------------------------------
const globalSearch = document.getElementById("globalSearch");
function getCity() {
  return globalSearch && globalSearch.value.trim()
    ? globalSearch.value.trim()
    : "Split";
}

// -------------------------------------------------
// Vrijeme + more
// -------------------------------------------------
const weatherCard = document.getElementById("weatherBox");
const seaBox = document.getElementById("seaBox");

async function loadWeather() {
  const city = getCity();
  try {
    const data = await api("weather", { city });
    if (weatherCard) {
      weatherCard.querySelector(".weatherContent").textContent =
        `${Math.round(data.temp)}°C • ${data.city || city} • ${data.condition}`;
    }
    if (seaBox) {
      const seaT = Math.max(8, Math.round(data.temp - 2));
      seaBox.innerHTML = `
        <h3>Stanje mora</h3>
        <div>${seaT}°C</div>
        <div>More oko ${city}. UV umjeren.</div>
      `;
    }
  } catch (e) {
    if (weatherCard) {
      weatherCard.querySelector(".weatherContent").textContent =
        "Greška pri dohvaćanju vremena.";
    }
    if (seaBox) {
      seaBox.innerHTML = "<h3>Stanje mora</h3><div>Greška.</div>";
    }
  }
}

// -------------------------------------------------
// Promet
// -------------------------------------------------
const trafficInfo = document.getElementById("trafficInfo");

async function loadTraffic() {
  const city = getCity();
  try {
    const data = await api("traffic", { city });
    if (trafficInfo) {
      trafficInfo.innerHTML = `
        <h3>Promet uživo</h3>
        <div>Status: ${
          data.traffic_status === "open" ? "normalan" : "zatvorena dionica"
        }</div>
        <div>Brzina: ${data.speed} / ${data.free_speed} km/h</div>
      `;
    }
  } catch {
    if (trafficInfo) {
      trafficInfo.innerHTML = `<h3>Promet uživo</h3><div>Greška.</div>`;
    }
  }
}

// -------------------------------------------------
// Servisi (shops)
// -------------------------------------------------
const servicesBox = document.getElementById("servicesBox");
async function loadServices() {
  const city = getCity();
  try {
    const data = await api("shops", { city });
    if (!servicesBox) return;
    const list = (data.items || [])
      .map(
        (s) =>
          `• ${s.name} – ${s.status || "otvoreno"} (zatvara u ${
            s.closes || "?"
          })`
      )
      .join("<br>");
    servicesBox.innerHTML = `<h3>Servisi</h3><div>${list || "Nema podataka."}</div>`;
  } catch {
    if (servicesBox) {
      servicesBox.innerHTML = `<h3>Servisi</h3><div>Greška pri dohvaćanju.</div>`;
    }
  }
}

// -------------------------------------------------
// Transit
// -------------------------------------------------
const transitBox = document.getElementById("transitBox");
async function loadTransit() {
  try {
    const data = await api("transit");
    if (!transitBox) return;
    const bus = data.buses?.[0];
    const tram = data.trams?.[0];
    transitBox.innerHTML = `
      <h3>Javni prijevoz</h3>
      <div>🚌 ${bus ? `Linija ${bus.line} → ${bus.to} (${bus.next})` : "N/A"}</div>
      <div>🚊 ${tram ? `Tramvaj ${tram.line} → ${tram.to} (${tram.next})` : "N/A"}</div>
    `;
  } catch {
    if (transitBox) {
      transitBox.innerHTML = `<h3>Javni prijevoz</h3><div>Greška.</div>`;
    }
  }
}

// -------------------------------------------------
// Aerodrom + RDS (alerts)
// -------------------------------------------------
const airportBox = document.getElementById("airportBox");
async function loadAirportAndRDS() {
  try {
    const data = await api("airport");
    const f = data.flights?.[0];
    const base = f
      ? `✈ ${f.flight_no} ${f.from} → ${f.to} (${f.status}) ETA ${f.eta}`
      : "Nema podataka o letovima.";

    let rdsText = "";
    try {
      const alerts = await api("alerts");
      const rds = (alerts.alerts || []).find(
        (a) => a.type === "accident" || a.type === "fire"
      );
      rdsText = rds ? `RDS: ${rds.message}` : "RDS: nema posebnih upozorenja.";
    } catch {
      rdsText = "RDS: greška.";
    }

    if (airportBox) {
      airportBox.innerHTML = `<h3>Aerodromi & RDS alarmi</h3><div>${base}</div><div>${rdsText}</div>`;
    }
  } catch {
    if (airportBox) {
      airportBox.innerHTML =
        "<h3>Aerodromi & RDS alarmi</h3><div>Greška.</div>";
    }
  }
}

// -------------------------------------------------
// Navigacija – kartica + backend navigate
// -------------------------------------------------
const cardNav = document.getElementById("cardNav");
const navStatus = document.getElementById("navStatus");
const navGoBtn = document.getElementById("navGo");
const navHudBtn = document.getElementById("navHud");
const navExitBtn = document.getElementById("navExit");

async function startNavigation() {
  const cityTo = getCity();
  if (navStatus) navStatus.textContent = "Računam rutu...";
  try {
    const data = await api("navigate", { from: "Vaša lokacija", to: cityTo });
    const textHr = `Ruta ${data.summary}. Udaljenost ${data.distance}, vrijeme vožnje ${data.duration}.`;
    if (navStatus) navStatus.textContent = textHr;
    speak(textHr);
  } catch {
    if (navStatus) navStatus.textContent = "Greška pri izračunu rute.";
  }
}

if (navGoBtn) navGoBtn.onclick = startNavigation;
if (navHudBtn) {
  navHudBtn.onclick = () => {
    alert("HUD demo: prikaz na vjetrobranskom staklu (buduća opcija).");
  };
}
if (navExitBtn) {
  navExitBtn.onclick = () => {
    if (navStatus) navStatus.textContent = "Nema aktivne rute";
  };
}

// -------------------------------------------------
// Booking kartica
// -------------------------------------------------
const cardBooking = document.getElementById("cardBooking");
const bookBtn = document.getElementById("bookBtn");

function openBooking() {
  const city = getCity();
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    city
  )}`;
  window.open(url, "_blank");
}
if (cardBooking) cardBooking.onclick = openBooking;
if (bookBtn) bookBtn.onclick = openBooking;

// -------------------------------------------------
// Street View kartica (demo)
// -------------------------------------------------
const cardStreet = document.getElementById("cardStreet");
if (cardStreet) {
  cardStreet.onclick = () => {
    alert(
      "Ovdje možeš kasnije ubaciti pravi Google Street View. Trenutno demo."
    );
  };
}

// -------------------------------------------------
// Voice – STT + TTS
// -------------------------------------------------
const micBtn = document.getElementById("micBtn");
const aiVoiceBtn = document.getElementById("aiVoice");

let recognition = null;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = getSpeechLang();
  window.speechSynthesis.speak(utt);
}

function startMicFor(inputEl, cb) {
  if (!recognition) {
    alert("Vaš preglednik ne podržava glasovno prepoznavanje.");
    return;
  }
  recognition.lang = getSpeechLang();
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    inputEl.value = text;
    cb && cb(text);
  };
  recognition.start();
}

if (micBtn && globalSearch) {
  micBtn.onclick = () => startMicFor(globalSearch, () => triggerAll());
}
if (aiVoiceBtn && globalSearch) {
  aiVoiceBtn.onclick = () => startMicFor(globalSearch, () => triggerAll());
}

// -------------------------------------------------
// Glavna TRAŽI – osvježava sve kartice
// -------------------------------------------------
const searchBtn = document.getElementById("searchBtn");

function triggerAll() {
  loadWeather();
  loadTraffic();
  loadServices();
  loadTransit();
  loadAirportAndRDS();
  loadTicker();
}

if (searchBtn) {
  searchBtn.onclick = triggerAll;
}
if (globalSearch) {
  globalSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") triggerAll();
  });
}

// Initial load
triggerAll();

// Service worker (ako imaš sw.js)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
