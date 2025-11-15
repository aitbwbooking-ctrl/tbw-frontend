// ===============================
// TBW AI PREMIUM – FRONTEND
// Radi s backendom /api/tbw
// ===============================

const BACKEND_BASE = "https://tbw-backend.vercel.app/api/tbw";

// ====== POMOĆNA FUNKCIJA ZA API POZIVE ======
async function api(route, params = {}) {
  const qs = new URLSearchParams({ route, ...params }).toString();
  const res = await fetch(`${BACKEND_BASE}?${qs}`);
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

// ===============================
// INTRO – KOMET + ZVIJEZDE
// ===============================
const introOverlay = document.getElementById("introOverlay");
const introCanvas = document.getElementById("introCanvas");
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

    if (dt < 4600) {
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
    };
  }
}

// ===============================
// COOKIE BANNER
// ===============================
const cookieBanner = document.getElementById("cookieBanner");
const cookieAccept = document.getElementById("cookieAccept");
const cookieReject = document.getElementById("cookieReject");

if (!localStorage.getItem("tbw_cookie")) {
  cookieBanner.style.display = "block";
}

if (cookieAccept) {
  cookieAccept.onclick = () => {
    localStorage.setItem("tbw_cookie", "accepted");
    cookieBanner.style.display = "none";
  };
}
if (cookieReject) {
  cookieReject.onclick = () => {
    localStorage.setItem("tbw_cookie", "rejected");
    cookieBanner.style.display = "none";
  };
}

// ===============================
// JEZIK (HR / EN) – utječe na TTS i STT
// ===============================
let currentLang = localStorage.getItem("tbw_lang") || "hr";
const langToggle = document.getElementById("langToggle");

function getSpeechLang() {
  return currentLang === "hr" ? "hr-HR" : "en-US";
}

if (langToggle) {
  langToggle.onclick = () => {
    currentLang = currentLang === "hr" ? "en" : "hr";
    localStorage.setItem("tbw_lang", currentLang);
    langToggle.textContent = currentLang === "hr" ? "HR 🔁 EN" : "EN 🔁 HR";
  };
  langToggle.textContent = currentLang === "hr" ? "HR 🔁 EN" : "EN 🔁 HR";
}

// ===============================
// STATUS BACKENDA + GEOLOKACIJA
// ===============================
const backendStatus = document.getElementById("backendStatus");
const geoStatus = document.getElementById("geoStatus");

api("health")
  .then(() => {
    backendStatus.textContent = "Backend: online";
    backendStatus.classList.remove("offline");
  })
  .catch(() => {
    backendStatus.textContent = "Backend: offline";
    backendStatus.classList.add("offline");
  });

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoStatus.textContent = `Lokacija: ${pos.coords.latitude.toFixed(
        3
      )}, ${pos.coords.longitude.toFixed(3)}`;
    },
    () => {
      geoStatus.textContent = "Lokacija: onemogućena";
    }
  );
}

// ===============================
// TICKER ALERTS
// ===============================
const tickerContent = document.getElementById("tickerContent");

async function loadTicker() {
  try {
    const data = await api("alerts");
    const msgs = (data.alerts || []).map((a) => a.message);
    tickerContent.textContent =
      msgs.length > 0 ? msgs.join(" • ") : "Nema aktivnih upozorenja. Sretan put!";
  } catch {
    tickerContent.textContent = "Upozorenja trenutno nisu dostupna.";
  }
}
loadTicker();

// ===============================
// HELPER – CITY FROM INPUT
// ===============================
const globalSearch = document.getElementById("globalSearch");
function getCity() {
  return globalSearch.value.trim() || "Split";
}

// ===============================
// WEATHER + SEA (front-end sea)
// ===============================
const weatherTemp = document.getElementById("weatherTemp");
const weatherDesc = document.getElementById("weatherDesc");
const seaTemp = document.getElementById("seaTemp");
const seaDesc = document.getElementById("seaDesc");

async function loadWeather() {
  const city = getCity();
  try {
    const data = await api("weather", { city });
    weatherTemp.textContent = `${Math.round(data.temp)}°C`;
    weatherDesc.textContent = `${data.city || city} • ${data.condition}`;

    // sea (simple approx)
    const seaT = Math.max(8, Math.round(data.temp - 2));
    seaTemp.textContent = `${seaT}°C`;
    seaDesc.textContent = `More oko ${city}. UV umjeren.`;    
    drawWeatherCanvas(data.condition);
  } catch {
    weatherTemp.textContent = "--°C";
    weatherDesc.textContent = "Greška pri dohvaćanju vremena.";
  }
}

function drawWeatherCanvas(condition) {
  const canvas = document.getElementById("weatherCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = (canvas.width = canvas.clientWidth);
  const h = (canvas.height = canvas.clientHeight);

  ctx.fillStyle = "#000814";
  ctx.fillRect(0, 0, w, h);

  if ((condition || "").toLowerCase().includes("rain")) {
    ctx.strokeStyle = "#00e5ff";
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y + 8);
      ctx.stroke();
    }
  } else if ((condition || "").toLowerCase().includes("snow")) {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 35; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#004a88");
    grad.addColorStop(1, "#00c8ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffe082";
    ctx.beginPath();
    ctx.arc(w - 20, 20, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===============================
// TRAFFIC
// ===============================
const trafficStatusEl = document.getElementById("trafficStatus");
const trafficDescEl = document.getElementById("trafficDesc");

async function loadTraffic() {
  const city = getCity();
  try {
    const data = await api("traffic", { city });
    trafficStatusEl.textContent =
      data.traffic_status === "open" ? "Normalno" : "Zatvorena dionica";
    trafficDescEl.textContent = `Brzina: ${data.speed} / slobodno ${data.free_speed} km/h`;
  } catch {
    trafficStatusEl.textContent = "N/A";
    trafficDescEl.textContent = "Promet nije dostupan.";
  }
}

// ===============================
// SHOPS / SERVICES
// ===============================
const servicesList = document.getElementById("servicesList");
async function loadServices() {
  const city = getCity();
  try {
    const data = await api("shops", { city });
    if (!data.items || !data.items.length) {
      servicesList.textContent = "Nema podataka o servisima.";
      return;
    }
    servicesList.innerHTML = data.items
      .map(
        (s) =>
          `• ${s.name} – ${s.status || "otvoreno"} (zatvara u ${s.closes || "?"})`
      )
      .join("<br>");
  } catch {
    servicesList.textContent = "Nije moguće dohvatiti servise.";
  }
}

// ===============================
// TRANSIT
// ===============================
const transitInfo = document.getElementById("transitInfo");
async function loadTransit() {
  try {
    const data = await api("transit");
    const bus = data.buses?.[0];
    const tram = data.trams?.[0];
    transitInfo.innerHTML = `
      🚌 Linija ${bus?.line} → ${bus?.to} (${bus?.next})<br>
      🚊 Tramvaj ${tram?.line} → ${tram?.to} (${tram?.next})
    `;
  } catch {
    transitInfo.textContent = "Javni prijevoz nije dostupan.";
  }
}

// ===============================
// AIRPORT + RDS (koristimo alerts)
// ===============================
const airportInfo = document.getElementById("airportInfo");
const rdsInfo = document.getElementById("rdsInfo");

async function loadAirportAndRDS() {
  try {
    const data = await api("airport");
    const f = data.flights?.[0];
    if (f) {
      airportInfo.textContent = `${f.flight_no} ${f.from} → ${f.to} (${f.status}) ETA ${f.eta}`;
    } else {
      airportInfo.textContent = "Nema podataka o letovima.";
    }
  } catch {
    airportInfo.textContent = "Greška pri dohvaćanju letova.";
  }

  try {
    const a = await api("alerts");
    const rds = a.alerts?.find((x) => x.type === "accident" || x.type === "fire");
    rdsInfo.textContent = rds
      ? `RDS: ${rds.message}`
      : "RDS: nema posebnih upozorenja.";
  } catch {
    rdsInfo.textContent = "RDS nije dostupan.";
  }
}

// ===============================
// NAV CARD + MODAL
// ===============================
const cardNav = document.getElementById("cardNav");
const navModal = document.getElementById("navModal");
const navClose = document.getElementById("navClose");
const navFrom = document.getElementById("navFrom");
const navTo = document.getElementById("navTo");
const navGo = document.getElementById("navGo");
const navVoice = document.getElementById("navVoice");
const navResult = document.getElementById("navResult");
const navSummaryText = document.getElementById("navSummary");

if (cardNav) {
  cardNav.onclick = () => {
    navModal.style.display = "block";
    navFrom.value = "";
    navTo.value = getCity();
  };
}
if (navClose) {
  navClose.onclick = () => {
    navModal.style.display = "none";
  };
}

async function startNavigation() {
  const from = navFrom.value.trim() || "Trenutna lokacija";
  const to = navTo.value.trim() || getCity();
  navResult.textContent = "Računam rutu…";

  try {
    const data = await api("navigate", { from, to });
    const textHr = `Ruta ${data.summary}. Udaljenost ${data.distance}, procijenjeno vrijeme ${data.duration}.`;
    navResult.textContent = textHr;
    navSummaryText.textContent = `${from} → ${to}`;
    speak(textHr);
  } catch {
    navResult.textContent = "Greška pri izračunu rute.";
  }
}

if (navGo) navGo.onclick = startNavigation;

// ===============================
// STREET VIEW CARD
// ===============================
const cardStreet = document.getElementById("cardStreet");
const streetModal = document.getElementById("streetModal");
const streetClose = document.getElementById("streetClose");

if (cardStreet) {
  cardStreet.onclick = () => {
    streetModal.style.display = "block";
  };
}
if (streetClose) {
  streetClose.onclick = () => {
    streetModal.style.display = "none";
  };
}

// ===============================
// BOOKING CARD
// ===============================
const cardBooking = document.getElementById("cardBooking");
const bookingCity = document.getElementById("bookingCity");
if (cardBooking) {
  cardBooking.onclick = () => {
    const city = getCity();
    bookingCity.textContent = `${city} apartmani`;
    const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
      city
    )}`;
    window.open(url, "_blank");
  };
}

// ===============================
// VOICE (STT + TTS)
// ===============================
const micBtn = document.getElementById("micBtn");
const searchBtn = document.getElementById("searchBtn");
const voiceBar = document.getElementById("voiceBar");

let recognition = null;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
}

function startMicFor(inputEl, cb) {
  if (!recognition) {
    alert("Vaš preglednik ne podržava glasovno pretraživanje.");
    return;
  }
  recognition.lang = getSpeechLang();
  voiceBar.classList.remove("hidden");
  micBtn.classList.add("mic-active");

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    inputEl.value = text;
    voiceBar.classList.add("hidden");
    micBtn.classList.remove("mic-active");
    cb && cb(text);
  };
  recognition.onend = () => {
    voiceBar.classList.add("hidden");
    micBtn.classList.remove("mic-active");
  };
  recognition.start();
}

if (micBtn && globalSearch) {
  micBtn.onclick = () =>
    startMicFor(globalSearch, () => {
      triggerAll();
    });
}
if (navVoice && navTo) {
  navVoice.onclick = () =>
    startMicFor(navTo, () => {
      startNavigation();
    });
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = getSpeechLang();
  window.speechSynthesis.speak(utt);
}

// ===============================
// GLAVNI SEARCH -> REFRESH SVIH KARTICA
// ===============================
function triggerAll() {
  loadWeather();
  loadTraffic();
  loadServices();
  loadTransit();
  loadAirportAndRDS();
}

if (searchBtn) {
  searchBtn.onclick = triggerAll;
}
if (globalSearch) {
  globalSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") triggerAll();
  });
}

// INITIAL LOAD
triggerAll();

// SERVICE WORKER (ako imaš sw.js)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
