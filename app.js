// =========================================================
// TBW AI PREMIUM - FRONTEND APP.JS (HR/EN, VOICE, WIDGETS)
// =========================================================

const BACKEND_BASE = "https://tbw-backend.vercel.app";

// ========== I18N (HR / EN) ==========

let currentLang = "hr";

const translations = {
  hr: {
    "card.navigation": "Navigacija – TBW NAVI PRO MAX",
    "card.booking": "Smještaj & putovanja",
    "card.streetview": "TBW Street View",
    "card.traffic": "Promet uživo",
    "card.services": "Servisi & trgovine",
    "card.weather": "Vrijeme",
    "card.sea": "More & trajekti",
    "card.transit": "Javni prijevoz",
    "card.airport": "Aerodromi",
    "card.emergency": "Hitne službe",
    "card.rds": "RDS alarm",
    "card.ai": "TBW AI Asistent",

    "btn.navGo": "KRENI",
    "btn.navHud": "HUD način",
    "btn.navExit": "Prekini",
    "btn.navVoice": "Hey TBW – govorni suvozač",
    "btn.bookingSearch": "Pronađi smještaj",
    "btn.aiSend": "Pošalji",

    "label.destination": "Odredište",
    "label.checkin": "Check-in",
    "label.checkout": "Check-out",
    "label.guests": "Gosti",

    "hint.streetview": "Dodirnite za otvaranje prikaza u cijelom ekranu.",

    placeholderSearch: "Traži…",
    placeholderAssistant:
      "Pitaj bilo što: najbolje plaže, skrivene lokacije, stanje na cestama, letovi…",

    voiceBar_search:
      "Slušam vas… recite što tražite (npr. \"Slobodni apartmani Zadar\").",
    voiceBar_nav:
      "Govorni suvozač sluša… recite npr. \"Želim do Zagreba najbržim putem\".",
    voiceBar_ai:
      "AI asistent sluša… postavite pitanje (npr. \"Što posjetiti u Splitu?\").",

    cookieText:
      "Ova aplikacija koristi kolačiće za bolje iskustvo, sigurnost i AI funkcije.",
    cookieAccept: "Prihvati",
    cookieReject: "Odbij",

    backendChecking: "Backend: provjera…",
    backendOnline: "Backend: online",
    backendOffline: "Backend: offline",
    geoUnknown: "Lokacija: nepoznata",
    geoDisabled: "Lokacija: onemogućena",

    tickerLoading: "Učitavam obavijesti…",
    tickerNoAlerts: "Nema aktivnih upozorenja. Sretan put.",
    tickerError: "Obavijesti trenutno nedostupne.",

    weatherLoading: "Učitavam...",
    weatherUnavailable: "Vrijeme nije dostupno.",
    weatherError: "Greška pri dohvaćanju vremena.",

    seaLoading: "Učitavam stanje mora, temperature i trajekte…",
    seaFallback:
      "Stanje mora: mirno • Temp. mora: ~22°C (demo) • UV: umjereno",

    trafficUnavailable: "Promet nije dostupan.",
    servicesLoading: "Učitavam servise, trgovine i benzinske…",
    servicesUnavailable: "Podaci o servisima trenutno nisu dostupni.",

    airportLoading: "Letovi se učitavaju...",
    airportNone: "Nema dostupnih letova.",
    airportError: "Greška pri dohvaćanju letova.",

    emergencyLoading: "Učitavam obližnje hitne službe…",
    emergencyNone:
      "Nema posebnih upozorenja. U hitnim slučajevima zovite 112.",
    emergencyError:
      "Greška pri dohvaćanju hitnih službi. U slučaju nužde zovite 112.",

    transitLoading: "Učitavam linije javnog prijevoza…",
    transitNone: "Nema informacija o javnom prijevozu.",
    transitError: "Greška pri dohvaćanju javnog prijevoza.",

    rdsNone: "Nema aktivnih RDS alarma.",
    rdsError: "Greška pri dohvaćanju RDS alarma.",

    aiError: "Greška AI asistenta."
  },

  en: {
    "card.navigation": "Navigation – TBW NAVI PRO MAX",
    "card.booking": "Accommodation & Trips",
    "card.streetview": "TBW Street View",
    "card.traffic": "Live Traffic",
    "card.services": "Services & Shops",
    "card.weather": "Weather",
    "card.sea": "Sea & Ferries",
    "card.transit": "Public transport",
    "card.airport": "Airports",
    "card.emergency": "Emergency services",
    "card.rds": "RDS alert",
    "card.ai": "TBW AI Assistant",

    "btn.navGo": "GO",
    "btn.navHud": "HUD mode",
    "btn.navExit": "Exit",
    "btn.navVoice": "Hey TBW – voice co-driver",
    "btn.bookingSearch": "Search stays",
    "btn.aiSend": "Send",

    "label.destination": "Destination",
    "label.checkin": "Check-in",
    "label.checkout": "Check-out",
    "label.guests": "Guests",

    "hint.streetview": "Tap to open full-screen Street View.",

    placeholderSearch: "Search…",
    placeholderAssistant:
      "Ask anything: best beaches, hidden spots, road conditions, flights…",

    voiceBar_search:
      "Listening… say what you are looking for (e.g. \"Apartments in Zadar\").",
    voiceBar_nav:
      "Voice co-driver listening… say e.g. \"I want to go to Zagreb by fastest route\".",
    voiceBar_ai:
      "AI assistant listening… ask a question (e.g. \"What to visit in Split?\").",

    cookieText:
      "This app uses cookies for better experience, security and AI features.",
    cookieAccept: "Accept",
    cookieReject: "Reject",

    backendChecking: "Backend: checking…",
    backendOnline: "Backend: online",
    backendOffline: "Backend: offline",
    geoUnknown: "Location: unknown",
    geoDisabled: "Location: disabled",

    tickerLoading: "Loading alerts…",
    tickerNoAlerts: "No active alerts. Have a safe trip.",
    tickerError: "Alerts currently unavailable.",

    weatherLoading: "Loading...",
    weatherUnavailable: "Weather unavailable.",
    weatherError: "Error loading weather.",

    seaLoading: "Loading sea status, temperature and ferries…",
    seaFallback: "Sea: calm • Water temp: ~22°C (demo) • UV: moderate",

    trafficUnavailable: "Traffic info unavailable.",
    servicesLoading: "Loading services, shops and gas stations…",
    servicesUnavailable: "Service info unavailable.",

    airportLoading: "Loading flights...",
    airportNone: "No flights available.",
    airportError: "Error loading flights.",

    emergencyLoading: "Loading nearby emergency services…",
    emergencyNone:
      "No special alerts. In emergency please call the local number (112 / 911).",
    emergencyError:
      "Error loading emergency services. In emergency call local number.",

    transitLoading: "Loading public transport lines…",
    transitNone: "No public transport info.",
    transitError: "Error loading public transport.",

    rdsNone: "No active RDS alerts.",
    rdsError: "Error loading RDS alerts.",

    aiError: "AI error."
  }
};

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("tbw_lang", lang);
  document.documentElement.lang = lang === "hr" ? "hr" : "en";

  const t = translations[lang];

  // data-i18n elementi
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  // placeholderi
  const globalSearch = document.getElementById("globalSearch");
  if (globalSearch) globalSearch.placeholder = t.placeholderSearch;

  const assistantInput = document.getElementById("assistantInput");
  if (assistantInput) assistantInput.placeholder = t.placeholderAssistant;

  // cookie
  const cookieText = document.querySelector(".cookie-text");
  if (cookieText) cookieText.textContent = t.cookieText;
  const cookieAccept = document.getElementById("cookieAccept");
  if (cookieAccept) cookieAccept.textContent = t.cookieAccept;
  const cookieReject = document.getElementById("cookieReject");
  if (cookieReject) cookieReject.textContent = t.cookieReject;

  // status
  const backendStatus = document.getElementById("backendStatus");
  if (backendStatus && backendStatus.classList.contains("offline")) {
    backendStatus.textContent = t.backendChecking;
  }

  const geoStatus = document.getElementById("geoStatus");
  if (geoStatus && geoStatus.textContent.includes("nepoznata")) {
    geoStatus.textContent = t.geoUnknown;
  }

  const tickerEl = document.getElementById("tickerContent");
  if (tickerEl && tickerEl.textContent.includes("Učitavam")) {
    tickerEl.textContent = t.tickerLoading;
  }

  // voice bar text se puni dinamički ovisno o modu
  updateVoiceBarText();
}

function initLanguage() {
  const saved = localStorage.getItem("tbw_lang");
  if (saved === "en" || saved === "hr") {
    setLanguage(saved);
  } else {
    // detektiraj jezik preglednika
    const lang = navigator.language || navigator.userLanguage || "hr";
    if (lang.toLowerCase().startsWith("hr")) {
      setLanguage("hr");
    } else {
      setLanguage("hr"); // default HR onako kako si tražio
    }
  }

  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.onclick = () => {
      const next = currentLang === "hr" ? "en" : "hr";
      setLanguage(next);
      langToggle.textContent = next === "hr" ? "🇭🇷 / 🇬🇧" : "🇬🇧 / 🇭🇷";
      // re-init speech recognition (da promijeni jezik)
      resetSpeechRecognition();
    };
  }
}

// ========== INTRO ==========

const introOverlay = document.getElementById("introOverlay");
const introCanvas = document.getElementById("introCanvas");
const introAudio = document.getElementById("introAudio");
const skipIntroBtn = document.getElementById("skipIntro");

function runIntro() {
  if (!introCanvas) return;
  const ctx = introCanvas.getContext("2d");
  let w, h;
  function resize() {
    w = (introCanvas.width = window.innerWidth);
    h = (introCanvas.height = window.innerHeight);
  }
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * 1.2 + 0.2
  }));

  let comet = { x: -50, y: h * 0.3, vx: 6, vy: 1.2 };
  let start = null;

  function frame(t) {
    if (!start) start = t;
    const dt = t - start;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      s.x -= s.z * 0.6;
      if (s.x < 0) s.x = w;
      ctx.fillStyle = "white";
      ctx.fillRect(s.x, s.y, 1.5 * s.z, 1.5 * s.z);
    }

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

    if (dt < 4800) {
      requestAnimationFrame(frame);
    } else {
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

// ========== COOKIE BANNER & LEGAL ==========

if (!localStorage.getItem("tbw_cookie")) {
  const banner = document.getElementById("cookieBanner");
  if (banner) banner.style.display = "flex";
}

const acceptBtn = document.getElementById("cookieAccept");
const rejectBtn = document.getElementById("cookieReject");
if (acceptBtn) {
  acceptBtn.onclick = () => {
    localStorage.setItem("tbw_cookie", "accepted");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
  };
}
if (rejectBtn) {
  rejectBtn.onclick = () => {
    localStorage.setItem("tbw_cookie", "rejected");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
  };
}

const legalModal = document.getElementById("legalModal");
const openLegal = document.getElementById("openLegal");
const legalClose = document.getElementById("legalClose");

if (openLegal && legalModal && legalClose) {
  openLegal.onclick = (e) => {
    e.preventDefault();
    legalModal.style.display = "block";
  };
  legalClose.onclick = () => {
    legalModal.style.display = "none";
  };
  window.addEventListener("click", (e) => {
    if (e.target === legalModal) legalModal.style.display = "none";
  });
}

// ========== STATUS / BACKEND / GEO ==========

const backendStatus = document.getElementById("backendStatus");
const geoStatus = document.getElementById("geoStatus");

function setBackendState(online) {
  const t = translations[currentLang];
  if (!backendStatus) return;
  if (online) {
    backendStatus.textContent = t.backendOnline;
    backendStatus.classList.remove("offline");
  } else {
    backendStatus.textContent = t.backendOffline;
    backendStatus.classList.add("offline");
  }
}

fetch(`${BACKEND_BASE}/api/health`)
  .then((r) => r.json())
  .then(() => setBackendState(true))
  .catch(() => setBackendState(false));

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (geoStatus) {
        geoStatus.textContent = `Lokacija: ${pos.coords.latitude.toFixed(
          3
        )}, ${pos.coords.longitude.toFixed(3)}`;
        if (currentLang === "en") {
          geoStatus.textContent = `Location: ${pos.coords.latitude.toFixed(
            3
          )}, ${pos.coords.longitude.toFixed(3)}`;
        }
      }
    },
    () => {
      if (geoStatus) {
        geoStatus.textContent =
          currentLang === "en"
            ? translations.en.geoDisabled
            : translations.hr.geoDisabled;
      }
    }
  );
} else {
  if (geoStatus) {
    geoStatus.textContent =
      currentLang === "en"
        ? translations.en.geoUnknown
        : translations.hr.geoUnknown;
  }
}

// ========== TICKER (alerts) ==========

const tickerEl = document.getElementById("tickerContent");
async function loadTicker(city) {
  const t = translations[currentLang];
  try {
    const res = await fetch(
      `${BACKEND_BASE}/api/alerts?city=${encodeURIComponent(
        city || "Croatia"
      )}`
    );
    const data = await res.json();
    const messages = (data.alerts || []).map((a) => a.message);
    if (!messages.length) messages.push(t.tickerNoAlerts);
    if (tickerEl) tickerEl.textContent = messages.join(" • ");
  } catch {
    if (tickerEl) tickerEl.textContent = t.tickerError;
  }
}
loadTicker("Croatia");

// ========== HELPERS ==========

function getCityFromInput() {
  const input = document.getElementById("globalSearch");
  return input && input.value.trim() ? input.value.trim() : "Split";
}

// ========== ANIMATED WEATHER WIDGET ==========

let weatherAnimCtx = null;
let weatherAnimCanvas = null;
let weatherParticles = [];
let weatherAnimType = "clear";
let weatherAnimRunning = false;

function initWeatherCanvas() {
  weatherAnimCanvas = document.getElementById("weatherAnim");
  if (!weatherAnimCanvas) return;
  const rect = weatherAnimCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  weatherAnimCanvas.width = rect.width * dpr;
  weatherAnimCanvas.height = rect.height * dpr;
  weatherAnimCtx = weatherAnimCanvas.getContext("2d");
}

window.addEventListener("resize", () => {
  if (weatherAnimCanvas) initWeatherCanvas();
});

function createWeatherParticles(type) {
  if (!weatherAnimCanvas) return;
  weatherParticles = [];
  const count =
    type === "snow" ? 80 : type === "rain" ? 120 : type === "wind" ? 60 : 40;

  for (let i = 0; i < count; i++) {
    weatherParticles.push({
      x: Math.random() * weatherAnimCanvas.width,
      y: Math.random() * weatherAnimCanvas.height,
      r: type === "snow" ? 1 + Math.random() * 2 : 1,
      vy:
        type === "snow"
          ? 0.3 + Math.random() * 0.7
          : 2 + Math.random() * 2,
      vx: type === "wind" ? 0.8 + Math.random() * 1.2 : 0,
      a: Math.random() * Math.PI * 2
    });
  }
}

function drawWeatherFrame() {
  if (!weatherAnimCtx || !weatherAnimCanvas) return;
  const ctx = weatherAnimCtx;
  const w = weatherAnimCanvas.width;
  const h = weatherAnimCanvas.height;

  ctx.clearRect(0, 0, w, h);

  if (weatherAnimType === "clear") {
    const grd = ctx.createRadialGradient(
      w * 0.75,
      h * 0.2,
      5,
      w * 0.75,
      h * 0.2,
      60
    );
    grd.addColorStop(0, "rgba(255,255,200,0.9)");
    grd.addColorStop(1, "rgba(255,255,200,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.2, 60, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle =
      weatherAnimType === "snow"
        ? "rgba(255,255,255,0.8)"
        : "rgba(160,200,255,0.9)";
    for (let p of weatherParticles) {
      ctx.beginPath();
      if (weatherAnimType === "rain") {
        ctx.fillRect(p.x, p.y, 1, 6);
      } else {
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();

      p.y += p.vy;
      p.x += p.vx || 0;

      if (p.y > h) p.y = -10;
      if (p.x > w + 10) p.x = -10;
    }

    if (weatherAnimType === "storm") {
      if (Math.random() < 0.02) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  if (weatherAnimRunning) {
    requestAnimationFrame(drawWeatherFrame);
  }
}

async function loadWeather() {
  const city = getCityFromInput();
  const t = translations[currentLang];
  try {
    const res = await fetch(
      `${BACKEND_BASE}/api/weather?city=${encodeURIComponent(city)}`
    );
    const data = await res.json();

    const locEl = document.getElementById("weatherLocation");
    const tempEl = document.getElementById("weatherTemp");
    const descEl = document.getElementById("weatherDesc");
    const extraEl = document.getElementById("weatherExtra");

    if (locEl && tempEl && descEl && extraEl) {
      if (data && data.main) {
        const desc = data.weather?.[0]?.description || "";
        const main = data.weather?.[0]?.main?.toLowerCase() || "";
        locEl.textContent = data.name || city;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        descEl.textContent = desc;
        extraEl.textContent = `Osjećaj: ${Math.round(
          data.main.feels_like
        )}°C • Vlaga: ${
          data.main.humidity
        }% • Vjetar: ${data.wind?.speed || "?"} m/s`;

        if (main.includes("snow")) weatherAnimType = "snow";
        else if (main.includes("rain") || main.includes("drizzle"))
          weatherAnimType = "rain";
        else if (main.includes("storm") || main.includes("thunder"))
          weatherAnimType = "storm";
        else if (main.includes("wind")) weatherAnimType = "wind";
        else weatherAnimType = "clear";

        if (!weatherAnimCanvas) initWeatherCanvas();
        if (weatherAnimCanvas) {
          createWeatherParticles(weatherAnimType);
          if (!weatherAnimRunning) {
            weatherAnimRunning = true;
            drawWeatherFrame();
          }
        }
      } else {
        locEl.textContent = t.weatherUnavailable;
      }
    }
  } catch {
    const locEl = document.getElementById("weatherLocation");
    if (locEl) locEl.textContent = t.weatherError;
  }
}

// ========== SEA / FERRIES ==========

async function loadSea() {
  const city = getCityFromInput();
  const seaBox = document.getElementById("seaBox");
  const t = translations[currentLang];
  if (!seaBox) return;
  seaBox.textContent = t.seaLoading;
  try {
    const res = await fetch(
      `${BACKEND_BASE}/api/sea?city=${encodeURIComponent(city)}`
    );
    const data = await res.json();
    if (data && (data.status || data.temp || data.uv)) {
      seaBox.textContent = `More: ${data.status || "?"} • Temp: ${
        data.temp || "?"
      }°C • UV: ${data.uv || "?"}`;
    } else {
      seaBox.textContent = t.seaFallback;
    }
  } catch {
    seaBox.textContent = t.seaFallback;
  }
}

// ========== TRAFFIC + SERVICES ==========

async function loadTrafficAndServices() {
  const city = getCityFromInput();
  const t = translations[currentLang];

  try {
    const trafRes = await fetch(
      `${BACKEND_BASE}/api/traffic?city=${encodeURIComponent(city)}`
    );
    const trafData = await trafRes.json();
    const trafInfo = document.getElementById("trafficInfo");
    if (trafInfo) {
      trafInfo.textContent =
        trafData.description || trafData.status || "Promet ažuriran.";
      if (currentLang === "en" && trafData.description_en) {
        trafInfo.textContent = trafData.description_en;
      }
    }
  } catch {
    const trafInfo = document.getElementById("trafficInfo");
    if (trafInfo) trafInfo.textContent = t.trafficUnavailable;
  }

  try {
    const shopRes = await fetch(
      `${BACKEND_BASE}/api/shops?city=${encodeURIComponent(city)}`
    );
    const shopData = await shopRes.json();
    const box = document.getElementById("servicesBox");
    if (box) {
      box.innerHTML = "";
      (shopData.items || []).forEach((s) => {
        const div = document.createElement("div");
        div.innerHTML = `🛒 ${s.name} – ${
          s.status || "otvoreno"
        } • zatvara: ${s.closes || "?"}`;
        box.appendChild(div);
      });
      if (!box.innerHTML) box.textContent = t.servicesUnavailable;
    }
  } catch {
    const box = document.getElementById("servicesBox");
    if (box) box.textContent = t.servicesUnavailable;
  }
}

// ========== AIRPORT ==========

async function loadAirport() {
  const t = translations[currentLang];
  try {
    const res = await fetch(`${BACKEND_BASE}/api/airport`);
    const data = await res.json();
    const mainEl = document.getElementById("airportMain");
    const subEl = document.getElementById("airportSub");
    if (!mainEl || !subEl) return;

    const flight = (data.flights && data.flights[0]) || null;
    if (!flight) {
      mainEl.textContent = t.airportNone;
      subEl.textContent = "";
      return;
    }

    mainEl.textContent = `${flight.flight_no || "??"} • ${
      flight.from
    } → ${flight.to}`;
    subEl.textContent = `Dolazak: ${
      flight.arrival || flight.time || "?"
    } • Gate: ${flight.gate || "?"} • Status: ${flight.status || "nepoznat"}`;
  } catch (e) {
    const mainEl = document.getElementById("airportMain");
    const subEl = document.getElementById("airportSub");
    if (mainEl) mainEl.textContent = t.airportError;
    if (subEl) subEl.textContent = "";
  }
}

// ========== EMERGENCY ==========

async function loadEmergency() {
  const t = translations[currentLang];
  try {
    const res = await fetch(`${BACKEND_BASE}/api/emergency`);
    const data = await res.json();
    const box = document.getElementById("emergencyInfo");
    if (!box) return;

    const items = data.items || data.services || [];
    if (!items.length) {
      box.textContent = t.emergencyNone;
      return;
    }

    box.innerHTML = items
      .slice(0, 3)
      .map((s) => {
        return `<div>${s.type || "Služba"}: ${s.name || ""} – ${
          s.phone || ""
        }, ~${s.distance || "?"} km</div>`;
      })
      .join("");
  } catch {
    const box = document.getElementById("emergencyInfo");
    if (box) box.textContent = t.emergencyError;
  }
}

// ========== TRANSIT ==========

async function loadTransit() {
  const t = translations[currentLang];
  try {
    const res = await fetch(`${BACKEND_BASE}/api/transit`);
    const data = await res.json();
    const box = document.getElementById("transitInfo");
    if (!box) return;

    const buses = data.buses || [];
    const trams = data.trams || [];
    const trains = data.trains || [];

    let lines = [];
    if (buses.length)
      lines.push(`🚌 Bus ${buses[0].line} → ${buses[0].to}, ${
        buses[0].next || "?"
      }`);
    if (trams.length)
      lines.push(`🚋 Tram ${trams[0].line} → ${trams[0].to}, ${
        trams[0].next || "?"
      }`);
    if (trains.length)
      lines.push(`🚆 Vlak ${trains[0].line} → ${trains[0].to}, ${
        trains[0].next || "?"
      }`);

    if (!lines.length) {
      box.textContent = t.transitNone;
    } else {
      box.innerHTML = lines.join("<br>");
    }
  } catch {
    const box = document.getElementById("transitInfo");
    if (box) box.textContent = t.transitError;
  }
}

// ========== RDS ALARM ==========

async function loadRDS() {
  const t = translations[currentLang];
  try {
    const res = await fetch(`${BACKEND_BASE}/api/rds`);
    const data = await res.json();
    const wrap = document.getElementById("rdsWidget");
    const statusEl = document.getElementById("rdsStatus");
    const detailEl = document.getElementById("rdsDetail");
    if (!wrap || !statusEl || !detailEl) return;

    const alerts = data.alerts || [];
    if (!alerts.length) {
      wrap.classList.remove("rds-alert");
      wrap.classList.add("rds-normal");
      statusEl.textContent = t.rdsNone;
      detailEl.textContent = "";
    } else {
      const a = alerts[0];
      wrap.classList.remove("rds-normal");
      wrap.classList.add("rds-alert");
      statusEl.textContent = `ALARM: ${
        a.type || a.title || (currentLang === "en" ? "Alert" : "Upozorenje")
      }`;
      detailEl.textContent = a.message || a.description || "";
    }
  } catch {
    const wrap = document.getElementById("rdsWidget");
    const statusEl = document.getElementById("rdsStatus");
    if (wrap && statusEl) {
      wrap.classList.add("rds-alert");
      statusEl.textContent = t.rdsError;
    }
  }
}

// ========== BOOKING (partner redirect) ==========

const bookBtn = document.getElementById("bookBtn");
if (bookBtn) {
  bookBtn.onclick = () => {
    const city =
      document.getElementById("hotelCity").value || getCityFromInput();
    const guests = document.getElementById("guests").value || 2;
    const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
      city
    )}&group_adults=${encodeURIComponent(guests)}`;
    window.open(url, "_blank");
  };
}

// ========== NAVIGATION ==========

const navGoBtn = document.getElementById("navGo");
const navHudBtn = document.getElementById("navHud");
const navExitBtn = document.getElementById("navExit");
const navVoiceBtn = document.getElementById("navVoice");
const navStatus = document.getElementById("navStatus");

if (navGoBtn) {
  navGoBtn.onclick = async () => {
    const to = document.getElementById("routeTo").value;
    if (!to) {
      alert(
        currentLang === "en"
          ? "Please enter destination."
          : "Molim unesite odredište."
      );
      return;
    }
    navStatus.textContent =
      currentLang === "en" ? "Calculating route…" : "Izračunavam rutu…";
    try {
      // demo – kasnije možeš spojiti na pravi routing backend
      const r = await TBWNavi.traffic();
      navStatus.textContent =
        (currentLang === "en" ? "Route loaded. Traffic: " : "Ruta učitana. Promet: ") +
        (r.traffic_status || r.status || "ok") +
        ".";
      if (r.delay_min) {
        navStatus.textContent +=
          currentLang === "en"
            ? ` Delay: ~${r.delay_min} min.`
            : ` Kašnjenje: ~${r.delay_min} min.`;
      }
    } catch {
      navStatus.textContent =
        currentLang === "en"
          ? "Navigation error."
          : "Greška u navigaciji.";
    }
  };
}

if (navHudBtn) {
  navHudBtn.onclick = async () => {
    try {
      const cfg = await TBWNavi.hud();
      alert(
        (currentLang === "en" ? "HUD mode: " : "HUD način: ") +
          (cfg.mode || cfg.hudMode || "auto")
      );
    } catch {
      alert(
        currentLang === "en"
          ? "HUD config error."
          : "Greška HUD postavki."
      );
    }
  };
}

if (navExitBtn) {
  navExitBtn.onclick = () => {
    navStatus.textContent =
      currentLang === "en"
        ? "Navigation stopped."
        : "Navigacija zaustavljena.";
  };
}

// ========== AI CHAT / MESSAGES / TTS ==========

const msgBox = document.getElementById("messages");
const aiInput = document.getElementById("assistantInput");
const aiSend = document.getElementById("sendBtn");
const aiVoice = document.getElementById("assistantVoice");

function addMsg(text, who = "assistant") {
  if (!msgBox) return;
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

// Text-to-speech
function tts(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = currentLang === "en" ? "en-US" : "hr-HR";
  speechSynthesis.speak(utter);
}

// AI assistant (demo preko /api/describe)
async function sendToAI(question) {
  if (!question.trim()) return;
  addMsg(question, "user");
  aiInput.value = "";
  try {
    const res = await fetch(
      `${BACKEND_BASE}/api/describe?name=${encodeURIComponent(question)}`
    );
    const data = await res.json();
    const txt = data.speech || data.text || "Nemam detalje trenutno.";
    addMsg(txt, "assistant");
    tts(txt);
  } catch {
    addMsg(translations[currentLang].aiError, "assistant");
  }
}

if (aiSend && aiInput) {
  aiSend.onclick = () => sendToAI(aiInput.value);
  aiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendToAI(aiInput.value);
  });
}

// ========== GLOBAL SEARCH + VOICE (MIC) ==========

const searchInput = document.getElementById("globalSearch");
const micBtn = document.getElementById("micBtn");
const voiceBar = document.getElementById("voiceBar");
const searchBtn = document.getElementById("searchBtn");

function updateSearchState() {
  if (!searchInput) return;
  if (searchInput.value.trim() === "") {
    searchInput.classList.remove("typing");
  } else {
    searchInput.classList.add("typing");
  }
}

if (searchInput) {
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() !== "") {
      searchInput.classList.add("typing");
    }
  });
  searchInput.addEventListener("input", updateSearchState);
  searchInput.addEventListener("blur", updateSearchState);
  updateSearchState();
}

// ========== SPEECH RECOGNITION - GLOBAL ==========

let recognition = null;
let listening = false;
let currentVoiceMode = null; // "search" | "nav" | "ai"

function resetSpeechRecognition() {
  if (recognition) {
    try {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.stop();
    } catch {}
  }

  if (
    "webkitSpeechRecognition" in window ||
    "SpeechRecognition" in window
  ) {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = currentLang === "en" ? "en-US" : "hr-HR";
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handleVoiceResult(text);
    };

    recognition.onend = () => {
      listening = false;
      if (micBtn) {
        micBtn.classList.remove("mic-active");
        micBtn.classList.add("mic-idle");
      }
      if (voiceBar) voiceBar.classList.add("hidden");
      currentVoiceMode = null;
    };
  } else {
    recognition = null;
  }
}

function updateVoiceBarText() {
  if (!voiceBar) return;
  const t = translations[currentLang];
  if (!currentVoiceMode || voiceBar.classList.contains("hidden")) return;
  if (currentVoiceMode === "search") voiceBar.textContent = t.voiceBar_search;
  else if (currentVoiceMode === "nav") voiceBar.textContent = t.voiceBar_nav;
  else if (currentVoiceMode === "ai") voiceBar.textContent = t.voiceBar_ai;
}

function startListening(mode) {
  if (!recognition) {
    alert(
      currentLang === "en"
        ? "Voice recognition not supported on this device."
        : "Glasovno prepoznavanje nije podržano na ovom uređaju."
    );
    return;
  }
  currentVoiceMode = mode;
  listening = true;

  if (micBtn) {
    micBtn.classList.remove("mic-idle");
    micBtn.classList.add("mic-active");
  }
  if (voiceBar) {
    voiceBar.classList.remove("hidden");
    updateVoiceBarText();
  }
  recognition.lang = currentLang === "en" ? "en-US" : "hr-HR";
  recognition.start();
}

function handleVoiceResult(text) {
  if (!currentVoiceMode) return;
  if (currentVoiceMode === "search") {
    if (searchInput) {
      searchInput.value = text;
      updateSearchState();
    }
  } else if (currentVoiceMode === "ai") {
    if (aiInput) {
      aiInput.value = text;
      sendToAI(text);
    }
  } else if (currentVoiceMode === "nav") {
    // glasovni suvozač – možemo iskoristiti TBWNavi.askAI
    if (navStatus) {
      navStatus.textContent =
        (currentLang === "en" ? "You said: " : "Rekli ste: ") + text;
    }
    if (window.TBWNavi && TBWNavi.askAI) {
      TBWNavi.askAI(text).then((res) => {
        const reply =
          res.reply ||
          (currentLang === "en"
            ? "Checking traffic and route…"
            : "Provjeravam promet i rutu…");
        if (navStatus) navStatus.textContent = reply;
        tts(reply);
      });
    }
  }
}

// mic gumb za globalno pretraživanje
if (micBtn) {
  micBtn.onclick = () => {
    if (!listening) {
      startListening("search");
    } else {
      // ručno zaustavljanje
      if (recognition) recognition.stop();
    }
  };
}

// aiVoice – voice to AI
if (aiVoice) {
  aiVoice.onclick = () => {
    startListening("ai");
  };
}

// navVoice – voice co-driver
if (navVoiceBtn) {
  navVoiceBtn.onclick = () => {
    startListening("nav");
  };
}

// ========== GLOBAL SEARCH BUTTON ==========

if (searchBtn) {
  searchBtn.onclick = () => {
    loadWeather();
    loadSea();
    loadTrafficAndServices();
    loadAirport();
    loadEmergency();
    loadTransit();
    loadRDS();
    loadTicker(getCityFromInput());
  };
}

// ========== INITIAL LOAD ==========

// prvo inicijaliziraj jezik i speech
initLanguage();
resetSpeechRecognition();
initWeatherCanvas();

loadWeather();
loadSea();
loadTrafficAndServices();
loadAirport();
loadEmergency();
loadTransit();
loadRDS();

// ========== SERVICE WORKER ==========

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
