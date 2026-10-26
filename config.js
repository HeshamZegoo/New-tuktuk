'use strict';
/* ============================================================
   config.js — الإعدادات + المسار (حقيقي من OSRM أو احتياطي)
   عدّل هنا: المسار، المناطق، الموديلات، عدد العربيات
   ============================================================ */
const CFG={
  useOSRM:true,                                            // true = مسار حقيقي من خدمة OSRM
  osrm:'https://router.project-osrm.org/route/v1/driving/',
  tiles:{day:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
         night:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'},
  traffic:56,
  // موديلات 3D اختيارية (GLB). سيبها null وهيستخدم الموديلات المرسومة بالكود.
  // مثال: tuk:{url:'models/tuktuk.glb',len:2.7,rotY:0}   (len = الطول بالمتر، rotY = دوران بالراديان لو الموديل مش بيبص لقدام)
  models:{tuk:null,sedan:null,taxi:null,micro:null,bus:null,truck:null,pickup:null}
};
const SL=200,F=.24,HW=7.5,MAX=SL*12,LIM=90;
const LAT0=29.961,LON0=31.254,KX=96400,KY=110574;
const XY=(a,o)=>[(o-LON0)*KX,-(a-LAT0)*KY], toLL=(x,z)=>[LAT0-z/KY,LON0+x/KX];
// نقاط المرور من المعادي لوسط البلد على كورنيش النيل (إحداثيات تقريبية — عدّلها لو حابب)
const WPT=[[29.961,31.254],[29.970,31.250],[29.982,31.244],[29.995,31.236],[30.006,31.230],[30.017,31.229],[30.027,31.231],[30.035,31.233],[30.044,31.235]];
const ZREF=[['المعادي',29.961,31.254],['كورنيش المعادي',29.970,31.250],['البساتين',29.995,31.236],['مصر القديمة',30.006,31.230],['المنيل',30.017,31.229],['جاردن سيتي',30.027,31.231],['وسط البلد',30.035,31.233]];
const ZN=[...ZREF.map(z=>z[0]),'طريق العودة'];
const LANDMARKS=[[30.0459,31.2243,'برج القاهرة'],[30.0478,31.2336,'المتحف المصري'],[30.0437,31.2357,'ميدان التحرير'],[30.0068,31.2324,'جامع عمرو'],[30.0225,31.2255,'قصر المنيل']];

let N=4800,TL=N*SL,LT=22000,U=LT/TL,SG=LT/N,PX=[],PZ=[],DX=[],DZ=[],segs=[],ZB=[],OE=0,RAD=[],GAS=[],WRK=[],GAN=[],GM={},ROUTE_LL=[],ROUTE_SRC='';
const hs=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const zone=i=>{i=(i%N+N)%N;let z=0;for(let k=1;k<ZB.length;k++)if(i>=ZB[k])z=k;return z};

/* ---------- مسار احتياطي (منحنى ناعم) لو OSRM مش متاح ---------- */
function fallbackRoute(){
  const CP=[...WPT.map(q=>XY(q[0],q[1])),...WPT.slice().reverse().map((q,i)=>{const t=XY(q[0],q[1]);return[t[0]+(i<1?900:1500),t[1]]})];
  const crp=(a,b,c,d,t)=>a.map((_,i)=>.5*(2*b[i]+(-a[i]+c[i])*t+(2*a[i]-5*b[i]+4*c[i]-d[i])*t*t+(-a[i]+3*b[i]-3*c[i]+d[i])*t*t*t));
  const DN=[];for(let k=0;k<CP.length;k++){const a=CP[(k+CP.length-1)%CP.length],b=CP[k],c=CP[(k+1)%CP.length],d=CP[(k+2)%CP.length];for(let q=0;q<40;q++)DN.push(crp(a,b,c,d,q/40))}
  return{xy:DN,join:8*40};
}
/* ---------- مسار حقيقي من OSRM ---------- */
async function osrmRoute(pts){
  const url=CFG.osrm+pts.map(p=>p[1]+','+p[0]).join(';')+'?overview=full&geometries=geojson';
  const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),7000);
  try{const r=await fetch(url,{signal:ctl.signal}),j=await r.json();if(j.code!=='Ok')throw new Error('osrm');return j.routes[0].geometry.coordinates.map(c=>[c[1],c[0]])}
  finally{clearTimeout(t)}
}
async function loadRoute(){
  let r=null;ROUTE_SRC='احتياطي';
  if(CFG.useOSRM&&typeof fetch==='function'){
    try{const a=await osrmRoute(WPT),b=await osrmRoute([WPT[WPT.length-1],WPT[0]]);
      const xy=[...a,...b.slice(1,-1)].map(p=>XY(p[0],p[1]));
      if(xy.length>50){r={xy,join:a.length-1};ROUTE_SRC='OSRM'}}catch(e){}
  }
  if(!r)r=fallbackRoute();
  setRoute(r.xy,r.join);
}
/* ---------- تحويل خط المسار لشبكة قطاعات متساوية + تنعيم + إزاحة يمين ---------- */
function headings(){DX=[];DZ=[];for(let i=0;i<N;i++){const j=(i+1)%N,dx=PX[j]-PX[i],dz=PZ[j]-PZ[i],m=Math.hypot(dx,dz)||1;DX.push(dx/m);DZ.push(dz/m)}}
function setRoute(xy,join){
  const n0=xy.length,cum=[0];
  for(let i=1;i<n0;i++)cum.push(cum[i-1]+Math.hypot(xy[i][0]-xy[i-1][0],xy[i][1]-xy[i-1][1]));
  const total=cum[n0-1]+Math.hypot(xy[0][0]-xy[n0-1][0],xy[0][1]-xy[n0-1][1]);
  N=Math.max(2500,Math.min(6500,Math.round(total/4.6)));TL=N*SL;LT=total;U=LT/TL;SG=LT/N;
  PX=[];PZ=[];
  for(let i=0,j=0;i<N;i++){const t=i*total/N;while(j<n0-1&&cum[j+1]<=t)j++;const a=xy[j],b=xy[(j+1)%n0],sl=((j<n0-1?cum[j+1]:total)-cum[j])||1,f=Math.min(1,(t-cum[j])/sl);PX.push(a[0]+(b[0]-a[0])*f);PZ.push(a[1]+(b[1]-a[1])*f)}
  OE=Math.round(cum[Math.min(join,n0-1)]/total*N);
  for(let p=0;p<6;p++){const ax=PX.slice(),az=PZ.slice();for(let i=0;i<N;i++){const a=(i+N-1)%N,b=(i+1)%N;PX[i]=(ax[a]+2*ax[i]+ax[b])/4;PZ[i]=(az[a]+2*az[i]+az[b])/4}}
  headings();
  for(let i=0;i<N;i++){PX[i]+=-DZ[i]*12;PZ[i]+=DX[i]*12}      // المرور يمين: كل اتجاه ينزاح 12م يمين فيتفصل عن الاتجاه التاني
  headings();
  segs=[];for(let i=0;i<N;i++){const j=(i+1)%N;let d=Math.atan2(DZ[j],DX[j])-Math.atan2(DZ[i],DX[i]);d=Math.atan2(Math.sin(d),Math.cos(d));segs.push({curve:Math.max(-3.5,Math.min(3.5,d*400)),dh:d})}
  // بداية كل منطقة = أقرب نقطة على المسار لإحداثيات المنطقة
  ZB=[];let prev=0;
  ZREF.forEach((z,k)=>{const r=XY(z[1],z[2]);let bi=prev,bd=1e18;for(let i=prev;i<=OE;i++){const d=(PX[i]-r[0])**2+(PZ[i]-r[1])**2;if(d<bd){bd=d;bi=i}}
    const v=k?Math.min(Math.max(bi,prev+10),OE-10):0;ZB.push(v);prev=v});
  ZB.push(OE+1);
  RAD=[.11,.40,.80].map(f=>Math.round(f*N));GAS=[Math.round(.23*N)];GAS.push(GAS[0]+14);WRK=[Math.round(.69*N)];WRK.push(WRK[0]+14);
  GAN=[{i:GAS[0]-120,t:'محطة بنزين ٥٠٠م',c:'#1f5fa8'},{i:WRK[0]-120,t:'ورشة صيانة ٥٠٠م',c:'#1f5fa8'}];
  ZN.forEach((n,z)=>GAN.push({i:ZB[z],t:n,c:'#1f7a4a'}));
  RAD.forEach(r=>{GAN.push({i:r-120,t:'رادار '+LIM+' كم/س',c:'#f2c230'});GAN.push({i:r,t:String(LIM),c:'#f2c230',r:1})});
  GM={};GAN.forEach(o=>GM[((o.i%N)+N)%N]=o);
  ROUTE_LL=[];for(let i=0;i<N;i+=4)ROUTE_LL.push(toLL(PX[i],PZ[i]));ROUTE_LL.push(ROUTE_LL[0]);
}
