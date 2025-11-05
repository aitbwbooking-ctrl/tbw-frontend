const API_URL = "https://tbw-backend.onrender.com/api/chat";

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
    box.innerHTML += `<div class="user">${msg}</div>`;
    input.value = "";

    // Show loading bubble
    const loadingId = `load_${Date.now()}`;
    box.innerHTML += `<div class="bot" id="${loadingId}"><span>⏳ Thinking...</span></div>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg }),
        });

        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            document.getElementById(loadingId).innerHTML =
                "⚠️ Backend waking up... try again in 5s ⏱️";
            return;
        }

        const reply = data.reply || "⚠️ No AI reply.";
        document.getElementById(loadingId).innerHTML = reply;

    } catch (error) {
        document.getElementById(loadingId).innerHTML =
            "❌ Connection error. Server sleeping or offline.";
    }
}
