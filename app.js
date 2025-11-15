// TBW AI PREMIUM – FRONTEND
const BACKEND = "https://tbw-backend.vercel.app/api/tbw";

// ---------- HELPER ZA POZIVE NA JEDAN BACKEND ----------
async function callTBW(route, params = {}) {
  const search = new URLSearchParams({ route, ...params }).toString();
  const res = await fetch(`${BACKEND}?${search}`);
  if (!res.ok) throw new Error("Backend error " + res.status);
  return res.json();
}

// ---------- INTRO ANIMACIJA ----------
const introOverlay = document.getElementById("introOverlay");
const introCanvas = document.getElementById("introCanvas");
const introAudio = document.getElementById("introAudio");
const skipIntro = document.getElementById("skipIntro");

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

    const grad = ctx.createLinearGradient(comet.x, comet.y, comet.x - 90, comet.y - 30);
    grad.addColorStop(0, "rgba(255,255,255,0.7)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(comet.x - 2, comet.y);
    ctx.lineTo(comet.x - 90, comet.y - 30);
    ctx.stroke();

    if (dt < 4500) {
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
  if (skipIntro) {
    skipIntro.onclick = () => {
      introOverlay.style.display = "none";
      if (introAudio) introAudio.pause();
    };
  }
}

// ---------- DOM ELEMENTI ----------
const tickerContent = document.getElementById("tickerContent");
const weatherBox = document.getElementById("weatherBox");
const trafficInfo = document.getElementById("trafficInfo");
const seaBox = document.getElementById("seaBox");
const servicesBox = document.getElementById("servicesBox");
const transitBox = document.getElementById("transitBox");
const airportBox = document.getElementById("airportBox");
const navStatus = document.getElementById("navStatus");

const globalSearch = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const divVoice = document.getElementById("divVoice");

const langHR = document.getElementById("langHR");
const langEN = document.getElementById("langEN");

const navGo = document.getElementById("navGo");
const navAlt = document.getElementById("navAlt");
const navStop = document.getElementById("navStop");
const cardStreet = document.getElementById("cardStreet");

// ---------- JEZIK ----------
let currentLang = "hr";

function setLang(lang) {
  currentLang = lang;
  langHR.classList.toggle("active", lang === "hr");
  langEN.classList.toggle("active", lang === "en");
  // ovdje možeš kasnije dodati prijevode tekstova
}

if (langHR && langEN) {
  langHR.onclick = () => setLang("hr");
  langEN.onclick = () => setLang("en");
}

// ---------- VOICE RECOGNITION ----------
let recognition = null;
let isListening = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "hr-HR";
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    if (globalSearch) globalSearch.value = text;
    isListening = false;
  };

  recognition.onend = () => {
    isListening = false;
  };
}

function startMicFor(inputEl) {
  if (!recognition) {
    alert("Ovaj preglednik ne podržava govorno prepoznavanje.");
    return;
  }
  if (isListening) {
    recognition.stop();
    return;
  }
  isListening = true;
  recognition.start();
}

const micBtn = document.getElementById("micBtn");
if (micBtn && globalSearch) {
  micBtn.onclick = () => startMicFor(globalSearch);
}
if (divVoice && globalSearch) {
  divVoice.onclick = () => startMicFor(globalSearch);
}

// ---------- TICKER ----------
async function loadTicker() {
  try {
    const data = await callTBW("alerts");
    if (tickerContent) {
      tickerContent.textContent =
        (data.alerts || []).map((a) => a.message).join(" • ") ||
        "Nema aktivnih upozorenja. Sretan put!";
    }
  } catch {
    if (tickerContent) tickerContent.textContent = "Upozorenja nedostupna.";
  }
}

// ---------- VRIJEME ----------
async function loadWeather() {
  try {
    const data = await callTBW("weather", { city: "Split" });
    const box = weatherBox.querySelector(".weatherContent");
    if (box) {
      box.innerHTML = `
        ${Math.round(data.temperature || 0)}°C<br/>
        <span style="font-size:13px">${data.condition || ""}</span>
      `;
    }
  } catch {
    if (weatherBox) weatherBox.innerHTML = "<h3>Vrijeme</h3><div>Greška.</div>";
  }
}

// ---------- PROMET ----------
async function loadTraffic() {
  try {
    const d = await callTBW("traffic");
    trafficInfo.innerHTML = `
      <h3>Promet uživo</h3>
      <div>Status: ${d.traffic_status || "N/A"}</div>
      <div>Brzina: ${d.speed || "-"} km/h</div>
      <div>Kašnjenje: ${d.delay_min || 0} min</div>
    `;
  } catch {
    trafficInfo.innerHTML = "<h3>Promet uživo</h3><div>Greška.</div>";
  }
}

// ---------- MORE / TRAJEKTI (ako nema rute – demo tekst) ----------
async function loadSea() {
  try {
    const d = await callTBW("sea");
    seaBox.innerHTML = `
      <h3>Stanje mora</h3>
      <div>${d.info || "More oko generali st. UV umjeren."}</div>
    `;
  } catch {
    seaBox.innerHTML = `
      <h3>Stanje mora</h3>
      <div>More oko generalni st. UV umjeren.</div>
    `;
  }
}

// ---------- SERVISI ----------
async function loadServices() {
  try {
    const d = await callTBW("shops", { city: "Split" });
    const items = d.items || [];
    servicesBox.innerHTML = `
      <h3>Servisi</h3>
      ${items
        .map(
          (s) =>
            `<div>${s.name} – ${s.status || "otvoreno"} (zatvara ${s.closes || "?"})</div>`
        )
        .join("") || "<div>Nema podataka.</div>"}
    `;
  } catch {
    servicesBox.innerHTML = "<h3>Servisi</h3><div>Podaci nedostupni.</div>";
  }
}

// ---------- JAVNI PRIJEVOZ ----------
async function loadTransit() {
  try {
    const d = await callTBW("transit");
    const buses = (d.buses || [])
      .map((b) => `<div>Autobus ${b.line}: ${b.from} → ${b.to} u ${b.next}</div>`)
      .join("");
    transitBox.innerHTML = `<h3>Javni prijevoz</h3>${buses || "<div>Nema podataka.</div>"}`;
  } catch {
    transitBox.innerHTML = "<h3>Javni prijevoz</h3><div>Greška.</div>";
  }
}

// ---------- AERODROMI / RDS ----------
async function loadAirport() {
  try {
    const d = await callTBW("airport");
    const flights = (d.flights || [])
      .map(
        (f) =>
          `<div>${f.flight_no || ""} ${f.from || ""} → ${f.to || ""} · ETA ${
            f.arrival || f.eta || "?"
          } (${f.status || ""})</div>`
      )
      .join("");
    airportBox.innerHTML = `<h3>Aerodromi &amp; RDS alarmi</h3>${flights || "<div>Nema podataka.</div>"}`;
  } catch {
    airportBox.innerHTML = "<h3>Aerodromi &amp; RDS alarmi</h3><div>Greška.</div>";
  }
}

// ---------- NAVIGACIJA (DEMO SPOJENA NA traffic + ai-assistant) ----------
if (navGo) {
  navGo.onclick = async () => {
    navStatus.textContent = "Izračunavam rutu...";
    try {
      const city = (globalSearch && globalSearch.value.trim()) || "Split";
      const info = await callTBW("traffic", { city });
      navStatus.textContent =
        "Ruta aktivna. Stanje: " +
        (info.traffic_status || "normalno") +
        ", kašnjenje: " +
        (info.delay_min || 0) +
        " min.";
    } catch {
      navStatus.textContent = "Greška pri pokretanju rute.";
    }
  };
}
if (navAlt) {
  navAlt.onclick = async () => {
    try {
      const ans = await callTBW("ai-assistant", {
        q: "Predloži alternativne pravce."
      });
      alert(ans.reply || "Nije dostupno.");
    } catch {
      alert("Greška pri dohvaćanju podataka.");
    }
  };
}
if (navStop) {
  navStop.onclick = () => {
    navStatus.textContent = "Nema aktivne rute.";
  };
}

// ---------- STREET VIEW (SADA SAMO INFO, KASNIJE PRAVI EMBED) ----------
if (cardStreet) {
  cardStreet.onclick = async () => {
    try {
      const d = await callTBW("streetview");
      alert(
        "Street View demo – heading: " +
          d.heading +
          "°, pitch: " +
          d.pitch +
          ", zoom: " +
          d.zoom
      );
    } catch {
      alert("Street View trenutno nije dostupan.");
    }
  };
}

// ---------- SEARCH GUMB ----------
if (searchBtn) {
  searchBtn.onclick = () => {
    const txt = (globalSearch && globalSearch.value.trim()) || "";
    if (!txt) return;
    alert("Tražim: " + txt);
  };
}

// ---------- INITIAL LOAD ----------
loadTicker();
loadWeather();
loadTraffic();
loadSea();
loadServices();
loadTransit();
loadAirport();
