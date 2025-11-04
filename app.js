// Play intro sound on load
window.addEventListener("load", () => {
  const audio = new Audio("/assets/sounds/intro.mp3");
  audio.volume = 0.4;
  audio.play().catch(() => console.log("Autoplay blocked — user must tap screen first"));
});

// Main chat function (placeholder for AI)
async function sendMessage() {
  const input = document.getElementById("userInput").value;
  if (!input) return;

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML += `<div class="user">👤 ${input}</div>`;

  // Fake AI reply for now
  setTimeout(() => {
    chatBox.innerHTML += `<div class="ai">🤖 Hello! AI responding soon...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);

  document.getElementById("userInput").value = "";
}
