// ===== TBW FRONTEND =====
let CFG = { API_BASE_URL: "", MAPS_API_KEY: "" };
let GOOGLE_READY = false;
let maps = { map:null, mini:null, traffic:null, sv:null, directions:null, renderer:null };
let currentCity = "Split";

// Shortcuts
const $ = (s)=>document.querySelector(s);
const el = (t,c,txt)=>{ const n=document.createElement(t); if(c)n.className=c; if(txt)n.textContent=txt; return n; };

// Load config + Maps
async function loadConfig(){ const r=await fetch("/config.json",{cache:"no-cache"}); CFG=await r.json(); }
function appendGoogleMapsScript(){ return new Promise((res,rej)=>{ if(GOOGLE_READY) return res(); const s=document.createElement("script"); s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CFG.MAPS_API_KEY)}&libraries=places`; s.async=true; s.onload=()=>{GOOGLE_READY=true;res();}; s.onerror=rej; document.head.appendChild(s); }); }

// Intro + init
window.addEventListener("DOMContentLoaded", async ()=>{
  const intro=$("#introOverlay"), audio=$("#introAudio"), skip=$("#skipIntro");
  try{ audio.play().catch(()=>{});}catch{}
  const hide=()=>{ intro.classList.remove("is-visible"); try{audio.pause();}catch{} };
  skip.addEventListener("click", hide); setTimeout(hide, 5000);

  await loadConfig(); registerSW(); bindUI(); pingBackend();
  await appendGoogleMapsScript(); initMaps();
  loadDashboard(currentCity);
});

function registerSW(){ if('serviceWorker' in navigator) try{navigator.serviceWorker.register('/sw.js');}catch{} }

function bindUI(){
  $("#askBtn").addEventListener("click", ()=>{ const v=$("#cityInput").value.trim(); if(v){currentCity=v; loadDashboard(v);} });
  $("#sendBtn").addEventListener("click", sendMessage);
  $("#routeBtn").addEventListener("click", makeRoute);
}

async function pingBackend(){
  try{ const r=await fetch(`${CFG.API_BASE_URL}/api/health`); $("#backendDot").style.background = r.ok ? "#44d17a" : "#ff6262"; }
  catch{ $("#backendDot").style.background="#ff6262"; }
}

// Maps init
function initMaps(){
  const SPLIT={lat:43.5081,lng:16.4402};

  maps.map = new google.maps.Map($("#navMap"), { center:SPLIT, zoom:12, mapId:"tbw-nav", disableDefaultUI:false });
  new google.maps.Marker({ map:maps.map, position:SPLIT, title:"Split" });

  maps.mini = new google.maps.Map($("#miniMap"), { center:SPLIT, zoom:11, mapTypeId:"roadmap" });

  maps.traffic = new google.maps.Map($("#trafficMap"), { center:SPLIT, zoom:11 });
  new google.maps.TrafficLayer().setMap(maps.traffic);

  maps.sv = new google.maps.StreetViewPanorama($("#streetView"), { position:SPLIT, pov:{heading:34,pitch:0}, zoom:0 });
  maps.map.setStreetView(maps.sv);

  maps.directions = new google.maps.DirectionsService();
  maps.renderer   = new google.maps.DirectionsRenderer({ map: maps.map });
}

function makeRoute(){
  const A=$("#routeFrom").value.trim(), B=$("#routeTo").value.trim();
  if(!B) return alert("Unesi odredište");
  maps.directions.route({ origin:A||currentCity, destination:B, travelMode:google.maps.TravelMode.DRIVING },
    (res,status)=>{ if(status==="OK") maps.renderer.setDirections(res); else alert("Ruta nije dostupna."); });
}

// Dashboard
async function loadDashboard(city){
  $("#cityInput").value = city;

  // Alerts (PRO)
  await loadAlerts(city);

  // Weather
  try{
    const w = await (await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`)).json();
    $("#weatherBox").innerHTML = `
      <div style="display:flex; align-items:center; gap:14px;">
        <div style="font-size:42px">🌧️</div>
        <div>
          <div style="font-weight:700; font-size:18px">${city}</div>
          <div style="opacity:.8">${Math.round(w.main?.temp||0)}°C, ${w.weather?.[0]?.description||""}</div>
        </div>
      </div>`;
    // Sea (derived)
    $("#seaBox").innerHTML = `<div style="display:flex; gap:12px; align-items:center;"><div style="font-size:32px">🌊</div><div><div style="font-weight:700">${city} • Stanje mora</div><div style="opacity:.8">Vlažnost ${w.main?.humidity??"—"}%</div></div></div>`;
  }catch{ $("#weatherBox").textContent="Greška vremena"; }

  // Photos (under StreetView)
  try{
    const p = await (await fetch(`${CFG.API_BASE_URL}/api/photos?q=${encodeURIComponent(city)}`)).json();
    const wrap = el("div","row");
    (p.results||[]).slice(0,6).forEach(ph=>{
      const img=new Image(); img.src=ph.urls.small; img.alt=city; img.loading="lazy";
      img.style.width="30%"; img.style.borderRadius="10px"; img.style.border="1px solid rgba(255,255,255,.12)";
      wrap.appendChild(img);
    });
    $("#streetView").after(wrap);
  }catch{}

  // POI
  try{
    const d = await (await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(city)}`)).json();
    $("#poiBox").innerHTML = "";
    (d.items||[]).forEach(p=>{
      const row=el("div","row");
      row.appendChild(el("div",null,`• ${p.name}`));
      const s=el("div",null,(p.short||"")); s.style.opacity=.75; s.style.fontSize="12px";
      row.appendChild(s);
      row.addEventListener("click",()=>{ maps.sv.setPosition({lat:p.lat,lng:p.lon}); maps.mini.panTo({lat:p.lat,lng:p.lon}); });
      $("#poiBox").appendChild(row);
    });
  }catch{ $("#poiBox").textContent="Znamenitosti nedostupne."; }
}

// ALERTS PRO
async function loadAlerts(city){
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`);
    const d = await r.json();
    if(!d.alerts?.length){ $("#alertsTicker").textContent="Nema aktivnih upozorenja."; return; }

    $("#alertsTicker").innerHTML = d.alerts.map(a=>{
      const icon = getAlertIcon(a.type);
      return `<span class="alert-icon">${icon}</span>${a.message}`;
    }).join(" • ");

    const lvl = getAlertLevel(d.alerts);
    document.querySelector(".topbar").className = `topbar ${lvl}`;

    checkNewAlert(d.alerts);
    localStorage.setItem("lastAlerts", JSON.stringify(d.alerts));
  }catch{
    const cached = localStorage.getItem("lastAlerts");
    if (cached){
      const arr = JSON.parse(cached);
      $("#alertsTicker").innerHTML = arr.map(a=>a.message).join(" • ");
    }else{
      $("#alertsTicker").textContent = "⚠️ Offline upozorenja nedostupna";
    }
  }
}
function getAlertIcon(type){
  return ({weather:"⛈️",hazard:"🚨",traffic:"🚗",sea:"🌊",fire:"🔥",quake:"🌍"}[type]||"⚠️");
}
function getAlertLevel(alerts){
  if(alerts.some(a=>a.severity==="extreme")) return "alert-critical";
  if(alerts.some(a=>a.severity==="high"))    return "alert-high";
  if(alerts.some(a=>a.severity==="medium"))  return "alert-medium";
  return "alert-low";
}
let lastAlertMsg="";
function checkNewAlert(alerts){
  const latest = alerts[0]?.message;
  if(!latest || latest===lastAlertMsg) return;
  lastAlertMsg = latest;

  const audio=$("#alertSound"); audio.volume=.95; audio.play().catch(()=>{});
  if(navigator.vibrate) navigator.vibrate([200,100,200]);

  $("#alertText").textContent = latest;
  $("#alertModal").classList.add("show");
}
function closeAlert(){ $("#alertModal").classList.remove("show"); }

// Chat
async function sendMessage(){
  const input=$("#assistantInput"); const msg=input.value.trim(); if(!msg) return;
  input.value=""; const box=$("#messages");
  box.appendChild(el("div","user",msg));
  try{
    const r = await fetch(`${CFG.API_BASE_URL}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg})});
    const d = await r.json().catch(()=>({reply:"OK"}));
    box.appendChild(el("div","bot", d.reply || d.speech || "OK"));
  }catch{ box.appendChild(el("div","bot","Backend nedostupan.")); }
}
