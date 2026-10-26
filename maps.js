'use strict';
/* ============================================================
   maps.js — خرائط حقيقية (OpenStreetMap عبر Leaflet)
   - ماب صغيرة دايرية بتلف مع اتجاهك (زي ألعاب السباق)
   - خريطة كاملة بتفتحها من زرار 🗺 وعليها المسار والمناطق والمعالم ومكانك
   ============================================================ */
let mini=null,miniTiles=null,bigM=null,bigTiles=null,bigPlayer=null,mapsOK=false,mmT=0,bigOpen=false;
const mapOpts={zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false,zoomSnap:0,fadeAnimation:false,zoomAnimation:false,markerZoomAnimation:false};
const tileUrl=()=>night>.5?CFG.tiles.night:CFG.tiles.day;
function poiIcon(t){return L.divIcon({className:'poi',html:t,iconSize:[22,22],iconAnchor:[11,11]})}
function initMaps(){
  try{
    if(typeof L==='undefined'||!L.map)return;
    mini=L.map('mmap',Object.assign({zoom:16,center:toLL(PX[0],PZ[0])},mapOpts));
    miniTiles=L.tileLayer(tileUrl(),{maxZoom:19,subdomains:'abcd',crossOrigin:true}).addTo(mini);
    L.polyline(ROUTE_LL,{color:'#f4c20d',weight:7,opacity:.95}).addTo(mini);
    RAD.forEach(r=>L.marker(toLL(PX[r],PZ[r]),{icon:poiIcon('📷'),interactive:false}).addTo(mini));
    L.marker(toLL(PX[GAS[0]],PZ[GAS[0]]),{icon:poiIcon('⛽'),interactive:false}).addTo(mini);
    L.marker(toLL(PX[WRK[0]],PZ[WRK[0]]),{icon:poiIcon('🔧'),interactive:false}).addTo(mini);
    mapsOK=true;
  }catch(e){mapsOK=false}
}
function updateMini(){
  if(!mapsOK||(mmT++%12))return;
  try{
    const w=wp(pos),ll=toLL(w.x,w.z),bearing=Math.atan2(w.dx,-w.dz)*180/Math.PI;
    mini.invalidateSize(false);mini.setView(ll,16,{animate:false});
    document.getElementById('mmrot').style.transform='rotate('+(-bearing)+'deg)';
    if(miniTiles&&miniTiles._url!==tileUrl())miniTiles.setUrl(tileUrl());
    document.getElementById('mini').classList.toggle('nt',night>.5);
  }catch(e){}
}
/* ---------- الخريطة الكاملة ---------- */
function openBigMap(){
  const box=document.getElementById('big');box.hidden=false;bigOpen=true;
  if(typeof L==='undefined'||!L.map){document.getElementById('bnote').textContent='مكتبة الخرائط (Leaflet) ماتحملتش — تأكد من الاتصال بالنت.';return}
  try{
    if(!bigM){
      bigM=L.map('bmap',{zoomControl:true,attributionControl:false});
      L.control.attribution({prefix:false}).addAttribution('© OpenStreetMap contributors').addTo(bigM);
      bigTiles=L.tileLayer(tileUrl(),{maxZoom:19,subdomains:'abcd',crossOrigin:true}).addTo(bigM);
      const line=L.polyline(ROUTE_LL,{color:'#f4a300',weight:6,opacity:.95}).addTo(bigM);
      ZN.forEach((n,z)=>{const i=z===7?OE+((N-OE)>>1):(ZB[z]+(ZB[z+1]||N))>>1;L.marker(toLL(PX[i%N],PZ[i%N]),{icon:L.divIcon({className:'zlab',html:n,iconSize:[110,22],iconAnchor:[55,-6]}),interactive:false}).addTo(bigM)});
      LANDMARKS.forEach(m=>L.circleMarker([m[0],m[1]],{radius:6,color:'#fff',weight:2,fillColor:'#c0392b',fillOpacity:1}).bindTooltip(m[2],{permanent:true,direction:'top',className:'ltip'}).addTo(bigM));
      RAD.forEach(r=>L.marker(toLL(PX[r],PZ[r]),{icon:poiIcon('📷')}).addTo(bigM));
      L.marker(toLL(PX[GAS[0]],PZ[GAS[0]]),{icon:poiIcon('⛽')}).addTo(bigM);L.marker(toLL(PX[WRK[0]],PZ[WRK[0]]),{icon:poiIcon('🔧')}).addTo(bigM);
      bigPlayer=L.circleMarker(toLL(PX[0],PZ[0]),{radius:9,color:'#fff',weight:3,fillColor:'#d9482b',fillOpacity:1}).addTo(bigM);
      bigM.fitBounds(line.getBounds(),{padding:[20,20]});
    }
    setTimeout(()=>{bigM.invalidateSize();const w=wp(pos);bigPlayer.setLatLng(toLL(w.x,w.z));if(bigTiles._url!==tileUrl())bigTiles.setUrl(tileUrl())},60);
  }catch(e){document.getElementById('bnote').textContent='تعذّر عرض الخريطة.'}
}
function closeBigMap(){document.getElementById('big').hidden=true;bigOpen=false}
function updateBig(){if(!bigOpen||!bigM||(mmT%20))return;try{const w=wp(pos);bigPlayer.setLatLng(toLL(w.x,w.z))}catch(e){}}
