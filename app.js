// Play intro sound automatically
window.addEventListener("load", () => {
    const audio = new Audio("./assets/sounds/intro.mp3");
    
    audio.volume = 0.6;
    
    // Play when user interacts (mobile browsers block autoplay)
    const tryPlay = () => {
        audio.play().catch(() => {});
        document.removeEventListener("click", tryPlay);
        document.removeEventListener("touchstart", tryPlay);
    };

    audio.play().catch(() => {
        document.addEventListener("click", tryPlay);
        document.addEventListener("touchstart", tryPlay);
    });
});

// Register service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(reg => console.log("✅ Service Worker registered:", reg.scope))
            .catch(err => console.log("❌ Service Worker error:", err));
    });
}
