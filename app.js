let BACKEND_URL = "https://tbw-backend.onrender.com"; // default (po potrebi će se prebrisati iz config.json)
let API_PATH = null; // auto-detekcija: /api/chat | /chat | /

async function loadConfig() {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.BACKEND_URL) BACKEND_URL = cfg.BACKEND_URL.replace(/\/+$/, "");
    }
  } catch (_) { /* ignore */ }
}

async function detectApiPath() {
  const candidates = ["/api/chat", "/chat", "/"];
  for (const path of candidates) {
    try {
      const test = await fetch(BACKEND_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "ping" }),
      });
      // mora biti 200 i JSON
      const ct = test.headers.get("content-type") || "";
      if (test.ok && ct.includes("application/json")) {
        const js = await test.json().catch(() => null);
        if (js && (js.reply !== undefined || js.ok !== undefined)) {
          API_PATH = path;
          console.log("API path:", API_PATH);
          return;
        }
      }
    } catch (_) { /* try next */ }
  }
  throw new Error("Nije pronađen valjan API path na backendu.");
}

function appendMsg(cls, text) {
  const box = document.getElementById("messages");
  box.innerHTML += `<div class="${cls}">${text}</div>`;
  box.scrollTop = box.scrollHeight;
}

async function ensureApiReady() {
  if (API_PATH) return;
  await loadConfig();      // pročitaj config.json ako postoji
  await detectApiPath();   // otkrij točan endpoint
}

function startApp() {
  console.log("App started");
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("chatBox").style.display = "block";
  document.getElementById("assistantInput").focus();

  // pokreni otkrivanje API-ja u pozadini da bude spreman prije prve poruke
  ensureApiReady().catch(err => {
    console.error(err);
    appendMsg("bot", "⚠️ Backend nije spreman. Pokušaj opet za par sekundi.");
  });
}

async function sendMessage() {
  const input = document.getElementById("assistantInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendMsg("user", `🧍 ${msg}`);
  input.value = "";

  try {
    await ensureApiReady();

    const res = await fetch(BACKEND_URL + API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });

    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(`Backend ${res.status}`);

    if (!ct.includes("application/json")) {
      // dobili smo HTML → nije valjan odgovor
      const txt = await res.text();
      console.warn("Non-JSON response:", txt.slice(0, 200));
      throw new Error("Backend vratio ne-JSON odgovor.");
    }

    const data = await res.json();
    const reply = data.reply ?? data.text ?? "ℹ️ Backend nije vratio 'reply'.";
    appendMsg("bot", `🤖 ${reply}`);
  } catch (err) {
    console.error("Greška:", err);
    appendMsg("bot", "⚠️ Greška pri spajanju na backend. Pokušaj osvježiti (Ctrl+Shift+R).");
  }
}
