const API = "https://tbw-backend.vercel.app";

document.getElementById("backendStatus").innerText = "Backend: provjera...";

// Provjera backenda
fetch(API + "/")
    .then(res => {
        document.getElementById("backendStatus").innerText = "Backend: ONLINE";
    })
    .catch(() => {
        document.getElementById("backendStatus").innerText = "Backend: OFFLINE";
    });

// Event search
document.getElementById("searchBtn").onclick = () => {
    const city = document.getElementById("search").value.trim();

    if (!city) return;

    loadWeather(city);
    loadTraffic(city);
    loadSea(city);
    loadFlights(city);
};

// FUNCTIONS

function loadWeather(city) {
    fetch(`${API}/tbw?route=weather&city=${city}`)
        .then(r => r.json())
        .then(d => {
            document.getElementById("weather").innerHTML = `
                <p>${city}</p>
                <p>${d.temp}°C</p>
                <p>${d.description}</p>
            `;
        })
        .catch(() => {
            document.getElementById("weather").innerHTML = "Greška";
        });
}

function loadTraffic(city) {
    fetch(`${API}/tbw?route=traffic&city=${city}`)
        .then(r => r.json())
        .then(d => {
            document.getElementById("traffic").innerHTML = `
                <p>Status: ${d.status}</p>
                <p>Brzina: ${d.speed}</p>
            `;
        })
        .catch(() => {
            document.getElementById("traffic").innerHTML = "Greška";
        });
}

function loadSea(city) {
    fetch(`${API}/tbw?route=sea&city=${city}`)
        .then(r => r.json())
        .then(d => {
            document.getElementById("sea").innerHTML = `
                <p>Temp mora: ${d.sea_temp}°C</p>
            `;
        })
        .catch(() => {
            document.getElementById("sea").innerHTML = "Greška";
        });
}

function loadFlights(city) {
    fetch(`${API}/tbw?route=airport&city=${city}`)
        .then(r => r.json())
        .then(d => {
            document.getElementById("flights").innerHTML = `
                <p>Letovi: ${d.status}</p>
            `;
        })
        .catch(() => {
            document.getElementById("flights").innerHTML = "Greška";
        });
}
