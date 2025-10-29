console.log("TBW FINAL WEB loaded");

// API baza - povezana s Render backendom
const API_BASE_URL = "https://tbw-backend.onrender.com";

const splash = document.querySelector("#app");

async function init() {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.8,
  }));

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    grad.addColorStop(0, "rgb(255,255,255)");
    grad.addColorStop(1, "rgb(20,20,40)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#aaddff";
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }

  loop();

  // Nakon animacije, pokreni glavni sadržaj
  setTimeout(() => splash.classList.add("fade-out"), 2000);
  setTimeout(() => splash.remove(), 3000);

  // Primjer učitavanja podataka iz backenda
  loadCityData("Split");
}

async function loadCityData(city) {
  try {
    const [weather, photos, traffic, alerts] = await Promise.all([
      fetch(`${API_BASE_URL}/api/weather?city=${city}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/photos?q=${city}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/traffic?city=${city}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/alerts?city=${city}`).then((r) => r.json()),
    ]);

    console.log("🌦️ Weather:", weather);
    console.log("📸 Photos:", photos);
    console.log("🚗 Traffic:", traffic);
    console.log("⚠️ Alerts:", alerts);
  } catch (err) {
    console.error("Greška pri dohvaćanju podataka:", err);
  }
}

// Pokretanje aplikacije
init();
