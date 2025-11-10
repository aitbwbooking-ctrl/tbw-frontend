/* TBW ATLAS – full front */

const FEAT = {
  voiceSearch: true,
  tts: true,
  introMs: 5000,
  haptics: true,
  continuousMic: true
};

let CFG=null;
let CURRENT_CITY='Zagreb';
let G={ mapsReady:false, map:null, dirS:null, dirR:null, mini:null, traffic:null, sv:null };
let micActive=false;
let rec=null;

async function loadConfig(){ const r=await fetch('/config.json?'+Date.now()); CFG=await r.json(); }
function haptic(ms=12){ if(FEAT.haptics && navigator.vibrate) navigator.vibrate(ms); }

/* INTRO FX */
function starIntro(){
  const root=document.getElementById('intro');
  const cav=document.getElementById('stars'); const ctx=cav.getContext('2d');
  let w,h,stars=[], comet=null;
  const fit=()=>{ w=innerWidth; h=innerHeight; cav.width=w; cav.height=h; }; fit(); addEventListener('resize',fit);
  for(let i=0;i<140;i++) stars.push({x:Math.random()*w,y:Math.random()*h,s:Math.random()*1.4+0.3,sp:Math.random()*0.5+0.2});
  comet={x:-120,y:h*0.35,dx:4.2,dy:0.12,life:1};
  (function frame(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){ s.x+=s.sp; if(s.x>w) s.x=0; ctx.fillStyle='rgba(170,220,255,.85)'; ctx.fillRect(s.x,s.y,s.s,s.s); }
    if(comet.life>0){ comet.x+=comet.dx; comet.y+=comet.dy; comet.life-=0.004;
      ctx.beginPath(); ctx.fillStyle='rgba(120,240,255,.95)'; ctx.arc(comet.x,comet.y,2.5,0,Math.PI*2); ctx.fill();
      const grd=ctx.createLinearGradient(comet.x-160,comet.y-26,comet.x,comet.y);
      grd.addColorStop(0,'rgba(0,200,255,0)'); grd.addColorStop(1,'rgba(0,220,255,.55)'); ctx.fillStyle=grd;
      ctx.beginPath(); ctx.moveTo(comet.x-170,comet.y-28); ctx.quadraticCurveTo(comet.x-60,comet.y-4,comet.x,comet.y+2);
      ctx.quadraticCurveTo(comet.x-60,comet.y+8,comet.x-170,comet.y-28); ctx.fill();
    }
    requestAnimationFrame(frame);
  })();
  const au=document.getElementById('introAudio'); au.volume=.45; au.play().catch(()=>{});
  const skip=()=>root.classList.add('hide'); document.getElementById('introSkip').onclick=()=>{haptic();skip();}; setTimeout(skip,FEAT.introMs);
}

/* MAPS */
function loadMaps(){
  return new Promise((resolve,reject)=>{
    if(window.google && window.google.maps) return resolve();
    const src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CFG.MAPS_API_KEY)}&v=weekly&libraries=maps,marker,places`;
    const s=document.createElement('script'); s.src=src; s.async=true; s.defer=true;
    s.onload=resolve; s.onerror=()=>reject(new Error('Maps failed')); document.head.appendChild(s);
  });
}
function initMapsUI(){
  G.map = new google.maps.Map(document.getElementById('navMap'),{ center:{lat:45.815,lng:15.981}, zoom:7 });
  G.dirS = new google.maps.DirectionsService();
  G.dirR = new google.maps.DirectionsRenderer({map:G.map});
  G.traffic = new google.maps.TrafficLayer();

  G.mini = new google.maps.Map(document.getElementById('miniMap'),{ center:{lat:44.5,lng:16.5}, zoom:6, disableDefaultUI:true });
  new google.maps.TrafficLayer().setMap(G.mini);

  G.sv = new google.maps.StreetViewPanorama(document.getElementById('streetView'),{ position:{lat:43.508,lng:16.44}, pov:{heading:34,pitch:10}, zoom:1 });

  document.getElementById('routeGo').onclick=()=>{
    haptic();
    const from=document.getElementById('routeFrom').value.trim();
    const to=document.getElementById('routeTo').value.trim();
    if(!to) return toast('Unesite odredište');
    G.dirS.route({ origin:from||CURRENT_CITY, destination:to, travelMode:'DRIVING' })
      .then(r=>G.dirR.setDirections(r))
      .catch(()=>toast('Nije moguće izračunati rutu'));
  };
  document.getElementById('navTraffic').onclick=()=>{ haptic(); G.traffic.setMap(G.traffic.getMap()?null:G.map); };
  document.getElementById('navExit').onclick=()=>{ haptic(); G.dirR.set('directions', null); toast('Navigacija zaustavljena'); };
}

/* BOOKING */
let selectedHotel=null;
function partnerButtons(city,inDate,outDate,guests){
  const el=document.getElementById('partnerLinks');
  const p=s=>encodeURIComponent(s||'');
  const book=`https://www.booking.com/searchresults.html?ss=${p(city)}${inDate&&outDate?`&checkin=${p(inDate)}&checkout=${p(outDate)}`:''}&group_adults=${guests||2}`;
  const airb=`https://www.airbnb.com/s/${p(city)}/homes${inDate&&outDate?`?checkin=${p(inDate)}&checkout=${p(outDate)}&adults=${guests||2}`:''}`;
  const expd=`https://www.expedia.com/Hotel-Search?destination=${p(city)}${inDate&&outDate?`&d1=${p(inDate)}&d2=${p(outDate)}`:''}&adults=${guests||2}`;
  el.innerHTML=`
    <a class="btn" href="${book}" target="_blank" rel="noopener">Booking.com</a>
    <a class="btn" href="${airb}" target="_blank" rel="noopener">Airbnb</a>
    <a class="btn" href="${expd}" target="_blank" rel="noopener">Expedia</a>`;
}
function bindBooking(){
  const list=document.getElementById('hotelResults');
  document.querySelectorAll('.chips .chip[data-filter]').forEach(b=> b.onclick=()=>{haptic(); b.classList.toggle('active');});

  document.getElementById('bookSearch').onclick=async()=>{
    haptic();
    const city=document.getElementById('hotelCity').value.trim()||CURRENT_CITY;
    const arrive=document.getElementById('arrive').value||'';
    const depart=document.getElementById('depart').value||'';
    const guests=+document.getElementById('guests').value||2;
    partnerButtons(city,arrive,depart,guests);
    list.innerHTML=`<div class="item">Pretraga…</div>`;
    try{
      const r=await fetch(`${CFG.API_BASE_URL}/booking/search?city=${encodeURIComponent(city)}`);
      const d=await r.json();
      list.innerHTML = (d.results||[]).slice(0,6).map(h=>`
        <div class="item" data-id="${h.id}">
          <div class="row between"><strong>${h.name}</strong><span class="small">${h.price} € / noć</span></div>
          <div class="small">${h.address}</div>
          <div class="row gap" style="margin-top:6px">
            <button class="btn sm ok reserve">Rezerviraj</button>
            <button class="btn sm ghost more">Detalji</button>
          </div>
        </div>`).join('') || `<div class="item">Nema rezultata.</div>`;
      list.querySelectorAll('.reserve').forEach(b=> b.onclick=(e)=>{ haptic(); const card=e.target.closest('.item'); selectedHotel=(d.results||[]).find(x=>String(x.id)===card.dataset.id); toast('Odabran smještaj: '+(selectedHotel?.name||'')); });
    }catch{ list.innerHTML=`<div class="item">Greška pri pretrazi.</div>`; }
  };

  document.getElementById('bookReserve').onclick=async()=>{
    haptic();
    if(!selectedHotel) return toast('Najprije odaberite smještaj');
    try{
      const r=await fetch(`${CFG.API_BASE_URL}/booking/reserve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:selectedHotel.id})});
      if(!r.ok) throw 0; toast('Rezervacija potvrđena ✅');
    }catch{ toast('Rezervacija nije uspjela'); }
  };
  document.getElementById('bookCancel').onclick=()=>{ haptic(); selectedHotel=null; toast('Otkazano'); };
}

/* DATA LOADERS */
async function loadWX(city=CURRENT_CITY){
  const box=document.getElementById('wx'); box.innerHTML=`<div class="item">Učitavanje…</div>`;
  try{
    const d=await (await fetch(`${CFG.API_BASE_URL}/wx?city=${encodeURIComponent(city)}`)).json();
    box.innerHTML=`
      <div class="item"><strong>Temp:</strong> ${d.temp??'—'}°C<br><span class="small">Vjetar: ${d.wind??'—'} m/s</span></div>
      <div class="item"><strong>Vlažnost:</strong> ${d.humid??'—'}%<br><span class="small">Tlak: ${d.pressure??'—'} hPa</span></div>
      <div class="item"><strong>Temp mora:</strong> ${d.sea??'—'}°C<br><span class="small">UV: ${d.uv??'—'}</span></div>`;
  }catch{ box.innerHTML=`<div class="item">Nije dostupno.</div>`; }
}
async function loadPhotos(city=CURRENT_CITY){
  const box=document.getElementById('photos'); box.innerHTML='';
  try{
    const d=await (await fetch(`${CFG.API_BASE_URL}/photos?city=${encodeURIComponent(city)}`)).json();
    if(!d?.photos?.length) return box.innerHTML='<div class="item">Nema fotografija.</div>';
    box.innerHTML=d.photos.slice(0,6).map(u=>`<img class="photo" src="${u}" alt="foto">`).join('');
  }catch{ box.innerHTML='<div class="item">Greška pri dohvaćanju fotografija.</div>'; }
}
async function loadPOI(city=CURRENT_CITY){
  const box=document.getElementById('pois'); box.innerHTML='';
  try{
    const d=await (await fetch(`${CFG.API_BASE_URL}/poi?city=${encodeURIComponent(city)}`)).json();
    if(!d?.items?.length) return box.innerHTML='<div class="item">Nema podataka.</div>';
    box.innerHTML=d.items.slice(0,6).map(p=>`<div class="item"><strong>${p.name}</strong><div class="small">${p.category||''}</div></div>`).join('');
  }catch{ box.innerHTML='<div class="item">Greška pri dohvaćanju.</div>'; }
}
async function loadServices(city=CURRENT_CITY){
  const box=document.getElementById('services'); box.innerHTML='';
  try{
    const d=await (await fetch(`${CFG.API_BASE_URL}/services?city=${encodeURIComponent(city)}`)).json();
    if(!d?.items?.length) return box.innerHTML='<div class="item">Nema podataka.</div>';
    box.innerHTML=d.items.slice(0,6).map(p=>`<a class="item" ${p.href?`href="${p.href}" target="_blank" rel="noopener"`:''}><strong>${p.name}</strong><div class="small">${p.type}</div></a>`).join('');
  }catch{ box.innerHTML='<div class="item">Greška pri dohvaćanju.</div>'; }
}

/* STATUS + TICKER */
async function bootStatus(){
  const dot=document.getElementById('backendDot');
  try{ const r=await fetch(`${CFG.API_BASE_URL}/api/health`); dot.style.background=r.ok?'#0f3':'#f33'; }catch{ dot.style.background='#f33'; }
  const tick=document.getElementById('alertsTicker');
  try{
    const d=await (await fetch(`${CFG.API_BASE_URL}/api/alerts?city=${encodeURIComponent(CURRENT_CITY)}`)).json();
    const arr = (d?.alerts?.length ? d.alerts.map(a=>a.text) : ['Promet uredan.','Nema posebnih upozorenja.']);
    tick.innerHTML=`<span class="track">${arr.join(' • ')} • ${arr.join(' • ')}</span>`;
  }catch{ tick.innerHTML=`<span class="track">Promet uglavnom uredan. • Nema posebnih upozorenja.</span>`; }
}

/* SEARCH + VOICE */
function bindGlobalSearch(){
  const input=document.getElementById('globalSearch');
  const btn=document.getElementById('searchBtn');
  const mic=document.getElementById('micBtn');
  btn.onclick=()=>{ haptic(); runQuery(input.value.trim()); };
  input.onkeydown=(e)=>{ if(e.key==='Enter'){ haptic(); btn.click(); } };

  if(FEAT.voiceSearch && 'webkitSpeechRecognition' in window){
    rec = new webkitSpeechRecognition();
    rec.lang = 'hr-HR'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.continuous = FEAT.continuousMic;
    rec.onresult = (e)=>{
      const txt = e.results[e.results.length-1][0].transcript;
      document.getElementById('navTranscript').textContent = '🎤 ' + txt;
      runQuery(txt);
    };
    rec.onend = ()=>{ if(micActive && FEAT.continuousMic){ rec.start(); } };

    mic.onclick = ()=>{
      haptic();
      micActive = !micActive;
      mic.style.background = micActive ? '#0b3d4a' : '#07242e';
      if(micActive){ rec.start(); toast('Atlas sluša…'); } else { rec.stop(); toast('Slušanje zaustavljeno'); }
    };
  }else{
    mic.style.opacity=.4; mic.style.pointerEvents='none';
  }
}
async function runQuery(q){
  if(!q) return;
  // AI intent (server)
  try{
    const d = await (await fetch(`${CFG.API_BASE_URL}/assistant/query`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})})).json();
    if(d?.intent==='route' && d?.to){ document.getElementById('routeTo').value=d.to; document.getElementById('routeGo').click(); }
    if(d?.intent==='book' && d?.city){ document.getElementById('hotelCity').value=d.city; CURRENT_CITY=d.city; document.getElementById('bookSearch').click(); await syncCity(CURRENT_CITY); }
  }catch{}

  // Maps Places → centriraj sve prozore
  if(G.map){
    const svc = new google.maps.places.PlacesService(G.map);
    svc.textSearch({query:q, region:'hr'}, async (res, status)=>{
      if(status==='OK' && res[0]){
        const loc=res[0].geometry.location;
        CURRENT_CITY = res[0].name || CURRENT_CITY;
        G.map.setCenter(loc); G.map.setZoom(12);
        G.sv.setPosition(loc);
        await syncCity(CURRENT_CITY);
      }
    });
  }
}

/* SYNC ALL */
async function syncCity(city){
  await Promise.all([ bootStatus(), loadWX(city), loadPhotos(city), loadPOI(city), loadServices(city) ]);
}

/* TTS TOAST */
function speak(txt){
  if(!FEAT.tts || !('speechSynthesis' in window)) return;
  const u=new SpeechSynthesisUtterance(String(txt||'')); u.lang='hr-HR'; u.rate=1; u.pitch=1;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function toast(t){
  speak(t); const el=document.createElement('div'); el.className='toast'; el.textContent=t;
  Object.assign(el.style,{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',background:'#0b2b33',border:'1px solid #134a57',color:'#bfefff',padding:'10px 14px',borderRadius:'10px',zIndex:9999,boxShadow:'0 10px 30px #0006'});
  document.body.appendChild(el); setTimeout(()=>el.remove(),2600);
}

/* BOOT */
(async function(){
  try{
    starIntro();
    await loadConfig();
    await loadMaps(); initMapsUI();
    bindBooking(); bindGlobalSearch();
    await syncCity(CURRENT_CITY);
  }catch(e){ console.error(e); toast('Greška prilikom pokretanja'); }
  finally{ setTimeout(()=> document.getElementById('intro').classList.add('hide'), 200); }
})();
