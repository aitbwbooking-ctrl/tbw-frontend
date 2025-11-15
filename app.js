// ===============================
// TBW AI PREMIUM – FRONTEND
// Single-API backend: /api/tbw?route=...
// ===============================

const BACKEND_BASE = "https://tbw-backend.vercel.app";

// ---------- GLOBAL STATE ----------
let currentLang = "hr";          // "hr" or "en"
let recognition = null;
let recognizing = false;

// For fullscreen image zoom/drag
let currentScale = 1;
let currentTranslate = { x: 0, y: 0 };
let lastTouchDist = null;
let lastPos = null;

// ---------- DOM SHORTCUT ----------
function $(id) { return document.getElementById(id); }

// ---------- API HELPER ----------
async function callTBW(route, extraQuery = "") {
  const url = `${BACKEND_BASE}/api/tbw?route=${encodeURIComponent(route)}${extraQuery ? "&" + extraQuery : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TBW API error " + res.status);
  return res.json();
}

// ===============================
// INTRO ANIMACIJA (komet + zvijezde)
// ===============================

(function setupIntro() {
  const introOverlay = $("introOverlay");
  const introCanvas = $("introCanvas");
  const introAudio = $("introAudio");
  const skipIntroBtn = $("skipIntro");

  if (!introOverlay || !introCanvas) return;

  // prikaz samo prvi put
  const seen = localStorage.getItem("tbw_intro_seen");
  if (seen) {
    introOverlay.style.display = "none";
    return;
  }
  localStorage.setItem("tbw_intro_seen", "1");

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
    z: Math.random() * 1.2 + 0.2,
  }));

  let comet = { x: -50, y: h * 0.3, vx: 6, vy: 1.2 };
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
    const grad = ctx.createLinearGradient(comet.x, comet.y, comet.x - 90, comet.y - 30);
    grad.addColorStop(0, "rgba(255,255,255,0.7)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(comet.x - 2, comet.y);
    ctx.lineTo(comet.x - 90, comet.y - 30);
    ctx.stroke();

    if (dt < 4800) {
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

  if (skipIntroBtn) {
    skipIntroBtn.onclick = () => {
      introOverlay.style.display = "none";
      if (introAudio) introAudio.pause();
    };
  }
})();

// ===============================
// JEZIK (HR / EN)
// ===============================

const langTexts = {
  hr: {
    searchPlaceholder: "Pretraži (Split, apartmani...)",
    searchBtn: "Traži",
    navTitle: "Navigacija",
    resTitle: "Rezervacija smještaja",
    streetTitle: "Street View",
    weatherTitle: "Vrijeme",
    trafficTitle: "Promet uživo",
    seaTitle: "Stanje mora & trajekti",
    servicesTitle: "Servisi",
    transitTitle: "Javni prijevoz",
    airportTitle: "Aerodromi & RDS alarmi"
  },
  en: {
    searchPlaceholder: "Search (Split, apartments...)",
    searchBtn: "Search",
    navTitle: "Navigation",
    resTitle: "Accommodation booking",
    streetTitle: "Street View",
    weatherTitle: "Weather",
    trafficTitle: "Live traffic",
    seaTitle: "Sea & ferries",
    servicesTitle: "Services",
    transitTitle: "Public transport",
    airportTitle: "Airports & RDS alerts"
  }
};

function applyLanguage(lang) {
  currentLang = lang === "en" ? "en" : "hr";

  const t = langTexts[currentLang];

  const gSearch = $("globalSearch");
  const sBtn = $("searchBtn");
  if (gSearch) gSearch.placeholder = t.searchPlaceholder;
  if (sBtn) sBtn.textContent = t.searchBtn;

  const navBox = $("navBox");
  const bookingBox = $("bookingBox");
  const streetBox = $("streetBox");
  const weatherBox = $("weatherBox");
  const trafficBox = $("trafficBox");
  const seaBox = $("seaBox");
  const servicesBox = $("servicesBox");
  const transitBox = $("transitBox");
  const airportBox = $("airportBox");

  if (navBox) navBox.querySelector("h3").textContent = t.navTitle;
  if (bookingBox) bookingBox.querySelector("h3").textContent = t.resTitle;
  if (streetBox) streetBox.querySelector("h3").textContent = t.streetTitle;
  if (weatherBox) weatherBox.querySelector("h3").textContent = t.weatherTitle;
  if (trafficBox) trafficBox.querySelector("h3").textContent = t.trafficTitle;
  if (seaBox) seaBox.querySelector("h3").textContent = t.seaTitle;
  if (servicesBox) servicesBox.querySelector("h3").textContent = t.servicesTitle;
  if (transitBox) transitBox.querySelector("h3").textContent = t.transitTitle;
  if (airportBox) airportBox.querySelector("h3").textContent = t.airportTitle;

  // Speech recognition language
  if (recognition) {
    recognition.lang = currentLang === "hr" ? "hr-HR" : "en-US";
  }
}

// ===============================
// SPEECH RECOGNITION
// ===============================

function setupSpeechRecognition() {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    console.warn("Speech recognition not supported");
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = currentLang === "hr" ? "hr-HR" : "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => { recognizing = true; };
  recognition.onend = () => { recognizing = false; };
}

function startMicFor(inputElement) {
  if (!recognition) {
    alert("Ovaj preglednik ne podržava govor.");
    return;
  }
  if (recognizing) {
    // već sluša – reset
    recognition.stop();
    return;
  }
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (inputElement) {
      inputElement.value = transcript;
      if (inputElement.id === "globalSearch") {
        // automatski trigger pretrage
        doSearch();
      }
    }
  };
  recognition.start();
}

// ===============================
// FULLSCREEN MODAL ZA STREET VIEW
// ===============================

const fullscreenModal = $("fullscreenModal");
const closeModalBtn = $("closeModal");
const modalContent = $("modalContent");

function openStreetModal() {
  if (!fullscreenModal || !modalContent) return;

  modalContent.innerHTML = "";

  const img = document.createElement("img");
  const previewImg = $("streetImg");
  img.src = previewImg && previewImg.src ? previewImg.src : "/assets/street/default.jpg";
  img.id = "streetFullImg";
  img.className = "streetFullImg";

  // kontrole
  const controls = document.createElement("div");
  controls.className = "modalControls";

  const zoomInBtn = document.createElement("button");
  zoomInBtn.textContent = "+";
  const zoomOutBtn = document.createElement("button");
  zoomOutBtn.textContent = "−";
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "⟳";

  controls.appendChild(zoomInBtn);
  controls.appendChild(zoomOutBtn);
  controls.appendChild(refreshBtn);

  modalContent.appendChild(img);
  modalContent.appendChild(controls);

  fullscreenModal.style.display = "flex";

  // reset transform
  currentScale = 1;
  currentTranslate = { x: 0, y: 0 };
  applyTransform(img);

  // Zoom tipke
  zoomInBtn.onclick = () => {
    currentScale = Math.min(currentScale + 0.2, 4);
    applyTransform(img);
  };
  zoomOutBtn.onclick = () => {
    currentScale = Math.max(currentScale - 0.2, 0.5);
    applyTransform(img);
  };
  refreshBtn.onclick = () => {
    loadStreetImage(true);
  };

  // Drag (mouse)
  img.addEventListener("mousedown", (e) => {
    e.preventDefault();
    lastPos = { x: e.clientX, y: e.clientY };
    const move = (ev) => {
      if (!lastPos) return;
      const dx = ev.clientX - lastPos.x;
      const dy = ev.clientY - lastPos.y;
      lastPos = { x: ev.clientX, y: ev.clientY };
      currentTranslate.x += dx;
      currentTranslate.y += dy;
      applyTransform(img);
    };
    const up = () => {
      lastPos = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  });

  // Pinch (touch)
  img.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      lastTouchDist = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  img.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist !== null) {
      const newDist = getTouchDist(e.touches);
      const delta = newDist - lastTouchDist;
      lastTouchDist = newDist;
      currentScale += delta * 0.003;
      currentScale = Math.min(Math.max(currentScale, 0.5), 4);
      applyTransform(img);
    } else if (e.touches.length === 1 && lastPos) {
      const dx = e.touches[0].clientX - lastPos.x;
      const dy = e.touches[0].clientY - lastPos.y;
      lastPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      currentTranslate.x += dx;
      currentTranslate.y += dy;
      applyTransform(img);
    }
  });

  img.addEventListener("touchend", () => {
    if (event.touches.length < 2) lastTouchDist = null;
    if (event.touches.length === 0) lastPos = null;
  });
}

function applyTransform(img) {
  img.style.transform = `translate(${currentTranslate.x}px, ${currentTranslate.y}px) scale(${currentScale})`;
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

if (closeModalBtn && fullscreenModal) {
  closeModalBtn.onclick = () => {
    fullscreenModal.style.display = "none";
  };
}

// ===============================
// UČITAVANJE PODATAKA ZA KARTICE
// ===============================

async function loadAlerts() {
  const ticker = $("tickerContent");
  if (!ticker) return;
  try {
    const data = await callTBW("alerts");
    if (data.alerts && data.alerts.length) {
      ticker.textContent = data.alerts.map(a => a.message).join(" • ");
    } else if (data.message) {
      ticker.textContent = data.message;
    } else {
      ticker.textContent = "Nema posebnih upozorenja. Sretan put!";
    }
  } catch (e) {
    ticker.textContent = "Upozorenja nisu dostupna.";
  }
}

async function loadWeather() {
  const box = $("weatherContent");
  if (!box) return;
  try {
    const data = await callTBW("weather");
    const city = data.city || "Split";
    const temp = data.temperature != null ? data.temperature : "?";
    const cond = data.condition || "";
    box.textContent = `${city}: ${temp}°C, ${cond}`;
  } catch {
    box.textContent = "Vrijeme trenutno nije dostupno.";
  }
}

async function loadTraffic() {
  const box = $("trafficContent");
  if (!box) return;
  try {
    const data = await callTBW("traffic");
    if (data.traffic_status) {
      box.textContent = `Status: ${data.traffic_status}, kašnjenje: ${data.delay_min || "?"} min`;
    } else if (data.description) {
      box.textContent = data.description;
    } else {
      box.textContent = "Promet podaci nisu dostupni.";
    }
  } catch {
    box.textContent = "Promet podaci nisu dostupni.";
  }
}

async function loadSea() {
  const box = $("seaContent");
  if (!box) return;
  try {
    const data = await callTBW("sea");
    if (data.text) {
      box.textContent = data.text;
    } else {
      const temp = data.temperature != null ? data.temperature : 13;
      box.textContent = `More oko ${temp}°C, UV umjeren.`;
    }
  } catch {
    box.textContent = "Stanje mora trenutno nije dostupno.";
  }
}

async function loadServices() {
  const box = $("servicesContent");
  if (!box) return;
  try {
    const data = await callTBW("services");
    if (Array.isArray(data.items) && data.items.length) {
      box.innerHTML = "";
      data.items.forEach(s => {
        const div = document.createElement("div");
        div.textContent = `${s.name} – ${s.status || ""}`;
        box.appendChild(div);
      });
    } else {
      box.textContent = "Nema servisa za prikaz.";
    }
  } catch {
    box.textContent = "Servisi trenutno nisu dostupni.";
  }
}

async function loadTransit() {
  const box = $("transitContent");
  if (!box) return;
  try {
    const data = await callTBW("transit");
    const parts = [];
    if (data.buses && data.buses.length) {
      const b = data.buses[0];
      parts.push(`Bus ${b.line}: ${b.from} → ${b.to} (${b.next})`);
    }
    if (data.trains && data.trains.length) {
      const t = data.trains[0];
      parts.push(`Vlak ${t.line}: ${t.from} → ${t.to} (${t.next})`);
    }
    if (parts.length) box.textContent = parts.join(" • ");
    else box.textContent = "Nema podataka o javnom prijevozu.";
  } catch {
    box.textContent = "Javni prijevoz trenutno nije dostupan.";
  }
}

async function loadAirportRds() {
  const box = $("airportContent");
  if (!box) return;
  try {
    const data = await callTBW("airport");
    const parts = [];
    if (data.flights && data.flights.length) {
      const f = data.flights[0];
      parts.push(`${f.flight_no || ""} ${f.from} → ${f.to} ETA ${f.eta || f.arrival || ""} (${f.status || ""})`);
    }
    if (data.rds && data.rds.length) {
      parts.push(`RDS: ${data.rds[0].message}`);
    }
    box.textContent = parts.length ? parts.join(" • ") : "Nema aerodromskih upozorenja.";
  } catch {
    box.textContent = "Aerodrom i RDS podaci nisu dostupni.";
  }
}

async function loadStreetImage(force = false) {
  const img = $("streetImg");
  if (!img) return;
  if (!force && img.dataset.loaded === "1") return;

  try {
    const data = await callTBW("street");
    if (data.imageUrl) {
      img.src = data.imageUrl;
      img.dataset.loaded = "1";
    }
  } catch {
    // zadržavamo default.jpg
  }
}

// ===============================
// GLOBAL SEARCH & NAVIGACIJA
// ===============================

function doSearch() {
  const input = $("globalSearch");
  if (!input) return;
  const term = input.value.trim() || "Split";

  // ovdje možeš kasnije dodati pravu AI pretragu, za sada samo:
  // – osvježi vrijeme, promet, more itd. za taj grad
  loadWeather();
  loadTraffic();
  loadSea();
  loadServices();
  loadTransit();
  loadAirportRds();
  loadStreetImage(true);
}

function setupNavigationCard() {
  const navBox = $("navBox");
  const navStatus = $("navStatus");
  if (!navBox || !navStatus) return;

  navBox.addEventListener("click", async () => {
    navStatus.textContent = "Računam rutu...";
    try {
      const data = await callTBW("traffic");
      const delay = data.delay_min != null ? data.delay_min : "?";
      navStatus.textContent = `Ruta aktivna. Kašnjenje oko ${delay} min.`;
    } catch {
      navStatus.textContent = "Greška pri dohvaćanju rute.";
    }
  });
}

// ===============================
// BOOKING CARD
// ===============================

function setupBookingCard() {
  const bookingBox = $("bookingBox");
  const bookingInfo = $("bookingInfo");
  if (!bookingBox || !bookingInfo) return;

  bookingBox.addEventListener("click", () => {
    const search = $("globalSearch");
    const city = (search && search.value.trim()) || "Split";
    const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`;
    window.open(url, "_blank");
  });
}

// ===============================
// STREET VIEW CARD
// ===============================

function setupStreetCard() {
  const streetBox = $("streetBox");
  if (!streetBox) return;

  streetBox.addEventListener("click", () => {
    openStreetModal();
  });
}

// ===============================
// EVENT BINDING & INIT
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // jezik
  applyLanguage("hr");

  const langHR = $("langHR");
  const langEN = $("langEN");
  if (langHR) langHR.onclick = () => applyLanguage("hr");
  if (langEN) langEN.onclick = () => applyLanguage("en");

  // speech
  setupSpeechRecognition();

  const micBtn = $("micBtn");
  const micVoice = $("voiceSearch");
  const globalSearch = $("globalSearch");

  if (micBtn && globalSearch) {
    micBtn.onclick = () => startMicFor(globalSearch);
  }
  if (micVoice && globalSearch) {
    micVoice.onclick = () => startMicFor(globalSearch);
  }

  const searchBtn = $("searchBtn");
  if (searchBtn) searchBtn.onclick = doSearch;
  if (globalSearch) {
    globalSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
    });
  }

  // kartice
  setupNavigationCard();
  setupBookingCard();
  setupStreetCard();

  // inicijalno učitavanje
  loadAlerts();
  loadWeather();
  loadTraffic();
  loadSea();
  loadServices();
  loadTransit();
  loadAirportRds();
  loadStreetImage(false);
});
