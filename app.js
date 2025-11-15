// =======================
// TBW AI PREMIUM FRONTEND
// =======================

const API_BASE = "https://tbw-backend.vercel.app/api/tbw";

let currentLang = "hr";
let currentCity = "Split";

// ----- I18N -----

const TEXT = {
  hr: {
    searchPlaceholder: "Pretraži (Split, apartmani, hotel…)",
    searchBtn: "Traži",
    nav: "Navigacija",
    booking: "Rezervacija smještaja",
    street: "Street View",
    weather: "Vrijeme",
    traffic: "Promet uživo",
    sea: "Stanje mora & trajekti",
    services: "Servisi & trgovine",
    transit: "Javni prijevoz",
    airport: "Aerodromi & RDS alarmi",
    heroLine:
      "Prometna upozorenja · Vrijeme · Stanje mora · Nesreće · Rezervacije · Alert!",
    noRoute: "Nema aktivne rute.",
    bookingHint: "Dodirni za prikaz Booking.com ponude.",
    streetHint: "Klikni za prikaz trenutne destinacije.",
    loading: "Učitavanje…",
    offline: "Backend nedostupan",
    online: "Backend: online",
  },
  en: {
    searchPlaceholder: "Search (Split, apartments, hotel…)",
    searchBtn: "Search",
    nav: "Navigation",
    booking: "Accommodation booking",
    street: "Street View",
    weather: "Weather",
    traffic: "Live traffic",
    sea: "Sea & ferries",
    services: "Services & shops",
    transit: "Public transport",
    airport: "Airports & RDS alerts",
    heroLine:
      "Traffic alerts · Weather · Sea conditions · Incidents · Reservations · Alerts!",
    noRoute: "No active route.",
    bookingHint: "Tap to open Booking.com offers.",
    streetHint: "Tap to view current destination.",
    loading: "Loading…",
    offline: "Backend offline",
    online: "Backend: online",
  },
};

function t(key) {
  return (TEXT[currentLang] && TEXT[currentLang][key]) || key;
}

// ----- BASIC HELPERS -----

async function callApi(route, extra = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set("route", route);
  if (!extra.city && route !== "alerts") {
    url.searchParams.set("city", currentCity);
  }
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function qs(id) {
  return document.getElementById(id);
}

// ----- INTRO ANIMATION -----

function runIntro() {
  const overlay = qs("introOverlay");
  const canvas = qs("introCanvas");
  const audio = qs("introAudio");
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({ length: 160 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * 1.3 + 0.3,
  }));

  let comet = { x: -80, y: h * 0.35, vx: 7, vy: 1.2 };
  let start = null;

  function frame(ts) {
    if (!start) start = ts;
    const dt = ts - start;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      s.x -= s.z * 0.8;
      if (s.x < 0) {
        s.x = w;
        s.y = Math.random() * h;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(s.x, s.y, 1.6 * s.z, 1.6 * s.z);
    }

    comet.x += comet.vx;
    comet.y += comet.vy;
    ctx.beginPath();
    ctx.fillStyle = "#ffe082";
    ctx.arc(comet.x, comet.y, 5, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(
      comet.x,
      comet.y,
      comet.x - 120,
      comet.y - 40
    );
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(comet.x - 2, comet.y);
    ctx.lineTo(comet.x - 120, comet.y - 40);
    ctx.stroke();

    if (dt < 4500) {
      requestAnimationFrame(frame);
    } else {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 220, 0, Math.PI * 2);
      ctx.fill();
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => (overlay.style.display = "none"), 600);
      }, 200);
    }
  }

  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  requestAnimationFrame(frame);
}

// ----- LANGUAGE -----

function applyLangTexts() {
  qs("globalSearch").placeholder = t("searchPlaceholder");
  qs("searchBtn").textContent = t("searchBtn");

  qs("navTitle").textContent = t("nav");
  qs("bookingTitle").textContent = t("booking");
  qs("streetTitle").textContent = t("street");
  qs("weatherTitle").textContent = t("weather");
  qs("trafficTitle").textContent = t("traffic");
  qs("seaTitle").textContent = t("sea");
  qs("servicesTitle").textContent = t("services");
  qs("transitTitle").textContent = t("transit");
  qs("airportTitle").textContent = t("airport");
  qs("heroLine").textContent = t("heroLine");

  if (!qs("navContent").dataset.locked) qs("navContent").textContent = t("noRoute");
  if (!qs("bookingContent").dataset.locked) qs("bookingContent").textContent = t("bookingHint");
  if (!qs("streetContent").dataset.locked) qs("streetContent").textContent = t("streetHint");
}

function setLang(lang) {
  currentLang = lang;
  qs("langHR").classList.toggle("active", lang === "hr");
  qs("langEN").classList.toggle("active", lang === "en");
  applyLangTexts();
  updateSpeechLang();
}

// ----- STATUS / GEO / ALERTS -----

async function checkBackend() {
  const el = qs("backendStatus");
  try {
    await callApi("weather", { city: currentCity });
    el.textContent = t("online");
    el.classList.add("ok");
    el.classList.remove("err");
  } catch (e) {
    console.error(e);
    el.textContent = t("offline");
    el.classList.add("err");
    el.classList.remove("ok");
  }
}

function initGeo() {
  const el = qs("geoStatus");
  if (!navigator.geolocation) {
    el.textContent = "Lokacija: nije podržano";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      el.textContent =
        `Lokacija: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
    },
    () => {
      el.textContent = "Lokacija: onemogućena";
    }
  );
}

async function loadAlerts() {
  try {
    const data = await callApi("alerts", { city: currentCity });
    const msgs = (data.alerts || []).map((a) => a.message);
    qs("tickerContent").textContent =
      msgs.length > 0 ? msgs.join(" · ") : "Nema aktivnih upozorenja. Sretan put!";
  } catch (e) {
    console.error(e);
    qs("tickerContent").textContent = "Upozorenja nedostupna.";
  }
}

// ----- LOADERS -----

async function loadWeather() {
  const box = qs("weatherContent");
  box.textContent = t("loading");
  try {
    const data = await callApi("weather");
    const c = data.temperature ?? data.temp;
    const cond = data.condition || data.conditions || "-";
    box.innerHTML = `
      <div><strong>${data.city || currentCity}</strong></div>
      <div style="font-size:20px;margin:4px 0;">${Math.round(c)}°C</div>
      <div>${cond}</div>
    `;
    startWeatherAnim(cond);
  } catch (e) {
    console.error(e);
    box.textContent = "Greška kod vremena.";
  }
}

async function loadSea() {
  const box = qs("seaContent");
  box.textContent = t("loading");
  try {
    const data = await callApi("sea");
    box.innerHTML = `
      <div><strong>${data.city || currentCity}</strong></div>
      <div style="margin:4px 0;">More: ${data.temperature ?? "-"}°C</div>
      <div>${data.note || "UV umjeren."}</div>
    `;
  } catch (e) {
    console.error(e);
    box.textContent = "Greška kod podataka o moru.";
  }
}

async function loadTraffic() {
  const box = qs("trafficContent");
  box.textContent = t("loading");
  try {
    const data = await callApi("traffic");
    box.innerHTML = `
      <div>Status: <strong>${
        data.status || data.traffic_status || "normal"
      }</strong></div>
      <div>Brzina: ${data.speed || "—"} km/h</div>
      <div>Kašnjenje: ${data.delay_min || 0} min</div>
      <div style="margin-top:4px;">${data.note || ""}</div>
    `;
  } catch (e) {
    console.error(e);
    box.textContent = "Greška kod prometa.";
  }
}

async function loadServices() {
  const box = qs("servicesContent");
  box.textContent = t("loading");
  try {
    const data = await callApi("services");
    const items = data.items || data.services || [];
    if (!items.length) {
      box.textContent = "Nema podataka o servisima.";
      return;
    }
    box.innerHTML = items
      .slice(0, 4)
      .map(
        (s) =>
          `${s.name} – ${s.status || "otvoreno"}${
            s.closes ? ` (zatvara ${s.closes})` : ""
          }`
      )
      .join("<br>");
  } catch (e) {
    console.error(e);
    box.textContent = "Greška kod servisa.";
  }
}

async function loadTransit() {
  const box = qs("transitContent");
  box.textContent = t("loading");
  try {
    const data = await callApi("transit");
    const items = data.items || data.buses || [];
    if (!items.length) {
      box.textContent = "Nema podataka o javnom prijevozu.";
      return;
    }
    box.innerHTML = items
      .slice(0, 4)
      .map(
        (t) =>
          `${t.type || "Bus"} ${t.line}: ${t.from} → ${t.to} · ${t.next || ""}`
      )
      .join("<br>");
  } catch (e) {
    console.error(e);
    box.textContent = "Greška kod javnog prijevoza.";
  }
}

async function loadAirport() {
  const box = qs("airportContent");
  box.textContent = t("loading");
  try {
    const data = await callApi("airport");
    const items = data.items || data.flights || [];
    if (!items.length) {
      box.textContent = "Nema podataka o letovima.";
      return;
    }
    box.innerHTML = items
      .slice(0, 3)
      .map(
        (f) =>
          `${f.flight || f.flight_no || ""}: ${f.from} → ${f.to} · ETA ${
            f.eta || f.arrival || ""
          } (${f.status || ""})`
      )
      .join("<br>");
  } catch (e) {
    console.error(e);
    box.textContent = "Greška kod aerodroma.";
  }
}

function initStaticCards() {
  const navContent = qs("navContent");
  navContent.textContent = t("noRoute");

  const bookingContent = qs("bookingContent");
  bookingContent.textContent = t("bookingHint");
  bookingContent.dataset.locked = "1";

  const streetContent = qs("streetContent");
  streetContent.textContent = t("streetHint");
  streetContent.dataset.locked = "1";
}

async function loadAll() {
  await checkBackend();
  loadAlerts();
  loadWeather();
  loadTraffic();
  loadSea();
  loadServices();
  loadTransit();
  loadAirport();
}

// ----- WEATHER ANIMATION -----

let weatherAnimFrame = null;

function startWeatherAnim(condition) {
  const canvas = qs("weatherAnim");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const isSnow = /snow/i.test(condition || "");
  const isRain = /rain/i.test(condition || "");
  const isClear = /clear|sun/i.test(condition || "");

  let w, h;
  function resize() {
    w = canvas.width = canvas.clientWidth;
    h = canvas.height = canvas.clientHeight;
  }
  resize();

  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    v: isSnow ? 0.3 + Math.random() * 0.5 : 1 + Math.random() * 1.5,
  }));

  function loop() {
    ctx.clearRect(0, 0, w, h);

    if (isSnow || isRain) {
      ctx.strokeStyle = isSnow ? "#ffffff" : "#90caf9";
      ctx.lineWidth = isSnow ? 1.2 : 1.4;
      for (const p of particles) {
        p.y += p.v;
        if (p.y > h) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        if (isSnow) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 1, p.y + 3);
        } else {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 2, p.y + 8);
        }
        ctx.stroke();
      }
    } else if (isClear) {
      ctx.fillStyle = "rgba(255, 241, 118, 0.6)";
      ctx.beginPath();
      ctx.arc(w - 35, 35, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    weatherAnimFrame = requestAnimationFrame(loop);
  }

  if (weatherAnimFrame) cancelAnimationFrame(weatherAnimFrame);
  loop();
}

// ----- MODAL -----

function initModal() {
  const modal = qs("cardModal");
  const modalTitle = qs("modalTitle");
  const modalBody = qs("modalBody");
  const closeBtn = qs("modalClose");

  function openFromCard(cardId, titleId, contentId) {
    const title = qs(titleId).textContent;
    const content = qs(contentId).innerHTML;
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.remove("hidden");
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.id;
      if (id === "cardNav") openFromCard(id, "navTitle", "navContent");
      else if (id === "cardBooking") {
        const q = encodeURIComponent(currentCity);
        window.open(
          `https://www.booking.com/searchresults.html?ss=${q}`,
          "_blank"
        );
      } else if (id === "cardStreet")
        openFromCard(id, "streetTitle", "streetContent");
      else if (id === "cardWeather")
        openFromCard(id, "weatherTitle", "weatherContent");
      else if (id === "cardTraffic")
        openFromCard(id, "trafficTitle", "trafficContent");
      else if (id === "cardSea")
        openFromCard(id, "seaTitle", "seaContent");
      else if (id === "cardServices")
        openFromCard(id, "servicesTitle", "servicesContent");
      else if (id === "cardTransit")
        openFromCard(id, "transitTitle", "transitContent");
      else if (id === "cardAirport")
        openFromCard(id, "airportTitle", "airportContent");
    });
  });

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

// ----- VOICE -----

let recognition = null;

function initSpeech() {
  const SR =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  if (!SR) return;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  updateSpeechLang();
}

function updateSpeechLang() {
  if (!recognition) return;
  recognition.lang = currentLang === "hr" ? "hr-HR" : "en-US";
}

function startMicFor(inputEl) {
  if (!recognition) {
    alert("Ovaj preglednik ne podržava prepoznavanje govora.");
    return;
  }
  try {
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      inputEl.value = text;
    };
    recognition.start();
  } catch (e) {
    console.error(e);
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentLang === "hr" ? "hr-HR" : "en-US";
  window.speechSynthesis.speak(u);
}

function initVoiceButtons() {
  const searchVoiceBtn = qs("searchVoiceBtn");
  const searchInput = qs("globalSearch");

  if (searchVoiceBtn) {
    searchVoiceBtn.onclick = () => startMicFor(searchInput);
  }
}

// ----- SEARCH -----

function initSearch() {
  const searchInput = qs("globalSearch");
  const searchBtn = qs("searchBtn");

  function triggerSearch() {
    const val = searchInput.value.trim();
    if (!val) return;
    currentCity = val;
    loadAll();
  }

  searchBtn.addEventListener("click", triggerSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") triggerSearch();
  });
}

// ----- INIT -----

document.addEventListener("DOMContentLoaded", () => {
  const introSeen = localStorage.getItem("tbw_intro_seen");
  if (!introSeen) {
    localStorage.setItem("tbw_intro_seen", "1");
    runIntro();
  } else {
    const overlay = qs("introOverlay");
    if (overlay) overlay.style.display = "none";
  }
  const skip = qs("skipIntro");
  if (skip) {
    skip.onclick = () => {
      const overlay = qs("introOverlay");
      if (overlay) overlay.style.display = "none";
      const audio = qs("introAudio");
      if (audio) audio.pause();
    };
  }

  qs("langHR").onclick = () => setLang("hr");
  qs("langEN").onclick = () => setLang("en");
  applyLangTexts();
  initStaticCards();
  initGeo();
  initSearch();
  initSpeech();
  initVoiceButtons();
  initModal();
  loadAll();
});
