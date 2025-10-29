console.log("TBW FINAL WEB loaded");

async function init() {
  const appName = "Split";
  const API_BASE = "https://tbw-backend.onrender.com";

  console.log("API base:", API_BASE);
  console.log("Učitavam podatke za:", appName);

  const weatherEl = document.getElementById("weather");
  const photosEl = document.getElementById("photos");
  const trafficEl = document.getElementById("traffic");
  const alertsEl = document.getElementById("alerts");

  try {
    // Vrijeme
    const weatherRes = await fetch(`${API_BASE}/api/weather?city=${appName}`);
    const weather = await weatherRes.json();
    console.log("Vrijeme:", weather);

    if (weather.main) {
      weatherEl.innerHTML = `
        <h2>☀️ Vrijeme</h2>
        <p><b>${weather.name}</b>: ${weather.weather[0].description}, ${weather.main.temp}°C</p>
        <p>Vlažnost: ${weather.main.humidity}% | Vjetar: ${weather.wind.speed} m/s</p>
      `;
    } else {
      weatherEl.innerHTML = `<p>Nema podataka o vremenu.</p>`;
    }

    // Slike
    const photoRes = await fetch(`${API_BASE}/api/photos?q=${appName}`);
    const photos = await photoRes.json();
    console.log("Slike:", photos);

    if (photos.results && photos.results.length > 0) {
      photosEl.innerHTML = `<h2>📸 Slike</h2>`;
      photos.results.slice(0, 3).forEach(p => {
        photosEl.innerHTML += `<img class="photo" src="${p.urls.small}" alt="${p.alt_description}" />`;
      });
    } else {
      photosEl.innerHTML = `<p>Nema dostupnih slika.</p>`;
    }

    // Promet
    const trafficRes = await fetch(`${API_BASE}/api/traffic?city=${appName}`);
    const traffic = await trafficRes.json();
    console.log("Promet:", traffic);

    trafficEl.innerHTML = `
      <h2>🚦 Promet</h2>
      <p>Status: ${traffic.status}</p>
      <p>Zadnja provjera: ${new Date(traffic.last_update).toLocaleTimeString()}</p>
    `;

    // Upozorenja
    const alertRes = await fetch(`${API_BASE}/api/alerts?city=${appName}`);
    const alerts = await alertRes.json();
    console.log("Upozorenja:", alerts);

    if (alerts.alerts && alerts.alerts.length > 0) {
      alertsEl.innerHTML = `<h2>⚠️ Upozorenja</h2>`;
      alerts.alerts.forEach(a => {
        alertsEl.innerHTML += `<p><b>${a.type.toUpperCase()}</b>: ${a.message}</p>`;
      });
    } else {
      alertsEl.innerHTML = `<p>Nema aktivnih upozorenja.</p>`;
    }

  } catch (err) {
    console.error("Greška pri dohvaćanju:", err);
  }
}

init();
