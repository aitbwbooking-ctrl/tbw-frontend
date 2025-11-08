const FEATURES = { voiceSearch:true, rdsTraffic:true };

(async function boot(){
  const cfg = await (await fetch('/config.json?v='+Date.now())).json();
  window.CFG = cfg;

  // load Maps
  const s = document.getElementById('gmaps');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(cfg.MAPS_API_KEY)}&libraries=places&loading=async`;
  s.onload = init;
})();

function setLive(on=true){
  document.getElementById('liveDot').style.background = on?'#1fdf64':'#ff5a6b';
  document.getElementById('liveLabel').textContent = 'TBW LIVE';
}

// INTRO
function setupIntro(){
  const el = document.getElementById('intro');
  const c = document.getElementById('stars'); const ctx = c.getContext('2d');
  function resize(){ c.width=innerWidth; c.height=innerHeight; }
  addEventListener('resize',resize); resize();
  const stars = [...Array(120)].map(()=>({x:Math.random()*c.width,y:Math.random()*c.height,z:Math.random()*1.2+.2}));
  let comet={x:-100,y:c.height*.25,vx:6,vy:2,ttl:160}, nova={t:0,go:false};
  (function draw(){
    ctx.fillStyle='#000'; ctx.fillRect(0,0,c.width,c.height);
    stars.forEach(s=>{ s.x+=.2*s.z; if(s.x>c.width) s.x=0; ctx.fillStyle=`rgba(180,255,250,${.6*s.z})`; ctx.fillRect(s.x,s.y,1.2*s.z,1.2*s.z);});
    if(comet.ttl>0){
      comet.x+=comet.vx; comet.y+=comet.vy; comet.ttl--;
      for(let i=0;i<30;i++){ ctx.fillStyle=`rgba(0,255,220,${(1-i/30)*.4})`; ctx.fillRect(comet.x-i*4,comet.y-i*2,2,2);}
      ctx.beginPath(); ctx.arc(comet.x,comet.y,2,0,Math.PI*2); ctx.fillStyle='#7fffe1'; ctx.fill();
      if(comet.ttl===10){ nova.go=true; nova.t=0; }
    }
    if(nova.go){ nova.t++; const r=nova.t*8; ctx.beginPath(); ctx.arc(comet.x,comet.y,r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,255,255,${1-nova.t/30})`; ctx.lineWidth=2; ctx.stroke(); if(nova.t>30) nova.go=false; }
    requestAnimationFrame(draw);
  })();
  const audio=document.getElementById('introAudio'); audio.volume=.6; audio.play().catch(()=>{});
  const kill=()=>{ el.style.opacity=0; setTimeout(()=>el.remove(),320); }
  setTimeout(kill,5000); document.getElementById('skipIntro').onclick=kill;
}

let maps, places, navMap, miniMap, trafficMap, sv, dirSvc, dirRend;
async function init(){
  setupIntro();
  setLive(true);
  loadTicker(); setInterval(loadTicker, 45000);

  // voice
  if(FEATURES.voiceSearch){
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){ const r=new SR(); r.lang='hr-HR';
      document.getElementById('micBtn').onclick=()=>r.start();
      r.onresult=e=>{ document.getElementById('cityInput').value=e.results[0][0].transcript; doSearch(); };
    }
  }

  // maps
  maps = google.maps;
  places = new maps.places.PlacesService(document.createElement('div'));
  dirSvc = new maps.DirectionsService();
  dirRend = new maps.DirectionsRenderer();

  navMap = new maps.Map(document.getElementById('navMap'), {center:{lat:45.8,lng:15.97},zoom:6,mapId:'TBW_NAV'});
  dirRend.setMap(navMap);

  miniMap = new maps.Map(document.getElementById('miniMap'), {center:{lat:44.7,lng:15.8},zoom:6});
  trafficMap = new maps.Map(document.getElementById('trafficMap'), {center:{lat:45.3,lng:15.7},zoom:7});
  new maps.TrafficLayer().setMap(trafficMap);

  sv = new maps.StreetViewPanorama(document.getElementById('streetView'), {
    position:{lat:43.5081,lng:16.4402}, pov:{heading:34,pitch:0}, zoom:1
  });

  document.getElementById('askBtn').onclick = doSearch;
  document.getElementById('routeBtn').onclick = makeRoute;
  document.getElementById('searchHotel').onclick = searchHotels;
  document.getElementById('bookNow').onclick = ()=>alert('Demo rezervacija – odaberi smještaj iz liste.');
  document.getElementById('cancelSel').onclick = ()=>alert('Demo otkazivanje.');

  // toggle chips
  document.querySelectorAll('.chip[data-layer]').forEach(ch=>{
    ch.onclick = ()=> ch.classList.toggle('sel');
  });

  // RDS SSE
  if(FEATURES.rdsTraffic) startRDS();

  doSearch();
}

function startRDS(){
  const es = new EventSource(`${CFG.API_BASE_URL}/api/traffic/stream`);
  es.onmessage = (e)=>{
    try{
      const data = JSON.parse(e.data||'{}');
      if(data?.type==='rds'){
        const t = document.getElementById('ticker').textContent;
        document.getElementById('ticker').textContent = `${data.event.msg} • ${t}`;
      }
    }catch{}
  };
  es.onerror = ()=> setLive(false);
}

async function loadTicker(){
  const city = (document.getElementById('cityInput').value||'Hrvatska').trim();
  try{
    const d = await (await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(city)}`)).json();
    const msgs = (d.alerts||[]).map(a=>a.message);
    if(msgs.length){
      let i=0;
      document.getElementById('ticker').textContent = msgs[0];
      clearInterval(window.__tick);
      window.__tick = setInterval(()=>{
        i=(i+1)%msgs.length;
        document.getElementById('ticker').textContent = msgs[i];
      }, 4500);
    }
    setLive(true);
  }catch{
    setLive(false);
  }
}

async function doSearch(){
  const q = (document.getElementById('cityInput').value||'Split').trim();
  document.getElementById('hotelCity').value = q;

  // weather
  (async ()=>{
    const box = document.getElementById('weatherBox'); box.innerHTML='Učitavanje…';
    try{
      const d = await (await fetch(`${CFG.API_BASE_URL}/api/weather?city=${encodeURIComponent(q)}`)).json();
      const t = Math.round(d?.main?.temp ?? 17);
      const desc = d?.weather?.[0]?.description || '-';
      box.innerHTML = `<div style="font-size:2rem;font-weight:800">${t}°C</div><div>${q} • ${desc}</div>`;
    }catch{ box.innerHTML='Nedostupno.'; }
  })();

  // photos
  (async ()=>{
    const wrap = document.getElementById('photosStrip'); wrap.innerHTML='';
    try{
      const d = await (await fetch(`${CFG.API_BASE_URL}/api/photos?q=${encodeURIComponent(q)}`)).json();
      (d.results||[]).slice(0,6).forEach(p=>{
        const img = document.createElement('img'); img.src = p.urls?.small || p.urls?.thumb; img.loading='lazy'; wrap.appendChild(img);
      });
    }catch{ wrap.innerHTML='-'; }
  })();

  // poi
  (async ()=>{
    const box = document.getElementById('poiBox'); box.innerHTML='';
    try{
      const d = await (await fetch(`${CFG.API_BASE_URL}/api/poi?city=${encodeURIComponent(q)}`)).json();
      (d.items||[]).forEach(i=>{
        const el=document.createElement('div'); el.className='item';
        el.innerHTML=`<strong>${i.name}</strong><br><span style="opacity:.8">${i.short||''}</span>`;
        el.onclick=()=>{
          if(i.lat&&i.lon){ const pos={lat:i.lat,lng:i.lon}; navMap.setCenter(pos); navMap.setZoom(15); sv.setPosition(pos); }
        };
        box.appendChild(el);
      });
    }catch{ box.innerHTML='-'; }
  })();

  // sea
  (async ()=>{
    const sb=document.getElementById('seaBox'); sb.innerHTML='Učitavanje…';
    try{
      const d = await (await fetch(`${CFG.API_BASE_URL}/api/sea?city=${encodeURIComponent(q)}`)).json();
      sb.innerHTML = `<div style="font-size:1.6rem;font-weight:800">${d.seaTemp}°C</div><div>${d.text}</div>`;
    }catch{ sb.innerHTML='-'; }
  })();

  // center maps & streetview
  geocode(q).then(pos=>{
    if(pos){ navMap.setCenter(pos); navMap.setZoom(12); miniMap.setCenter(pos); miniMap.setZoom(9); sv.setPosition(pos); }
  });
}

function geocode(q){
  return new Promise(res=>{
    const gc = new google.maps.Geocoder();
    gc.geocode({address:q},(r,st)=> st==='OK'&&r[0]?res(r[0].geometry.location.toJSON()):res(null));
  });
}

function makeRoute(){
  const from = document.getElementById('routeFrom').value.trim();
  const to = document.getElementById('routeTo').value.trim();
  if(!to) return alert('Unesite odredište.');
  dirSvc.route({origin:from||navMap.getCenter(), destination:to, travelMode:'DRIVING'})
    .then(r=>dirRend.setDirections(r)).catch(()=>alert('Ruta nije pronađena.'));
}

async function searchHotels(){
  const city = document.getElementById('hotelCity').value.trim() || 'Split';
  const grid = document.getElementById('hotelResults'); grid.innerHTML='Pretraga…';
  try{
    const d = await (await fetch(`${CFG.API_BASE_URL}/api/hotels/search?city=${encodeURIComponent(city)}`)).json();
    grid.innerHTML='';
    (d.items||[]).forEach(p=>{
      const div=document.createElement('div'); div.className='hotel';
      div.innerHTML=`<div class="meta"><strong>${p.name}</strong><span>${p.address||city}</span></div><div class="price">${p.price}</div>`;
      div.onclick=()=>{ if(p.lat&&p.lng){ const pos={lat:p.lat,lng:p.lng}; navMap.setCenter(pos); navMap.setZoom(14); sv.setPosition(pos);} };
      grid.appendChild(div);
    });
    if(!grid.children.length) grid.textContent='Nema rezultata.';
  }catch{ grid.textContent='Greška pri pretrazi.'; }
}
