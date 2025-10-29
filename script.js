console.log('TBW FINAL WEB loaded');
const $=s=>document.querySelector(s);

let API_BASE="";
fetch('/config.json').then(r=>r.json()).then(c=>{API_BASE=c.API_BASE||"";init()}).catch(()=>{API_BASE="";init()});

async function init(){
  const splash=$('#splash'), app=$('#app');
  const canvas=document.getElementById('comet');const x=canvas.getContext('2d');
  function rs(){canvas.width=innerWidth;canvas.height=innerHeight}rs();addEventListener('resize',rs);
  const stars=Array.from({length:220},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height*0.6,r:Math.random()*1.4,a:Math.random()}));
  let t0=0,dur=5000;
  function loop(ts){if(!t0)t0=ts;const p=Math.min(1,(ts-t0)/dur);x.fillStyle='#0b0e13';x.fillRect(0,0,canvas.width,canvas.height);
    stars.forEach(s=>{x.globalAlpha=s.a*(0.6+0.4*Math.sin((ts+s.x)*0.001));x.fillStyle='#ffd67a';x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fill()});
    const ex=-120+p*(canvas.width+240),ey=canvas.height*0.32+Math.sin(p*3)*16;
    const g=x.createLinearGradient(ex-220,ey-40,ex,ey);g.addColorStop(0,'rgba(255,214,122,0)');g.addColorStop(1,'rgba(255,214,122,0.9)');
    x.fillStyle=g;x.beginPath();x.ellipse(ex-110,ey-12,220,40,0,Math.PI*2);x.fill();
    x.fillStyle='rgba(255,214,122,'+(1-p)+')';x.beginPath();x.arc(ex,ey,6+8*(1-p),0,Math.PI*2);x.fill();
    if(p<1)requestAnimationFrame(loop);else{canvas.style.filter='blur(6px)';setTimeout(()=>{splash.classList.add('fade-out');app.classList.remove('hidden');},300)}
  } requestAnimationFrame(loop);

  const audio=document.getElementById('bgAudio')||document.getElementById('intro');
  function tryPlay(){audio.volume=0.22;audio.play().catch(()=>{})}
  addEventListener('click',tryPlay,{once:true});addEventListener('keydown',tryPlay,{once:true});

  let gkey=""; try{const k=await fetch(API_BASE+'/api/gmaps-key').then(r=>r.json());gkey=k.key||""}catch(e){}
  if(gkey){await new Promise((ok,ko)=>{const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${gkey}&libraries=places&language=hr`;s.async=true;s.defer=true;s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
  initApp();
}

let map,trafficLayer,streetView,marker,dirService,dirRenderer;
function initMap(center={lat:45.815,lng:15.9819},zoom=12){
  map=new google.maps.Map(document.getElementById('map'),{center,zoom,mapId:'TBW_AI_NAV'});
  marker=new google.maps.Marker({position:center,map});
  trafficLayer=new google.maps.TrafficLayer();
  streetView=new google.maps.StreetViewPanorama(document.getElementById('map'),{position:center,visible:false});
  map.setStreetView(streetView);
  dirService=new google.maps.DirectionsService();
  dirRenderer=new google.maps.DirectionsRenderer({map});
}

function initApp(){
  if(typeof google!=='undefined' && google.maps){initMap();}
  $('#btnTraffic').addEventListener('click',()=>{const on=trafficLayer.getMap()!=null;trafficLayer.setMap(on?null:map)});
  $('#btnStreet').addEventListener('click',()=>{streetView.setVisible(!streetView.getVisible())});
  $('#btnLocate').addEventListener('click',()=>{
    if(!navigator.geolocation) return alert('Nije podržano.');
    navigator.geolocation.getCurrentPosition(p=>{
      const pos={lat:p.coords.latitude,lng:p.coords.longitude};map.setCenter(pos);map.setZoom(14);marker.setMap(null);marker=new google.maps.Marker({position:pos,map});loadNearby(pos.lat,pos.lng);
    },()=>alert('Ne mogu dohvatiti lokaciju.'));
  });
  $('#go').addEventListener('click',()=>runSearch()); $('#q').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});
  $('#navGo').addEventListener('click',()=>{
    const q=($('#navTo').value||'').trim();if(!q)return alert('Upiši odredište.');
    const c=map.getCenter();const origin=`${c.lat()},${c.lng()}`;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodeURIComponent(q)}&travelmode=driving`,'_blank');
    dirService.route({origin, destination:q, travelMode:google.maps.TravelMode.DRIVING},(r,s)=>{if(s==='OK')dirRenderer.setDirections(r)});
  });

  Promise.all([getJSON('/api/weather?city=Split'),getJSON('/api/poi?city=Split'),getJSON('/api/photos?q=Split'),getJSON('/api/traffic?city=Split')].map(p=>p.catch(e=>null)))
    .then(([w,poi,photos,tr])=>{ if(w) renderWeather(w); if(poi) renderPOI(poi); if(photos) renderPhotos(photos); if(tr) renderTraffic(tr); refreshTicker('Split') });
  setInterval(()=>refreshTicker('Split'),60000);
}

async function getJSON(path){const r=await fetch(API_BASE+path); if(!r.ok) throw new Error('HTTP '+r.status); return r.json();}

function renderWeather(obj){
  const d=obj?.data?.current||{};
  document.getElementById('wTemp').textContent=(d.temp!=null?Math.round(d.temp)+'°C':'--°C');
  document.getElementById('wWind').textContent='vjetar '+(d.wind_speed!=null?Math.round(d.wind_speed):'--')+' m/s';
  document.getElementById('wHum').textContent='vlaga '+(d.humidity!=null?d.humidity:'--')+'%';
}

function renderPhotos(p){const b=document.getElementById('photos');b.innerHTML='';(p.images||[]).slice(0,6).forEach(ph=>{const im=new Image();im.src=ph.url;im.alt=ph.author||'';b.appendChild(im)})}
function renderPOI(p){const ul=document.getElementById('poiList');ul.innerHTML='';(p.poi||[]).slice(0,12).forEach(f=>{const li=document.createElement('li');li.textContent=f.properties?.name||'Točka interesa';ul.appendChild(li)})}
function renderTraffic(t){const ul=document.getElementById('trafficList');ul.innerHTML='';(t.incidents||[]).slice(0,10).forEach(i=>{const li=document.createElement('li');li.textContent=i.properties?.description||'Prometna informacija';ul.appendChild(li)})}
async function refreshTicker(city){try{const d=await getJSON('/api/alerts?city='+encodeURIComponent(city));document.getElementById('ticker').textContent=d.items?.length?d.items.join('  •  '):'Nema novih obavijesti.'}catch(e){document.getElementById('ticker').textContent='Greška pri dohvaćanju obavijesti.'}}

async function loadNearby(lat,lon){
  try{const t="supermarket,pharmacy,hospital,bus_station,train_station,police,fire_station,atm,bank,tourist_attraction";
      const d=await getJSON(`/api/places-nearby?lat=${lat}&lon=${lon}&types=${encodeURIComponent(t)}&radius=3000`);
      const ul=document.getElementById('nearbyList'); ul.innerHTML=''; (d.places||[]).forEach(p=>{const li=document.createElement('li');li.innerHTML=`<b>${p.name}</b> ${p.rating?`⭐${p.rating}`:''}`; ul.appendChild(li)});
  }catch(e){}
}

async function runSearch(){
  const txt=(document.getElementById('q').value||'').trim(); if(!txt)return;
  try{const out=await fetch(API_BASE+'/api/ai/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:txt,lang:'hr-HR'})}).then(r=>r.json());
      document.getElementById('aiOut').textContent=out.reply||'OK';
      if(out.city){const w=await getJSON('/api/weather?city='+encodeURIComponent(out.city)); renderWeather(w); refreshTicker(out.city);}
      if(out.destination){const c=map.getCenter();dirService.route({origin:{lat:c.lat(),lng:c.lng()},destination:out.destination,travelMode:google.maps.TravelMode.DRIVING},(r,s)=>{if(s==='OK')dirRenderer.setDirections(r)})}
  }catch(e){document.getElementById('aiOut').textContent='Greška pri tumačenju.'}
}
