/* --------------------------------------------
   TBW AI PREMIUM – FRONTEND MAIN SCRIPT
   Radi sa backendom: https://tbw-backend.vercel.app/api/tbw
-------------------------------------------- */

const API_BASE = "https://tbw-backend.vercel.app/api/tbw";

/* ---------- API helper ---------- */
async function callApi(route, params = {}) {
  try {
    const url = new URL(API_BASE);
    url.searchParams.set("route", route);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("API error:", route, err);
    return { ok: false, error: err.message };
  }
}

/* ---------- JEZICI ---------- */

let currentLang = "HR";

const LANG = {
  HR: {
    searchPlaceholder: "Pretraži (Split, apartmani...)",
    searchBtn: "Traži",
    nav: "Navigacija",
    booking: "Rezervacija smještaja",
    street: "Street View",
    weather: "Vrijeme",
    sea: "Stanje mora",
    traffic: "Promet uživo",
    services: "Servisi",
    transit: "Javni prijevoz",
    airport: "Aerodromi & RDS alarmi"
  },
  EN: {
    searchPlaceholder: "Search (Split, apartments...)",
    searchBtn: "Search",
    nav: "Navigation",
    booking: "Booking",
    street: "Street View",
    weather: "Weather",
    sea: "Sea conditions",
    traffic: "Live traffic",
    services: "Services",
    transit: "Public transport",
    airport: "Airports & RDS alerts"
  }
};

function applyLanguage() {
  const L = LANG[currentLang];

  document.getElementById("globalSearch").placeholder = L.searchPlaceholder;
  document.getElementById("searchBtn").textContent = L.searchBtn;

  document.querySelector("#cardNav h3").textContent = L.nav;
  document.querySelector("#cardBooking h3").textContent = L.booking;
  document.querySelector("#cardStreet h3").textContent = L.street;
  document.querySelector("#weatherBox h3").textContent = L.weather;
  document.querySelector("#seaBox h3").textContent = L.sea;
  document.querySelector("#trafficCard h3").textContent = L.traffic;
  document.querySelector("#servicesBox h3").textContent = L.services;
  document.querySelector("#transitBox h3").textContent = L.transit;
  document.querySelector("#airportBox h3").textContent = L.airport;

  document.getElementById("langHR").classList.toggle("active", currentLang === "HR");
  document.getElementById("langEN").classList.toggle("active", currentLang === "EN");
}

/* ---------- INTRO (simple starfield) ---------- */

(function setupIntro() {
  const overlay = document.getElementById("introOverlay");
  const canvas = document.getElementById("introCanvas");
  const audio = document.getElementById("introAudio");
  const skipBtn = document.getElementById("skipIntro");

  if (!overlay || !canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * 1.2 + 0.2
  }));

  function frame() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      s.x -= s.z * 0.6;
      if (s.x < 0) s.x = w;
      ctx.fillStyle = "white";
      ctx.fillRect(s.x, s.y, 1.5 * s.z, 1.5 * s.z);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  function closeIntro() {
    overlay.style.opacity = "0";
    setTimeout(() => (overlay.style.display = "none"), 500);
  }

  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  setTimeout(closeIntro, 3500);
  if (skipBtn) skipBtn.onclick = closeIntro;
})();

/* ---------- TICKER ---------- */

async function loadTicker(city) {
  const el = document.getElementById("tickerContent");
  try {
    const data = await callApi("alerts", { city: city || "Split" });
    if (!data.ok || !data.alerts || !data.alerts.length) {
      el.textContent = "Nema aktivnih upozorenja. Vozite sigurno.";
      return;
    }
    el.textContent = data.alerts.map(a => a.message).join(" • ");
  } catch {
    el.textContent = "Upozorenja trenutno nedostupna.";
  }
}

/* ---------- HELPERS ---------- */

function getCity() {
  const v = document.getElementById("globalSearch").value.trim();
  return v || "Split";
}

/* ---------- LOADERS ZA KARTICE ---------- */

async function loadWeather() {
  const box = document.querySelector("#weatherBox .weatherContent");
  box.textContent = "Učitavanje...";
  const data = await callApi("weather", { city: getCity() });
  if (!data.ok) return (box.textContent = "Greška pri učitavanju.");

  box.innerHTML = `
    <div style="font-size:30px">${data.temperature}°C</div>
    <div>${data.condition || ""}</div>
  `;
}

async function loadSea() {
  const box = document.getElementById("seaContent");
  box.textContent = "Učitavanje...";
  const data = await callApi("sea", { city: getCity() });
  if (!data.ok) return (box.textContent = "Greška pri učitavanju.");

  box.innerHTML = `
    Temperatura: ${data.temperature}°C<br>
    ${data.note || ""}
  `;
}

async function loadTraffic() {
  const box = document.getElementById("trafficContent");
  box.textContent = "Učitavanje...";
  const data = await callApi("traffic", { city: getCity() });
  if (!data.ok) return (box.textContent = "Greška pri učitavanju.");

  box.innerHTML = `
    Status: ${data.status || "normal"}<br>
    Brzina: ${data.speed || 0} km/h<br>
    Kašnjenje: ${data.delay || 0} min
  `;
}

async function loadServices() {
  const box = document.getElementById("servicesContent");
  const data = await callApi("services", { city: getCity() });
  if (!data.ok || !data.services) {
    box.textContent = "Nema podataka.";
    return;
  }
  box.innerHTML = data.services
    .map(s => `${s.name} – ${s.status}`)
    .join("<br>");
}

async function loadTransit() {
  const box = document.getElementById("transitContent");
  const data = await callApi("transit", { city: getCity() });
  if (!data.ok || !data.lines) {
    box.textContent = "Nema podataka.";
    return;
  }
  box.innerHTML = data.lines
    .map(l => `${l.name}: ${l.departure}`)
    .join("<br>");
}

async function loadAirport() {
  const box = document.getElementById("airportContent");
  const data = await callApi("airport", { city: getCity() });
  if (!data.ok) {
    box.textContent = "Nema podataka.";
    return;
  }
  box.innerHTML = `
    Let: ${data.flight || ""} – ETA ${data.eta || ""}<br>
    RDS: ${data.alert || "nema upozorenja"}
  `;
}

/* ---------- NAV CARD (za sada demo tekst) ---------- */

function updateNavCard() {
  const box = document.getElementById("navContent");
  box.innerHTML = `Nema aktivne rute<br><small>Dodirni za budući PRO NAVI prikaz.</small>`;
}

/* ---------- BOOKING CARD ---------- */

function updateBookingCard() {
  const box = document.getElementById("bookingInfo");
  box.innerHTML = `Dodirni za pretragu Booking.com ponuda za: <b>${getCity()}</b>`;
}

/* ---------- STREET VIEW CARD ---------- */

function updateStreetCard() {
  const box = document.getElementById("streetPreview");
  box.innerHTML = `Dodirni za prikaz panorame destinacije <b>${getCity()}</b>.`;
}

/* ---------- FULLSCREEN MODAL ---------- */

const modal = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

function openModalFromCard(card) {
  const title = card.querySelector("h3").textContent;
  const bodyHtml = card.querySelector(".cardBody").innerHTML;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modal.classList.remove("hidden");
}

modalClose.onclick = () => modal.classList.add("hidden");
modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden");
};

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => openModalFromCard(card));
});

/* ---------- MIC / GOVOR ---------- */

let recognition = null;
let isListening = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "hr-HR";

  recognition.onstart = () => { isListening = true; };
  recognition.onend = () => { isListening = false; };
  recognition.onerror = () => { isListening = false; };

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    document.getElementById("globalSearch").value = text;
  };
}

document.getElementById("micBtn").onclick = () => {
  if (!recognition) {
    alert("Govorno prepoznavanje nije podržano u ovom pregledniku.");
    return;
  }
  if (isListening) return; // spriječi error "already started"
  try {
    recognition.start();
  } catch (e) {
    console.warn("Speech start error:", e);
  }
};

/* ---------- JEZIK GUMBI ---------- */

document.getElementById("langHR").onclick = () => {
  currentLang = "HR";
  recognition && (recognition.lang = "hr-HR");
  applyLanguage();
};

document.getElementById("langEN").onclick = () => {
  currentLang = "EN";
  recognition && (recognition.lang = "en-US");
  applyLanguage();
};

/* ---------- MAIN LOAD ---------- */

async function loadAll() {
  updateNavCard();
  updateBookingCard();
  updateStreetCard();

  await Promise.all([
    loadTicker(getCity()),
    loadWeather(),
    loadSea(),
    loadTraffic(),
    loadServices(),
    loadTransit(),
    loadAirport()
  ]);
}

/* SEARCH BUTTON → reload podataka za novi grad */

document.getElementById("searchBtn").onclick = () => {
  loadAll();
};

/* INIT */

applyLanguage();
loadAll();
