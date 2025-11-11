/* ===== TBW APEX INTRO (2+4+3 hybrid) ===== */
(function () {
  const INTRO_ID = "tbw-intro";
  const el = document.getElementById(INTRO_ID);
  if (!el) return;

  // ne puštaj često – prikaz jednom u 24h (osim ako dodaš ?intro=1)
  try {
    const force = new URLSearchParams(location.search).get("intro") === "1";
    const seen = JSON.parse(localStorage.getItem("tbw_intro_seen") || "null");
    const now = Date.now();
    if (!force && seen && now - seen < 24 * 60 * 60 * 1000) {
      el.classList.add("hidden");
      return;
    }
  } catch (_) {}

  const audio = document.getElementById("tbw-intro-audio");
  const meterFill = el.querySelector(".tbw-meter-fill");
  const btnSkip = document.getElementById("tbw-intro-skip");
  const btnMute = document.getElementById("tbw-intro-mute");
  const canvas = document.getElementById("tbw-intro-particles");
  const ctx = canvas.getContext("2d");

  // Particles (blage hologramske točkice)
  let particles = [];
  function resize() {
    canvas.width = canvas.clientWidth = window.innerWidth;
    canvas.height = canvas.clientHeight = window.innerHeight;
    particles = new Array(120).fill(0).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      s: Math.random() * 0.6 + 0.2,
      a: Math.random() * Math.PI * 2
    }));
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "screen";
    for (const p of particles) {
      p.x += Math.cos(p.a) * p.s;
      p.y += Math.sin(p.a) * p.s * 0.6;
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
      g.addColorStop(0, "rgba(39,246,198,0.7)");
      g.addColorStop(1, "rgba(39,246,198,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  let raf = requestAnimationFrame(draw);

  // Audio: default zvuk uključen, ali utišaj preko gumba
  let muted = false;
  btnMute.addEventListener("click", () => {
    muted = !muted;
    btnMute.setAttribute("aria-pressed", String(muted));
    try { audio.muted = muted; } catch (_) {}
  });

  // start zvuka (na mobile treba user interaction; fallback nakon skip)
  function tryPlay() {
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 0.85;
    audio.muted = muted;
    audio.play().catch(() => {/* tiho ignoriraj */});
  }
  // ako korisnik dotakne ekran – pusti
  window.addEventListener("pointerdown", tryPlay, { once: true, passive: true });

  // Lažni / realni loader: ide minimalno 2.2s + čeka idle
  let progress = 0;
  let done = false;

  function tick() {
    if (done) return;
    // ubrzaj do 92%, zadnji dio čeka “idle”
    const target = performance.now() < start + 1600 ? 92 : 98;
    progress = Math.min(target, progress + Math.random() * 2.8 + 0.6);
    meterFill.style.width = progress + "%";
    el.querySelector(".tbw-intro-meter").setAttribute("aria-valuenow", String(Math.floor(progress)));
    if (!done) setTimeout(tick, 90);
  }

  const start = performance.now();
  tick();
  tryPlay();

  // Skip i automatsko gašenje
  const finish = () => {
    if (done) return;
    done = true;
    progress = 100; meterFill.style.width = "100%";
    setTimeout(() => {
      el.classList.add("hidden");
      cancelAnimationFrame(raf);
      try { localStorage.setItem("tbw_intro_seen", String(Date.now())); } catch(_) {}
    }, 280);
  };

  btnSkip.addEventListener("click", finish);
  // tap bilo gdje = skip (osim na kontrolama)
  el.addEventListener("click", (e) => {
    const ctl = e.target.closest(".tbw-intro-ctl");
    if (!ctl) finish();
  });

  // “Idle” signal: kad se DOM/karte/AI pripreme — ugasi intro
  // Ako već imaš “initApp” neku — pozovi window.tbwIntroReady() kad završi.
  window.tbwIntroReady = finish;
  // safety timeout
  setTimeout(finish, 4200);
})();
/* ===== /TBW APEX INTRO ===== */
