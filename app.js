const BACKEND_BASE = "https://tbw-backend.vercel.app";

// ===== INTRO =====

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
    x: Math.random()*w,
    y: Math.random()*h,
    z: Math.random()*1.2+0.2,
  }));

  let comet = { x: -50, y: h*0.3, vx: 6, vy: 1.2 };
  let start = null;

  function frame(t) {
    if (!start) start = t;
    const dt = t - start;
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,w,h);

    for (const s of stars) {
      s.x -= s.z*0.6;
      if (s.x < 0) s.x = w;
      ctx.fillStyle = "white";
      ctx.fillRect(s.x, s.y, 1.5*s.z, 1.5*s.z);
    }

    comet.x += comet.vx;
    comet.y += comet.vy;
    ctx.beginPath();
    ctx.fillStyle = "#ffd180";
    ctx.arc(comet.x, comet.y, 5, 0, Math.PI*2);
    ctx.fill();
    const grad = ctx.createLinearGradient(comet.x, comet.y, comet.x-90, comet.y-30);
    grad.addColorStop(0,"rgba(255,255,255,0.7)");
    grad.addColorStop(1,"rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(comet.x-2, comet.y);
    ctx.lineTo(comet.x-90, comet.y-30);
    ctx.stroke();

    if (dt < 4800) requestAnimationFrame(frame);
    else {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 200, 0, Math.PI*2);
      ctx.fill();
      setTimeout(() => {
        introOverlay.style.opacity = "0";
        setTimeout(()=> introOverlay.style.display = "none", 600);
      }, 200);
    }
  }

  if (introAudio) {
    introAudio.currentTime = 0;
    introAudio.play().catch(()=>{});
  }
  requestAnimationFrame(frame);
}

if (introOverlay) {
  if (localStorage.getItem("tbw_intro_seen")) introOverlay.style.display = "none";
  else {
    localStorage.setItem("tbw_intro_seen","1");
    runIntro();
  }
  if (skipIntroBtn) {
    skipIntroBtn.onclick = () => {
      introOverlay.style.display = "none";
      if (introAudio) introAudio.pause();
    };
  }
}

// ===== COOKIE + LEGAL =====

if (!localStorage.getItem("tbw_cookie")) {
  const banner = document.getElementById("cookieBanner");
  if (banner) banner.style.display = "flex";
}

const acceptBtn = document.getElementById("cookieAccept");
const rejectBtn = document.getElementById("cookieReject");
if (acceptBtn) acceptBtn.onclick = () => {
  localStorage.setItem("tbw_cookie", "accepted");
  document.getElementById("cookieBanner").style.display = "none";
};
if (rejectBtn) rejectBtn.onclick = () => {
  localStorage.setItem("tbw_cookie", "rejected");
  document.getElementById("cookieBanner").style.display = "none";
};

const legalModal = document.getElementById("legalModal");
const openLegal  = document.getElementById("openLegal");
const legalClose = document.getElementById("legalClose");

if (openLegal && legalModal && legalClose) {
  openLegal.onclick = (e) => {
    e.preventDefault();
    legalModal.style.display = "block";
  };
  legalClose.onclick = () => {
    legalModal.style.display = "none";
  };
  window.addEventListener("click", (e)=>{
    if (e.target === legalModal) legalModal.style.display = "none";
  });
}

// ===== BACKEND STATUS =====

const backendStatus = document.getElementById("backendStatus");
fetch(`${BACKEND_BASE}/api/health`)
  .then(r => r.json())
  .then(() => {
    backendStatus.textContent = "Backend: online";
    backendStatus.classList.remove("offline");
  })
  .catch(()=>{
    backendStatus.textContent = "Backend: offline";
    backendStatus.classList.add("offline");
  });

// ===== GEO =====

const geoStatus = document.getElementById("geoStatus");
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      geoStatus.textContent = `Location: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`;
    },
    () => geoStatus.textContent = "Location: disabled"
  );
}

// ===== TICKER =====

const tickerEl = document.getElementById("tickerContent");
async function loadTicker(city) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/alerts?city=${encodeURIComponent(city || "Croatia")}`);
    const data = await res.json();
    const messages = (data.alerts || []).map(a => a.message);
    tickerEl.textContent = messages.length ? messages.join(" • ") : "No active alerts. Drive safe.";
  } catch {
    tickerEl.textContent = "Alerts unavailable.";
  }
}
loadTicker("Croatia");

// ===== HELPERS =====

function getCityFromInput() {
  const input = document.getElementById("globalSearch");
  return input && input.value.trim() ? input.value.trim() : "Split";
}

// ===== WEATHER =====

async function loadWeather() {
  const city = getCityFromInput();
  try {
    const res = await fetch(`${BACKEND_BASE}/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    const box = document.getElementById("weatherBox");

    if (box) {
      if (data.main) {
        box.innerHTML = `
          <div><strong>${data.name}</strong></div>
          <div>${Math.round(data.main.temp)}°C, ${data.weather?.[0]?.description || ""}</div>
          <div>Feels: ${Math.round(data.main.feels_like)}°C • Humidity: ${data.main.humidity}%</div>
        `;
      } else box.textContent = "Weather unavailable.";
    }

    document.getElementById("seaBox").textContent =
      `Sea status: calm • Water temp: ~22°C (demo) • UV: moderate`;

  } catch {
    document.getElementById("weatherBox").textContent = "Weather error.";
  }
}

// ===== PHOTOS & POI =====

async function loadPhotosAndPoi() {
  const city = getCityFromInput();
  try {
    const photoRes = await fetch(`${BACKEND_BASE}/api/photos?q=${encodeURIComponent(city)}`);
    const photoData = await photoRes.json();
    const grid = document.getElementById("photoGrid");

    grid.innerHTML = "";
    (photoData.results || []).slice(0,4).forEach(p => {
      const img = document.createElement("img");
      img.src = p.urls.small;
      img.alt = p.alt_description || city;
      grid.appendChild(img);
    });
    if (!grid.innerHTML) grid.textContent = "No photos.";

    const poiRes = await fetch(`${BACKEND_BASE}/api/poi?city=${encodeURIComponent(city)}`);
    const poiData = await poiRes.json();
    const poiBox = document.getElementById("poiBox");

    poiBox.innerHTML = "";
    (poiData.items || []).slice(0,5).forEach(p => {
      const div = document.createElement("div");
      div.className = "poi-item";
      div.innerHTML = `<strong>${p.name}</strong><br><span>${p.short || ""}</span>`;
      poiBox.appendChild(div);
    });
    if (!poiBox.innerHTML) poiBox.textContent = "No attractions.";

  } catch {
    document.getElementById("photoGrid").textContent = "Error loading photos.";
  }
}

// ===== TRAFFIC & SERVICES =====

async function loadTrafficAndServices() {
  const city = getCityFromInput();

  try {
    const trafRes = await fetch(`${BACKEND_BASE}/api/traffic?city=${encodeURIComponent(city)}`);
    const trafData = await trafRes.json();
    document.getElementById("trafficInfo").textContent =
      trafData.description || "Traffic info updated.";
  } catch {
    document.getElementById("trafficInfo").textContent = "Traffic unavailable.";
  }

  try {
    const shopRes = await fetch(`${BACKEND_BASE}/api/shops?city=${encodeURIComponent(city)}`);
    const shopData = await shopRes.json();
    const box = document.getElementById("servicesBox");

    box.innerHTML = "";
    (shopData.items || []).forEach(s => {
      const div = document.createElement("div");
      div.innerHTML = `🛒 ${s.name} – ${s.status || "open"} • closes: ${s.closes || "?"}`;
      box.appendChild(div);
    });
    if (!box.innerHTML) box.textContent = "No shop/service info.";
  } catch {
    document.getElementById("servicesBox").textContent = "Service info unavailable.";
  }
}

// ===== BOOKING =====

document.getElementById("bookBtn").onclick = () => {
  const city = document.getElementById("hotelCity").value || getCityFromInput();
  const guests = document.getElementById("guests").value || 2;
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&group_adults=${encodeURIComponent(guests)}`;
  window.open(url, "_blank");
};

// ===== NAVIGATION =====

document.getElementById("navGo").onclick = async () => {
  const to = document.getElementById("routeTo").value;
  if (!to) return alert("Please enter destination.");

  const navStatus = document.getElementById("navStatus");
  navStatus.textContent = "Calculating route…";

  try {
    const r = await TBWNavi.traffic();
    navStatus.textContent = `Route loaded. Traffic: ${r.status || "ok"}.`;
  } catch {
    navStatus.textContent = "Navigation error.";
  }
};

document.getElementById("navHud").onclick = async () => {
  try {
    const cfg = await TBWNavi.hud();
    alert("HUD mode: " + (cfg.mode || "enabled (demo)"));
  } catch {
    alert("HUD config error.");
  }
};

document.getElementById("navExit").onclick = () => {
  document.getElementById("navStatus").textContent = "Navigation stopped.";
};

// ===== AI CHAT =====

const msgBox        = document.getElementById("messages");
const aiInput       = document.getElementById("assistantInput");

function addMsg(text, who = "assistant") {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

// speech recognition
let recognition = null;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.continuous = false;
}

function startVoiceTo(inputEl) {
  if (!recognition) return alert("Voice recognition not supported.");
  recognition.onresult = (e) => inputEl.value = e.results[0][0].transcript;
  recognition.start();
}

document.getElementById("micBtn").onclick = () => startVoiceTo(document.getElementById("globalSearch"));
document.getElementById("assistantVoice").onclick = () => startVoiceTo(aiInput);

// tts
function tts(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  speechSynthesis.speak(u);
}

// AI
async function sendToAI(question) {
  if (!question.trim()) return;
  addMsg(question, "user");
  aiInput.value = "";

  try {
    const res = await fetch(`${BACKEND_BASE}/api/describe?name=${encodeURIComponent(question)}`);
    const data = await res.json();
    const txt = data.speech || "I currently have no details.";
    addMsg(txt, "assistant");
    tts(txt);
  } catch {
    addMsg("AI error.", "assistant");
  }
}

document.getElementById("sendBtn").onclick = () => sendToAI(aiInput.value);
aiInput.onkeydown = (e) => { if (e.key === "Enter") sendToAI(aiInput.value); };

// ===== INIT =====

loadWeather();
loadPhotosAndPoi();
loadTrafficAndServices();

// ===== SERVICE WORKER =====

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(()=>{});
}
