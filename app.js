const API = "https://tbw-backend.onrender.com";

window.onload = () => {
  document.getElementById("introSound").play().catch(()=>{});
  document.getElementById("cityInput").value = "Split";
  loadDashboard();
};

async function loadDashboard() {
  const city = document.getElementById("cityInput").value;

  // health badge
  try {
    const ok = await fetch(`${API}/api/health`);
    document.getElementById("statusBadge").style.color =
      ok.ok ? "lime" : "red";
  } catch {
    document.getElementById("statusBadge").style.color = "red";
  }

  // WEATHER
  const w = await (await fetch(`${API}/api/weather?city=${city}`)).json();
  document.getElementById("weatherBox").innerHTML =
    `<b>${city}</b><br>${Math.round(w.main.temp)}°C, ${w.weather[0].description}`;

  // PHOTOS
  const ph = await (await fetch(`${API}/api/photos?q=${city}`)).json();
  const photos = document.getElementById("photos");
  photos.innerHTML = "";
  ph.results.slice(0,6).forEach(p=>{
    const img = document.createElement("img");
    img.src = p.urls.small;
    photos.appendChild(img);
  });

  // POI + MAP
  const poi = await (await fetch(`${API}/api/poi?city=${city}`)).json();
  const list = document.getElementById("poiList");
  list.innerHTML = "";
  let coords = [];

  poi.items.forEach(p=>{
    const li = document.createElement("li");
    li.innerHTML = `<b>${p.name}</b><br><small>${p.short}</small>`;
    list.appendChild(li);

    if(p.lat && p.lon) coords.push([p.lat,p.lon]);
  });

  // map
  if(!window.map) {
    window.map = L.map('map').setView(coords[0] || [44,16], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  }
  coords.forEach(c => L.marker(c).addTo(map));
}

// CHAT
async function sendMessage() {
  const input = document.getElementById("assistantInput");
  const msg = input.value.trim();
  if(!msg) return;

  const box = document.getElementById("messages");
  box.innerHTML += `<div class="msg">👤 ${msg}</div>`;

  const r = await fetch(`${API}/api/chat`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message:msg})
  });
  const j = await r.json();

  box.innerHTML += `<div class="msg bot">🤖 ${j.reply}</div>`;
  input.value = "";
}
