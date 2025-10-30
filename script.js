/* TBW AI Concierge v6 – stabilna GitHub verzija */

// -------- SPLASH & ZVUK --------
window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  const bgAudio = new Audio("/assets/gentle-ocean-waves-birdsong-and-gull-7109.mp3");
  bgAudio.loop = true;
  bgAudio.volume = 0.25;

  const startAudio = () => {
    bgAudio.play().catch(()=>{});
    document.removeEventListener("click", startAudio);
  };
  document.addEventListener("click", startAudio);

  // efekt zvijezda
  const stars = document.createElement("div");
  stars.classList.add("stars");
  document.body.appendChild(stars);

  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 1000);
  }, 5000);
});

// -------- TRAŽILICA I GLAS --------
const input = document.getElementById("cityInput");
const button = document.getElementById("searchBtn");
const mic = document.getElementById("micBtn");
const notif = document.getElementById("notif-bar");

const API_URL = "https://tbw-backend.onrender.com"; // tvoj Render backend

async function searchCity() {
  const city = input.value.trim() || "Split";
  notif.textContent = `🔎 Tražim informacije za ${city}...`;

  try {
    const res = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (data && data.main) {
      document.getElementById("weather").innerHTML = `
        <h2>☀️ ${city}</h2>
        <p>${data.weather[0].description}, ${Math.round(data.main.temp)}°C</p>
        <p>Vjetar: ${data.wind.speed} m/s | Vlažnost: ${data.main.humidity}%</p>
      `;
      speak(`U ${city} je trenutno ${Math.round(data.main.temp)} stupnjeva i ${data.weather[0].description}.`);
    }
  } catch (err) {
    notif.textContent = "⚠️ Greška pri dohvaćanju podataka.";
  }
}

button.addEventListener("click", searchCity);
input.addEventListener("keydown", e => { if (e.key === "Enter") searchCity(); });

// -------- GLAS GOVORA --------
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "hr-HR";
  msg.rate = 1;
  speechSynthesis.speak(msg);
}

// -------- GLASOVNO PRETRAŽIVANJE --------
if ("webkitSpeechRecognition" in window) {
  const rec = new webkitSpeechRecognition();
  rec.lang = "hr-HR";
  rec.continuous = false;
  rec.interimResults = false;

  mic.addEventListener("click", () => {
    rec.start();
    notif.textContent = "🎙️ Govorite sada...";
  });

  rec.onresult = (event) => {
    const said = event.results[0][0].transcript;
    input.value = said;
    searchCity();
  };
}

// -------- NAVIGACIJA (Google Maps) --------
document.getElementById("navBtn").addEventListener("click", () => {
  const dest = input.value.trim() || "Split";
  speak(`Pokrećem navigaciju do ${dest}.`);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  window.open(url, "_blank");
});

// -------- TRAKA OBAVIJESTI --------
async function refreshAlerts() {
  try {
    const res = await fetch(`${API_URL}/api/alerts`);
    const data = await res.json();
    if (data.alerts && data.alerts.length > 0) {
      let i = 0;
      setInterval(() => {
        notif.textContent = `⚠️ ${data.alerts[i].message}`;
        i = (i + 1) % data.alerts.length;
      }, 8000);
    }
  } catch (err) {
    notif.textContent = "✔️ TBW aktivan – bez novih upozorenja.";
  }
}
setInterval(refreshAlerts, 60000);
refreshAlerts();
