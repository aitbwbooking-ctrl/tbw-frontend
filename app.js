// ============================================
// TBW FRONTEND – APP LOGIC
// ============================================

const API_BASE = "https://tbw-backend.vercel.app/api/tbw";

// ---------- API helper ----------
async function callApi(route, extraParams = {}) {
    try {
        const url = new URL(API_BASE);
        url.searchParams.set("route", route);
        Object.entries(extraParams).forEach(([k, v]) =>
            url.searchParams.set(k, v)
        );

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("HTTP " + res.status);
        return await res.json();
    } catch (err) {
        console.error("API error:", route, err);
        return { ok: false, error: err.message };
    }
}

// ============================================
// INTRO (kratki fade + zvuk kometa)
// ============================================
const introOverlay = document.getElementById("introOverlay");
const introCanvas = document.getElementById("introCanvas");
const introAudio = document.getElementById("introAudio");
const skipIntroBtn = document.getElementById("skipIntro");

function runIntro() {
    if (!introOverlay || !introCanvas) return;

    const ctx = introCanvas.getContext("2d");
    let w = (introCanvas.width = introCanvas.clientWidth || 600);
    let h = (introCanvas.height = introCanvas.clientHeight || 300);

    const stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        s: Math.random() * 0.5 + 0.2
    }));

    let comet = { x: -40, y: h * 0.4, vx: 4, vy: 0.6 };

    let startTime = null;

    function frame(t) {
        if (!startTime) startTime = t;
        const dt = t - startTime;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        // stars
        ctx.fillStyle = "#fff";
        for (const s of stars) {
            s.x -= s.s;
            if (s.x < 0) s.x = w;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // comet
        comet.x += comet.vx;
        comet.y += comet.vy;

        const grad = ctx.createRadialGradient(
            comet.x,
            comet.y,
            0,
            comet.x,
            comet.y,
            40
        );
        grad.addColorStop(0, "#ffe082");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 12, 0, Math.PI * 2);
        ctx.fill();

        if (dt < 4500) {
            requestAnimationFrame(frame);
        } else {
            introOverlay.style.opacity = "0";
            setTimeout(() => {
                introOverlay.style.display = "none";
            }, 600);
        }
    }

    if (introAudio) {
        introAudio.currentTime = 0;
        introAudio.play().catch(() => {});
    }

    requestAnimationFrame(frame);

    if (skipIntroBtn) {
        skipIntroBtn.onclick = () => {
            introOverlay.style.opacity = "0";
            setTimeout(() => (introOverlay.style.display = "none"), 400);
            if (introAudio) introAudio.pause();
        };
    }
}

if (introOverlay) {
    // samo prvi put
    if (!localStorage.getItem("tbw_intro_seen")) {
        localStorage.setItem("tbw_intro_seen", "1");
        runIntro();
    } else {
        introOverlay.style.display = "none";
    }
}

// ============================================
// HR / EN – tekstovi
// ============================================

let currentLang = "hr";

const labels = {
    hr: {
        nav: "Navigacija",
        booking: "Rezervacija smještaja",
        street: "Street View",
        weather: "Vrijeme",
        traffic: "Promet uživo",
        sea: "Stanje mora",
        services: "Servisi",
        transit: "Javni prijevoz",
        airport: "Aerodromi & RDS alarmi",
        searchPlaceholder: "Pretraži (Split, apartmani…)",
        searchBtn: "Traži",
        tickerFallback: "Nema aktivnih upozorenja. Sretan put!"
    },
    en: {
        nav: "Navigation",
        booking: "Accommodation booking",
        street: "Street View",
        weather: "Weather",
        traffic: "Live traffic",
        sea: "Sea & ferries",
        services: "Services",
        transit: "Public transport",
        airport: "Airports & RDS alerts",
        searchPlaceholder: "Search (Split, apartments…)",
        searchBtn: "Search",
        tickerFallback: "No active alerts. Safe travels!"
    }
};

function applyLanguage(lang) {
    currentLang = lang;
    const txt = labels[lang];

    document.querySelector("#navCard h3").textContent = txt.nav;
    document.querySelector("#bookingCard h3").textContent = txt.booking;
    document.querySelector("#streetCard h3").textContent = txt.street;
    document.querySelector("#weatherCard h3").textContent = txt.weather;
    document.querySelector("#trafficCard h3").textContent = txt.traffic;
    document.querySelector("#seaCard h3").textContent = txt.sea;
    document.querySelector("#servicesCard h3").textContent = txt.services;
    document.querySelector("#transitCard h3").textContent = txt.transit;
    document.querySelector("#airportCard h3").textContent = txt.airport;

    const gs = document.getElementById("globalSearch");
    if (gs) gs.placeholder = txt.searchPlaceholder;

    const sb = document.getElementById("searchBtn");
    if (sb) sb.textContent = txt.searchBtn;

    document
        .querySelectorAll(".langSwitch")
        .forEach(btn => btn.classList.remove("active"));
    const activeBtn =
        lang === "hr" ? document.getElementById("langHR") : document.getElementById("langEN");
    if (activeBtn) activeBtn.classList.add("active");
}

// ============================================
// TICKER – ALERTS
// ============================================

const tickerContent = document.getElementById("tickerContent");

async function loadAlerts(city) {
    const data = await callApi("alerts", { city: city || "Split" });
    if (!tickerContent) return;

    if (data && data.alerts && data.alerts.length) {
        tickerContent.textContent = data.alerts
            .map(a => a.message || a)
            .join(" • ");
    } else {
        tickerContent.textContent = labels[currentLang].tickerFallback;
    }
}

// ============================================
// HELPER – grad iz searcha
// ============================================

function getCityFromInput() {
    const inp = document.getElementById("globalSearch");
    if (!inp || !inp.value.trim()) return "Split";
    return inp.value.trim();
}

// ============================================
// WEATHER
// ============================================

const weatherBox = document.getElementById("weatherBox");

async function loadWeather() {
    const city = getCityFromInput();
    const data = await callApi("weather", { city });

    if (!weatherBox) return;

    if (data && data.ok) {
        weatherBox.innerHTML = "";

        const temp = document.createElement("div");
        temp.textContent = `${data.temperature}°C`;

        const cond = document.createElement("div");
        cond.textContent = data.condition || "";

        // animacije
        const lower = (data.condition || "").toLowerCase();
        if (lower.includes("sun") || lower.includes("vedro")) {
            temp.classList.add("weather-sun");
        } else if (
            lower.includes("rain") ||
            lower.includes("kiša") ||
            lower.includes("drizzle")
        ) {
            temp.classList.add("weather-rain");
        } else if (lower.includes("snow") || lower.includes("snijeg")) {
            temp.classList.add("weather-snow");
        }

        const cityRow = document.createElement("div");
        cityRow.textContent = data.city || city;

        weatherBox.appendChild(cityRow);
        weatherBox.appendChild(temp);
        weatherBox.appendChild(cond);
    } else {
        weatherBox.textContent = "Greška pri dohvaćanju vremena.";
    }
}

// ============================================
// TRAFFIC
// ============================================

const trafficBox = document.getElementById("trafficBox");

async function loadTraffic() {
    const city = getCityFromInput();
    const data = await callApi("traffic", { city });

    if (!trafficBox) return;

    if (data && data.ok) {
        trafficBox.innerHTML = "";
        trafficBox.textContent = data.description || data.status || "Promet učitan.";
    } else {
        trafficBox.textContent = "Promet nedostupan.";
    }
}

// ============================================
// SEA
// ============================================

const seaBox = document.getElementById("seaBox");

async function loadSea() {
    const city = getCityFromInput();
    const data = await callApi("sea", { city });

    if (!seaBox) return;

    if (data && data.ok) {
        seaBox.innerHTML = "";
        const temp = document.createElement("div");
        temp.textContent = `More: ${data.temperature || "–"}°C`;
        const uv = document.createElement("div");
        uv.textContent = `UV: ${data.uv || "n/a"}`;
        const note = document.createElement("div");
        note.textContent = data.note || "";
        seaBox.appendChild(temp);
        seaBox.appendChild(uv);
        seaBox.appendChild(note);
    } else {
        seaBox.textContent = "More oko generalski stol. UV umjeren.";
    }
}

// ============================================
// SERVICES
// ============================================

const servicesBox = document.getElementById("servicesBox");

async function loadServices() {
    const city = getCityFromInput();
    const data = await callApi("services", { city });
    if (!servicesBox) return;

    if (data && data.ok && data.services) {
        servicesBox.innerHTML = "";
        data.services.forEach(s => {
            const div = document.createElement("div");
            div.textContent = `${s.name} – ${s.status}`;
            servicesBox.appendChild(div);
        });
    } else {
        servicesBox.textContent =
            "Konzum – otvoreno (zatvara 22:00)\nTommy – otvoreno (zatvara 21:00)";
    }
}

// ============================================
// TRANSIT
// ============================================

const transitBox = document.getElementById("transitBox");

async function loadTransit() {
    const city = getCityFromInput();
    const data = await callApi("transit", { city });
    if (!transitBox) return;

    if (data && data.ok) {
        transitBox.innerHTML = "";
        (data.lines || []).forEach(l => {
            const div = document.createElement("div");
            div.textContent = `${l.type} ${l.name} – ${l.next}`;
            transitBox.appendChild(div);
        });
        if (!data.lines || !data.lines.length) {
            transitBox.textContent = "Nema posebnih informacija o prijevozu.";
        }
    } else {
        transitBox.textContent = "Autobus 37: Split → Trogir u 12:22";
    }
}

// ============================================
// AIRPORT & RDS
// ============================================

const airportBox = document.getElementById("airportBox");

async function loadAirport() {
    const city = getCityFromInput();
    const data = await callApi("airport", { city });
    if (!airportBox) return;

    if (data && data.ok) {
        airportBox.innerHTML = "";
        if (data.flight) {
            const f = data.flight;
            airportBox.innerHTML =
                `${f.code || f.number || ""} ${f.from} → ${f.to}, ETA ${f.eta || f.arrival} (${f.status || "on time"})<br>` +
                (data.rds
                    ? `RDS: ${data.rds}`
                    : "RDS: nema posebnih upozorenja.");
        } else if (data.flights && data.flights.length) {
            const f = data.flights[0];
            airportBox.innerHTML =
                `${f.flight || f.code || ""} ${f.from} → ${f.to}, ETA ${f.eta || f.arrival} (${f.status || "on time"})`;
        } else {
            airportBox.textContent = "Nema informacija o letovima.";
        }
    } else {
        airportBox.textContent =
            "LH1412 Frankfurt → Zagreb – ETA 15:42 (on time)\nRDS: Požar u blizini Dugopolja — oprez!";
    }
}

// ============================================
// FULLSCREEN CARD LOGIKA
// ============================================

function openFullscreen(title, innerHtml) {
    const wrapper = document.createElement("div");
    wrapper.className = "fullscreenCard";
    wrapper.id = "fullscreenCard";

    const closeBtn = document.createElement("button");
    closeBtn.className = "fullscreenClose";
    closeBtn.textContent = "Zatvori";
    closeBtn.onclick = () => wrapper.remove();

    const h = document.createElement("h2");
    h.textContent = title;
    h.style.marginBottom = "12px";

    const content = document.createElement("div");
    content.innerHTML = innerHtml;

    wrapper.appendChild(closeBtn);
    wrapper.appendChild(h);
    wrapper.appendChild(content);
    document.body.appendChild(wrapper);
}

// Street View fullscreen
function openStreetViewFullscreen() {
    const city = getCityFromInput();
    const url =
        "https://www.google.com/maps?q=" +
        encodeURIComponent(city) +
        "&layer=c&cbll=0,0&cbp=12,0,0,0,0&output=embed";

    const html = `
        <div id="streetFSContainer">
            <iframe src="${url}" allowfullscreen loading="lazy"></iframe>
        </div>
    `;
    openFullscreen("Street View – " + city, html);
}

// Navigacija fullscreen (demo co-pilot)
function openNavFullscreen() {
    const html = `
        <p>Govorne komande primjer:</p>
        <ul>
            <li>"Hey TBW, vodi me do Zagreba"</li>
            <li>"Smanji/pojačaj strelicu za 20%"</li>
            <li>"Kako je stanje na cesti prema Splitu?"</li>
        </ul>
        <p style="margin-top:10px;font-size:14px;opacity:0.8;">
        TBW co-driver će koristiti iste glasovne postavke kao i glavni pretraživač (HR/EN).
        </p>
    `;
    openFullscreen(
        currentLang === "hr" ? "TBW Navigacija" : "TBW Navigation",
        html
    );
}

// ============================================
// BOOKING REDIRECT
// ============================================

const bookingCard = document.getElementById("bookingCard");

if (bookingCard) {
    bookingCard.addEventListener("click", () => {
        const city = getCityFromInput();
        const url =
            "https://www.booking.com/searchresults.html?ss=" +
            encodeURIComponent(city);
        window.open(url, "_blank");
    });
}

// ============================================
// CARD CLICK HANDLERS
// ============================================

const streetCard = document.getElementById("streetCard");
if (streetCard) streetCard.addEventListener("click", openStreetViewFullscreen);

const navCard = document.getElementById("navCard");
if (navCard) navCard.addEventListener("click", openNavFullscreen);

// ============================================
// NAVIGACIJA STATUS + GUMBI
// ============================================

const navStatus = document.getElementById("navStatus");
const startNavBtn = document.getElementById("startNav");
const stopNavBtn = document.getElementById("stopNav");

if (startNavBtn) {
    startNavBtn.addEventListener("click", evt => {
        evt.stopPropagation();
        const city = getCityFromInput();
        if (navStatus)
            navStatus.textContent =
                "Ruta aktivna – vodi prema: " + city + ".";
    });
}

if (stopNavBtn) {
    stopNavBtn.addEventListener("click", evt => {
        evt.stopPropagation();
        if (navStatus) navStatus.textContent = "Nema aktivne rute";
    });
}

// ============================================
// VOICE (SpeechRecognition + TTS)
// ============================================

let recognition = null;
let isListening = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SR =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "hr-HR";

    recognition.onend = () => {
        isListening = false;
    };
}

function setRecognitionLang() {
    if (!recognition) return;
    recognition.lang = currentLang === "hr" ? "hr-HR" : "en-US";
}

function speak(text) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = currentLang === "hr" ? "hr-HR" : "en-US";
    window.speechSynthesis.speak(u);
}

function startMicFor(inputEl, mode = "search") {
    if (!recognition) {
        alert("Govorno prepoznavanje nije podržano u ovom pregledniku.");
        return;
    }
    if (isListening) return;
    isListening = true;
    setRecognitionLang();

    recognition.onresult = e => {
        const text = e.results[0][0].transcript;
        if (mode === "search") {
            inputEl.value = text;
            runAll();
        } else if (mode === "assistant") {
            handleVoiceCommand(text);
        }
    };

    try {
        recognition.start();
    } catch (e) {
        isListening = false;
        console.warn("Recognition already started.");
    }
}

// Globalni mic (gore desno): co-driver
const topMic = document.getElementById("micBtn");
if (topMic) {
    topMic.addEventListener("click", () => {
        startMicFor(document.getElementById("globalSearch"), "assistant");
    });
}

// Voice button uz search input: samo search
const voiceBtn = document.getElementById("voiceBtn");
if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
        startMicFor(document.getElementById("globalSearch"), "search");
    });
}

// Interpretacija glasovnih komandi
function handleVoiceCommand(spoken) {
    const text = spoken.toLowerCase();
    console.log("Voice cmd:", text);

    // "hey tbw" trigger – nije nužno, ali simuliramo
    const cleaned = text.replace("hej tbw", "").replace("hey tbw", "").trim();

    const city = getCityFromInput();

    // Jednostavni primjeri:
    if (
        cleaned.includes("vrijeme") ||
        cleaned.includes("weather")
    ) {
        loadWeather().then(() => {
            const msg =
                currentLang === "hr"
                    ? `Trenutno vrijeme za ${city} učitano na ekranu.`
                    : `Current weather for ${city} is now on screen.`;
            speak(msg);
        });
        return;
    }

    if (cleaned.includes("promet") || cleaned.includes("traffic")) {
        loadTraffic().then(() => {
            const msg =
                currentLang === "hr"
                    ? `Promet prema destinaciji je osvježen.`
                    : `Traffic has been refreshed.`;
            speak(msg);
        });
        return;
    }

    if (cleaned.includes("navigacij") || cleaned.includes("navigate")) {
        if (navStatus)
            navStatus.textContent =
                currentLang === "hr"
                    ? `Ruta aktivna – vodi prema: ${city}.`
                    : `Route active – heading to ${city}.`;
        const msg =
            currentLang === "hr"
                ? `Pokrećem rutu prema ${city}.`
                : `Starting route to ${city}.`;
        speak(msg);
        return;
    }

    if (
        cleaned.includes("povećaj strelicu") ||
        cleaned.includes("increase arrow")
    ) {
        const msg =
            currentLang === "hr"
                ? "OK, povećavam pokazivač za 20%."
                : "OK, increasing the arrow size by 20%.";
        speak(msg);
        return;
    }

    // fallback: samo postavi u search
    const input = document.getElementById("globalSearch");
    if (input) input.value = spoken;
    runAll();
}

// ============================================
// LANGUAGE SWITCH BUTTONS
// ============================================

const langHRBtn = document.getElementById("langHR");
const langENBtn = document.getElementById("langEN");

if (langHRBtn) langHRBtn.addEventListener("click", () => applyLanguage("hr"));
if (langENBtn) langENBtn.addEventListener("click", () => applyLanguage("en"));

// ============================================
// SEARCH GUMB – REFRESH SVE
// ============================================

const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
    searchBtn.addEventListener("click", () => runAll());
}

// ============================================
// GLAVNA FUNKCIJA – Učitaj sve widgete
// ============================================

function runAll() {
    const city = getCityFromInput();
    loadAlerts(city);
    loadWeather();
    loadTraffic();
    loadSea();
    loadServices();
    loadTransit();
    loadAirport();
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    applyLanguage("hr");
    runAll();
});
