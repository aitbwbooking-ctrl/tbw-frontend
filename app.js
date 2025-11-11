/* TBW Premium – full frontend init
   - Cinematic intro (5s): svemir + komet + supernova + logo
   - Ticker (promet/alerts/shops/vrijeme) auto refresh
   - Google Maps (mapa, traffic layer, street view, places chips)
   - Booking deep links
   - Fullscreen kartice
   - STT mikrofon (browser) – hr-HR
   - PWA ready (sw.js & manifest.json već u projektu)
*/

const STATE = {
  city: "Zagreb",
  base: "https://tbw-backend.vercel.app",
  cfg: null,
  maps: { map:null, traffic:null, street:null }
};
const qs = (s, el=document)=>el.querySelector(s);
const qsa= (s, el=document)=>[...el.querySelectorAll(s)];

/* ---------- CONFIG ---------- */
async function loadConfig(){
  try{
    const cfg = await (await fetch('/config.json')).json();
    STATE.cfg = cfg;
    if (cfg.API_BASE_URL) STATE.base = cfg.API_BASE_URL.replace(/\/$/,'');
  }catch(_){}
}

/* ---------- INTRO CINEMATIC (5s) ---------- */
function runIntro(){
  const wrap  = qs('#intro');
  const logo  = qs('#logoReveal');
  const audio = qs('#introAudio');
  const canvas = qs('#spaceCanvas');
  const ctx = canvas.getContext('2d');

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize(); addEventListener('resize', resize);

  // zvijezde
  const stars = [];
  for (let i=0;i<260;i++){
    stars.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, z:Math.random()*canvas.width });
  }
  // komet
  const comet = { x:-160, y:canvas.height*0.55, vx:10, tail:[] };

  let t = 0, supernova = false;
  function frame(){
    t++;
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // titranje zvijezda (warp efekt)
    stars.forEach(st=>{
      st.z -= 3;
      if (st.z <= 0) st.z = canvas.width;
      const k = 128.0 / st.z;
      const px = (st.x - canvas.width/2) * k + canvas.width/2;
      const py = (st.y - canvas.height/2) * k + canvas.height/2;
      if (px>=0 && px<=canvas.width && py>=0 && py<=canvas.height){
        const size = (1 - st.z / canvas.width) * 2;
        ctx.fillStyle = "#ffffffcc";
        ctx.fillRect(px, py, size, size);
      }
    });

    // komet + zlatne čestice
    if (!supernova){
      comet.x += comet.vx;
      comet.tail.push({x: comet.x, y: comet.y});
      if (comet.tail.length > 60) comet.tail.shift();

      for (let i=0;i<comet.tail.length;i++){
        const p = comet.tail[i];
        ctx.fillStyle = `rgba(255,215,120,${i/60})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = "#ffde8a";
      ctx.beginPath(); ctx.arc(comet.x, comet.y, 7, 0, Math.PI*2); ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // zvuk (pusti tiho; neke browsere traže gesture)
  audio.volume = 0.7;
  audio.play().catch(()=>{ /* ignoriraj blokadu */ });

  // nakon ~3.5s supernova, logo fade-in
  setTimeout(()=>{
    supernova = true;
    // eksplozija repa:
    for (let i=0;i<260;i++){
      comet.tail.push({
        x: comet.x + (Math.random()-0.5)*520,
        y: comet.y + (Math.random()-0.5)*520
      });
    }
    logo.style.opacity = 1;
  }, 3500);

  // izlaz u app poslije ~5s
  setTimeout(()=>{
    wrap.style.opacity = 0;
    setTimeout(()=>{
      wrap.remove();
      qs('#app').classList.remove('hidden');
    }, 900);
  }, 5000);
}

/* ---------- GOOGLE MAPS ---------- */
function injectGoogle(cb){
  if (window.google?.maps) return cb();
  const key = STATE.cfg?.MAPS_API_KEY?.trim();
  const s=document.createElement('script');
  s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
  s.async=true; s.onload=cb; s.onerror=()=>console.error('Google Maps failed');
  document.head.appendChild(s);
}

function initMaps(){
  const mapEl=qs('#map');
  STATE.maps.map = new google.maps.Map(mapEl,{center:{lat:45.815, lng:15.9819},zoom:7,disableDefaultUI:false,mapTypeControl:false,streetViewControl:false});
  STATE.maps.traffic = new google.maps.TrafficLayer();
  STATE.maps.traffic.setMap(null);

  const streetEl=qs('#street');
  STATE.maps.street = new google.maps.StreetViewPanorama(streetEl,{
    position:{lat:45.492, lng:15.555}, pov:{heading:34,pitch:10}, zoom:1
  });

  qs('#btnGo').addEventListener('click',()=>{
    const s = qs('#startInput').value.trim();
    const e = qs('#endInput').value.trim();
    if(!e){ alert('Unesite odredište'); return; }
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(s)}/${encodeURIComponent(e)}`;
    window.open(url,'_blank');
  });

  qs('#btnTraffic').addEventListener('click',()=>{
    const on = STATE.maps.traffic.getMap();
    STATE.maps.traffic.setMap(on?null:STATE.maps.map);
  });

  qsa('.chip').forEach(ch=>{
    ch.addEventListener('click',()=>{
      const what = ch.dataset.l;
      const svc = {parking:'parking', punionice:'ev charger', bolnice:'hospital', trgovine:'supermarket', hitne:'police station'};
      const request = { query: `${svc[what]||what} near ${STATE.city}` };
      const service = new google.maps.places.PlacesService(STATE.maps.map);
      service.textSearch(request,(results,status)=>{
        if(status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) return;
        STATE.maps.map.setCenter(results[0].geometry.location);
        STATE.maps.map.setZoom(13);
        results.slice(0,15).forEach(r=>{
          new google.maps.Marker({map:STATE.maps.map, position:r.geometry.location, title:r.name});
        });
      });
    });
  });

  qs('#btnExitNav').addEventListener('click',()=>{
    qs('#startInput').value=''; qs('#endInput').value='';
  });
}

/* ---------- TICKER ---------- */
async function refreshTicker(){
  const inner = qs('#ticker-inner');
  inner.innerHTML = 'Učitavam…';
  try{
    const city = encodeURIComponent(STATE.city);
    const [w,t,a,s] = await Promise.all([
      fetch(`${STATE.base}/api/weather?city=${city}`).then(r=>r.json()).catch(()=>null),
      fetch(`${STATE.base}/api/traffic?city=${city}`).then(r=>r.json()).catch(()=>null),
      fetch(`${STATE.base}/api/alerts?city=${city}`).then(r=>r.json()).catch(()=>null),
      fetch(`${STATE.base}/api/stores?city=${city}`).then(r=>r.json()).catch(()=>null),
    ]);

    const chunks = [];
    if (w?.summary) chunks.push(`☁️ Vrijeme: ${w.summary}`);
    if (t?.status)  chunks.push(`🚗 Promet: ${t.status}`);
    if (a?.length){ chunks.push(...a.map(x=>`⚠️ ${x.msg}`)); }
    if (s?.length){ chunks.push(...s.map(x=>`🛒 ${x.name} ${x.status}${x.closes?` (zatvara ${x.closes})`:''}`)); }

    inner.innerHTML = (chunks.length?chunks:['Nema posebnih upozorenja']).map(c=>{
      const cls = /⚠️/.test(c) ? 'ticker__warn' : /ALERT|crash|požar/i.test(c) ? 'ticker__danger':'';
      return `<div class="ticker__item ${cls}">${c}</div>`;
    }).join(' • ');

    setLiveDot(true);
  }catch(e){
    inner.textContent = 'Nema posebnih upozorenja.';
    setLiveDot(false);
  }
}
function setLiveDot(ok){ qs('#statusDot').style.background = ok ? '#43d27f' : '#f43f5e'; }

/* ---------- PANELS ---------- */
async function loadWeather(){
  const box = qs('#weatherList');
  box.innerHTML = `<li class="muted">Učitavam...</li>`;
  try{
    const j = await fetch(`${STATE.base}/api/weather?city=${encodeURIComponent(STATE.city)}`).then(r=>r.json());
    const lines = [];
    if (j?.temp) lines.push(`Temp: ${j.temp} °C`);
    if (j?.desc) lines.push(`Opis: ${j.desc}`);
    if (j?.wind) lines.push(`Vjetar: ${j.wind}`);
    if (j?.humidity) lines.push(`Vlažnost: ${j.humidity}`);
    if (j?.seaTemp) lines.push(`Temp mora: ${j.seaTemp} °C`);
    box.innerHTML = lines.map(x=>`<li>${x}</li>`).join('') || `<li class="muted">Nema podataka</li>`;
  }catch(e){
    box.innerHTML = `<li class="muted">Nema podataka</li>`;
  }
}

async function loadSea(){
  const ul = qs('#seaList');
  try{
    const j = await fetch(`${STATE.base}/api/sea?city=${encodeURIComponent(STATE.city)}`).then(r=>r.json());
    ul.innerHTML = `
      <li>Temp mora: ${j?.sea_temp ?? j?.temp ?? '—'} °C</li>
      <li>Valovi: ${j?.waves ?? '—'}</li>
      <li>Vjetar: ${j?.wind ?? '—'}</li>`;
  }catch(e){
    ul.innerHTML = `<li class="muted">Nema podataka</li>`;
  }
}

function attachServices(){
  qsa('[data-svc]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const type = btn.dataset.svc;
      const box = qs('#servicesList'); box.innerHTML = 'Tražim...';
      try{
        const j = await fetch(`${STATE.base}/api/services?city=${encodeURIComponent(STATE.city)}&type=${type}`).then(r=>r.json());
        const items = j?.items || j || [];
        box.innerHTML = items.slice(0,8).map(x=>(
          `<div class="svc-item"><strong>${x.name||'Nepoznato'}</strong><br><span class="muted">${x.address||''}</span></div>`
        )).join('') || '<div class="muted">Nema rezultata.</div>';
      }catch(e){
        box.innerHTML = '<div class="muted">Greška pri dohvaćanju.</div>';
      }
    });
  });
}

/* ---------- BOOKING ---------- */
function bookingLinks(){
  const cityEl = qs('#bookingCity');
  const fromEl = qs('#dateFrom'); const toEl = qs('#dateTo'); const guestsEl = qs('#guests');

  function fmt(d){ return d ? d : ''; }
  function openTo(site){
    const city = encodeURIComponent(cityEl.value || STATE.city);
    const ad = fmt(fromEl.value); const dd = fmt(toEl.value); const g = guestsEl.value||2;
    let url = '';
    if (site==='booking')
      url = `https://www.booking.com/searchresults.html?ss=${city}&checkin=${ad}&checkout=${dd}&group_adults=${g}`;
    if (site==='expedia')
      url = `https://www.expedia.com/Hotel-Search?destination=${city}&startDate=${ad}&endDate=${dd}&adults=${g}`;
    if (site==='airbnb')
      url = `https://www.airbnb.com/s/${city}/homes?checkin=${ad}&checkout=${dd}&adults=${g}`;
    window.open(url,'_blank');
  }

  qs('#btnBookingSearch').onclick = ()=> openTo('booking');
  qs('#btnBookingDirect').onclick = ()=> openTo(['booking','expedia','airbnb'][Math.floor(Math.random()*3)]);
  qs('#btnBookingClear').onclick = ()=>{ cityEl.value=''; fromEl.value=''; toEl.value=''; guestsEl.value='2'; };
}

/* ---------- FULLSCREEN MODAL ---------- */
function enableFullscreenCards(){
  qsa('.card__max').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      const card = e.target.closest('.card');
      const clone = card.cloneNode(true);
      qs('#modalContent').innerHTML='';
      qs('#modalContent').appendChild(clone);
      qs('#modal').classList.remove('hidden');
    });
  });
  qs('#modalClose').onclick = ()=> qs('#modal').classList.add('hidden');
}

/* ---------- MIC (browser STT) ---------- */
function micSetup(){
  const btn = qs('#btnMic');
  let rec=null, on=false;
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    btn.title = 'Browser bez STT podrške';
    btn.disabled = true;
    return;
  }
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  rec = new R(); rec.lang='hr-HR'; rec.continuous=true; rec.interimResults=false;
  rec.onresult = (ev)=>{
    const last = ev.results[ev.results.length-1][0].transcript.trim();
    if (/ruta|vozi|idi|navigiraj/i.test(last)) {
      const m = last.replace(/ruta|vozi|idi|navigiraj/ig,'').trim();
      if (m) { qs('#endInput').value = m; qs('#btnGo').click(); }
    } else {
      qs('#cityInput').value = last; qs('#btnSearch').click();
    }
  };
  btn.onclick = ()=>{
    if (!on){ rec.start(); on=true; btn.textContent='🛑'; }
    else { rec.stop(); on=false; btn.textContent='🎤'; }
  };
}

/* ---------- SEARCH ---------- */
function wireSearch(){
  qs('#btnSearch').onclick = ()=>{
    const c = qs('#cityInput').value.trim();
    if (!c) return;
    STATE.city = c;
    refreshAll();
  };
}

/* ---------- ALL REFRESH ---------- */
function refreshAll(){
  refreshTicker();
  loadWeather();
  loadSea();

  if (window.google?.maps && STATE.maps.map){
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({address:STATE.city},(res)=>{
      const g = res && res[0]; if(!g) return;
      STATE.maps.map.setCenter(g.geometry.location);
      STATE.maps.map.setZoom(12);
      STATE.maps.street.setPosition(g.geometry.location);
    });
  }
}

/* ---------- INIT ---------- */
(async function init(){
  await loadConfig();
  runIntro();

  wireSearch();
  micSetup();
  bookingLinks();
  enableFullscreenCards();
  attachServices();

  injectGoogle(()=>{ initMaps(); refreshAll(); });
  setInterval(refreshTicker, 60*1000);
})();
