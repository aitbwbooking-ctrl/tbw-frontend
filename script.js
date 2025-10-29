console.log("TBW FINAL WEB loaded");

let API_BASE = "";

async function loadConfig() {
  try {
    const res = await fetch("config.json");
    const data = await res.json();
    API_BASE = data.API_BASE_URL || "https://tbw-backend.onrender.com";
    console.log("✅ API base:", API_BASE);
    init();
  } catch (err) {
    console.error("❌ Greška pri učitavanju config.json:", err);
  }
}

async function init() {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const stars = Array.from({ length: 200 }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2,
  }));

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();

  await loadCityData("Split");
}

async function loadCityData(city) {
  try {
    console.log("🌆 Učitavam podatke za:", city);

    const weather = await fetchJson(`${API_BASE}/api/weather?city=${city}`);
    const photos = await fetchJson(`${API_BASE}/api/photos?q=${city}`);
    const traffic = await fetchJson(`${API_BASE}/api/traffic?city=${city}`);
    const alerts = await fetchJson(`${API_BASE}/api/alerts?city=${city}`);

    console.log("☀️ Vrijeme:", weather);
    console.log("📸 Slike:", photos);
    console.log("🚦 Promet:", traffic);
    console.log("⚠️ Upozorenja:", alerts);
  } catch (err) {
    console.error("❌ Greška pri dohvaćanju podataka:", err);
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return await res.json();
}

loadConfig();
