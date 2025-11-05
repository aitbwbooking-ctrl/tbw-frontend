const API_URL = "https://tbw-backend.onrender.com/api/chat";

async function sendMessage() {
  const input = document.getElementById("assistantInput");
  const msg = input.value.trim();
  if (!msg) return;

  const box = document.getElementById("messages");
  box.innerHTML += `<div class="user">🧑 ${msg}</div>`;
  input.value = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    let reply;
    try {
      reply = await response.json();
    } catch {
      box.innerHTML += `<div class="bot">⚠️ Backend waking up... try again in 5s</div>`;
      return;
    }

    box.innerHTML += `<div class="bot">🤖 ${reply.reply}</div>`;

  } catch (err) {
    box.innerHTML += `<div class="bot">❌ Server offline. Try again later.</div>`;
  }
}

function startApp() {
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("chatBox").style.display = "block";
  document.getElementById("assistantInput").focus();
}
