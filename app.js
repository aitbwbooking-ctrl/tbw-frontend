const API_URL = "https://tbw-backend.onrender.com/";

function startApp() {
    console.log("App started");
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("chatBox").style.display = "block";
    document.getElementById("assistantInput").focus();
}

async function sendMessage() {
    const input = document.getElementById("assistantInput");
    const msg = input.value.trim();
    if (!msg) return;

    const box = document.getElementById("messages");
    box.innerHTML += `<div class="user">🧍 ${msg}</div>`;
    input.value = "";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg }),
        });

        const data = await response.json();
        const reply = data.reply || "⚠️ Nema odgovora od backend-a.";

        box.innerHTML += `<div class="bot">🤖 ${reply}</div>`;

    } catch (error) {
        console.error("Greška:", error);
        box.innerHTML += `<div class="bot">⚠️ Greška! Backend nije dostupan.</div>`;
    }

    box.scrollTop = box.scrollHeight;
}
