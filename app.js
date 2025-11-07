// ====== CONFIG ======
const CONFIG = {
  BACKEND: "https://tbw-backend.onrender.com", // promijeni ako treba
  defaultCity: "Split",
};

// ====== INIT ======
let deferredPrompt = null;
const intro = document.getElementById("intro");
const bgm = document.getElementById("bgm");
const soundBtn = document.getElementById("soundBtn");
const installBtn = document.getElementById("installBtn");

window.addEventListener("load", () => {
  // start intro (5s fade je u CSS-u)
  setTimeout(() => { intro.style.display = "none"; }, 5200);

  // Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(console.warn);
  }

  // PWA install
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    installBtn.hidden = true;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  });

  // Sound toggle (autoplay policy: kreće tek nakon interakcije)
  soundBtn.addEventListener("click", () => {
    if (bgm.paused) { bgm.volume = 0.35; bgm.play().catch(()=>{}); soundBtn.textContent = "Zvuk: ON"; }
    else { bgm.pause(); soundBtn.textContent = "Zvuk: OFF"; }
  });

  // UI hooks
  document.getElementById("searchBtn").addEventListener("click", () => {
    const val = document.getElementById("cityInput").value.trim() || CONFIG.defaultCity;
    loadDashboard(val);
  });

  // enter to search
  document.getElementById("cityInput").addEventListener("keydown",(e)=>{
    if(e.key==="Enter"){ e.preventDefault(); document.getElementById("searchBtn").click(); }
  });

  // init
  loadDashboard(CONFIG.defaultCity);
});

// ====== DASHBOARD LOADER ======
async function loadDashboard(city){
  document.getElementById("cityName").textContent = city;
  document.getElementById("bk-city").value = city;

  // Navigacija karta (OpenStreetMap static)
  const nav = document.getElementById("navMap");
  nav.innerHTML = `<img alt="mapa" style="width:100%;height:100%;object-fit:cover;opacity:.95"
    src="https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(city)}&zoom=13&size=640x360&maptype=mapnik&markers=${encodeURIComponent(city)},lightblue1" />`;

  // POI mini karta (druga pozicija)
  const poi = document.getElementById("poiMap");
  poi.innerHTML = `<img alt="poi" style="width:100%;height:100%;object-fit:cover;opacity:.95"
    src="https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(city)}&zoom=12&size=640x320&maptype=mapnik&markers=${encodeURIComponent(city)},red" />`;

  // Street photo (Unsplash preko backenda)
  try{
    const p = await fetch(`${CONFIG.BACKEND}/api/photos?q=${encodeURIComponent(city)}`);
    const pdata = await p.json();
    const first = pdata?.results?.[0]?.urls?.regular;
    document.getElementById("streetImg").src = first || "assets/TBW.png";
  }catch(_){ document.getElementById("streetImg").src = "assets/TBW.png"; }

  // Sea thumb (druga fotka)
  try{
    const p = await fetch(`${CONFIG.BACKEND}/api/photos?q=${encodeURIComponent(city+" sea")}`);
    const pdata = await p.json();
    const img = pdata?.results?.[1]?.urls?.small;
    document.getElementById("seaImg").src = img || "assets/TBW.png";
  }catch(_){ document.getElementById("seaImg").src = "assets/TBW.png"; }

  // Vrijeme
  try{
    const r = await fetch(`${CONFIG.BACKEND}/api/weather?city=${encodeURIComponent(city)}`);
    const w = await r.json();
    const t = Math.round(w?.main?.temp ?? 0);
    const desc = w?.weather?.[0]?.description ?? "";
    document.getElementById("wTemp").textContent = t;
    document.getElementById("wDesc").textContent = desc;
    document.getElementById("wCity").textContent = (w?.name || city) + ", " + (w?.sys?.country || "");
  }catch(_){
    document.getElementById("wTemp").textContent = "—";
    document.getElementById("wDesc").textContent = "Nije dostupno";
    document.getElementById("wCity").textContent = city;
  }

  // Promet (demo iz backenda)
  try{
    const r = await fetch(`${CONFIG.BACKEND}/api/traffic`);
    const d = await r.json();
    document.getElementById("trafficStatus").textContent = d.status;
    document.getElementById("trafficTime").textContent = new Date(d.last_update).toLocaleTimeString("hr-HR");
  }catch(_){}

  // (Opcija) opis znamenitosti – kada kliknemo kasnije na POI (ostavljeno spremno)
}

// ====== Booking (demo) ======
document.getElementById("bookingForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  alert("Rezervacijski upit poslan! (demo)");
});
