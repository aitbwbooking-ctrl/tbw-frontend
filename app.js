function startApp() {
  console.log("App started");

  document.getElementById("startBtn").style.display = "none";
  document.getElementById("chatBox").style.display = "block";
  document.getElementById("assistantInput").focus();
}

function sendMessage() {
  const input = document.getElementById("assistantInput");
  const msg = input.value.trim();
  if (!msg) return;

  const box = document.getElementById("messages");
  box.innerHTML += `<div class="user">🧑‍💼 ${msg}</div>`;
  input.value = "";

  // Simulacija AI odgovora
  setTimeout(() => {
    box.innerHTML += `<div class="bot">🤖 Hvala na pitanju, još nisam spojen na backend.</div>`;
  }, 700);
}
