// TBW AI Concierge – FULL

// Backend baza
const API_BASE = "https://tbw-backend.onrender.com";

// Audio + splash
window.addEventListener("load", () => {
  const audio = document.getElementById("bg-audio");
  const kick = () => { audio.volume = 0.22; audio.play().catch(()=>{}); document.removeEventListener("click", kick); };
  document.addEventListener("click", kick);
});

// UI elementi
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const micBtn    = document.getElementById("micBtn");
const navBtn    = document.getElementById("navBtn");
const weatherDiv= document.getElementById("weatherData");
const photoWrap = document.getElementById("photo-container");
const attrWrap  = document.getElementById("attractions-list");
const notifBar  = document.getElementById("notif-bar");

// Jezik detekcija
function detectLang(text){
  const t=(text||"").toLowerCase();
  if (/[čćšđž]/.test(t) || /\b(grad|vrijeme|smještaj|navigacija|znamenitosti)\b/.test(t)) return "hr";
  if (/\b(appartamenti|disponibili|città|prenotare|villa|mare)\b/.test(t)) return "it";
  return "en";
}

// TTS govor
function speak(text, pref="hr"){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = pref==="hr"?"hr-HR":pref==="it"?"it-IT":"en-GB";
    u.rate=1; u.pitch=1;
    // pokušaj ženski glas
    const vs = speechSynthesis.getVoices();
    const want = pref==="hr"?["hr"] : pref==="it"?["it-IT","it"]: ["en-GB","en"];
    const voice = vs.find(v=>want.some(w=>v.lang.includes(w)) && /female|zira|sofia|lucia|emma|susan/i.test(v.name)) || vs.find(v=>want.some(w=>v.lang.includes(w)));
    if (voice) u.voice=voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(_){}
}

// STT (mikrofon)
let recognition=null, recognizing=false;
if ("webkitSpeechRecognition" in window){
  recognition = new webkitSpeechRecognition();
  recognition.lang = "hr-HR";
  recognition.continuous = false;
  recognition.interimResults = false;
  micBtn.addEventListener("click", ()=>{
    if (!recognizing){ recognition.start(); recognizing=true; micBtn.style.filter="brightness(1.3)"; notifBar.textContent="🎙️ Govorite…"; }
    else { recognition.stop(); recognizing=false; micBtn.style.filter=""; }
  });
  recognition.onresult = e=>{
    const said = e.results[0][0].transcript;
    cityInput.value = said;
    // “Povedi me do …”
    const low = said.toLowerCase().trim();
    if (low.startsWith("povedi me do")) {
      const dest = low.replace("povedi me do","").trim();
      speak(`Pokrećem navigaciju do ${dest}`, "hr");
      openDirections(dest);
    } else {
      searchAll(said);
    }
  };
  recognition.onend = ()=>{ recognizing=false; micBtn.style.filter=""; };
}

// Helper fetch JSON
async function j(url){ const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

// Glavna pretraga
async function searchAll(city){
  if (!city) return;
  const lang = detectLang(city);
  notifBar.textContent = `🔎 Učitavam podatke za ${city}…`;

  try{
    const [w,p,a,al] = await Promise.all([
      j(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`),
      j(`${API_BASE}/api/photos?q=${encodeURIComponent(city)}`),
      j(`${API_BASE}/api/poi?city=${encodeURIComponent(city)}`),
      j(`${API_BASE}/api/alerts?city=${encodeURIComponent(city)}`)
    ]);

    renderWeather(city, w);
    renderPhotos(p);
    renderAttractions(city, a);  // klik vodi u Maps + AI opis
    renderAlerts(al);

    notifBar.textContent = `✅ Podaci učitani za ${city}.`;
    if (w?.main?.temp!=null){
      speak(
        lang==="hr" ? `Prikazujem rezultate za ${city}. Trenutno je ${Math.round(w.main.temp)} stupnjeva.` :
        lang==="it" ? `Mostro i risultati per ${city}. La temperatura è ${Math.round(w.main.temp)} gradi.` :
                      `Showing results for ${city}. Temperature is ${Math.round(w.main.temp)} degrees.`,
        lang
      );
    }
  }catch(err){
    console.error(err);
    notifBar.textContent = `⚠️ Greška pri učitavanju podataka za ${city}.`;
  }
}

// Render: Vrijeme
function renderWeather(city, d){
  if (!d || !d.main){ weatherDiv.textContent="Podaci nisu dostupni."; return; }
  weatherDiv.innerHTML = `
    <p><b>${city}</b></p>
    <p>${d.weather?.[0]?.description || "-"}, ${Math.round(d.main.temp)}°C</p>
    <p>Vlažnost: ${d.main.humidity}% • Vjetar: ${d.wind?.speed ?? "-"} m/s</p>
  `;
}

// Render: Slike
function renderPhotos(d){
  const arr = d?.results || [];
  photoWrap.innerHTML = "";
  if (!arr.length){ photoWrap.innerHTML = `<p>Nema dostupnih slika.</p>`; return; }
  arr.slice(0,6).forEach(x=>{
    const im = new Image();
    im.src = x.urls.small; im.alt = x.alt_description || "photo";
    im.className="photo";
    photoWrap.appendChild(im);
  });
}

// Render: Znamenitosti (iz backenda već sažeto)
function renderAttractions(city, data){
  attrWrap.innerHTML = "";
  const list = data?.items || [];
  if (!list.length){ attrWrap.innerHTML = "<p>Nema podataka za znamenitosti.</p>"; return; }

  list.forEach(it=>{
    const div = document.createElement("div");
    div.className="attraction";
    div.innerHTML = `
      <h4>${it.name||"Nepoznato"}</h4>
      <p>${it.short||"Nema opisa."}</p>
      <small>${it.kind||""}</small>
    `;
    // klik → otvori rutu + AI opis
    div.addEventListener("click", async ()=>{
      speak(`Pokrećem navigaciju prema ${it.name}.`, "hr");
      openDirections(`${it.name}, ${city}`);
      // AI opis (server spaja OpenAI)
      try{
        const d = await j(`${API_BASE}/api/describe?name=${encodeURIComponent(it.name)}&city=${encodeURIComponent(city)}`);
        if (d?.speech) speak(d.speech, d.lang||"hr");
      }catch(_){}
    });
    attrWrap.appendChild(div);
  });
}

// Render: Alerts
function renderAlerts(d){
  const arr = d?.alerts || [];
  if (!arr.length){ notifBar.textContent = "ℹ️ Nema posebnih upozorenja."; return; }
  let i=0;
  notifBar.textContent = formatAlert(arr[0]);
  setInterval(()=>{
    i=(i+1)%arr.length;
    notifBar.textContent = formatAlert(arr[i]);
  },8000);
}
function formatAlert(a){
  const t=(a.type||"INFO").toUpperCase();
  if (t.includes("TRAFFIC")) return `🚗 ${a.message}`;
  if (t.includes("WEATHER")) return `☀️ ${a.message}`;
  if (t.includes("HAZARD")||t.includes("ALERT")) return `⚠️ ${a.message}`;
  return `ℹ️ ${a.message}`;
}

// Navigacija (Google Maps Directions)
function openDirections(dest){
  if (!dest) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  window.open(url, "_blank");
}

// Gumbi
searchBtn.addEventListener("click", ()=> searchAll(cityInput.value.trim()||"Split"));
cityInput.addEventListener("keydown", e=>{ if(e.key==="Enter") searchAll(cityInput.value.trim()||"Split"); });
navBtn.addEventListener("click", ()=>{
  const dest = cityInput.value.trim()||"Split";
  speak(`Otvaram navigaciju do ${dest}.`,"hr");
  openDirections(dest);
});

// Init
searchAll("Split");
// ticker auto-refresh (global + lokalno) – backend već vraća kombinirano
setInterval(()=> j(`${API_BASE}/api/alerts?city=${encodeURIComponent(cityInput.value.trim()||"Split")}`)
  .then(renderAlerts).catch(()=>{}), 60000);
