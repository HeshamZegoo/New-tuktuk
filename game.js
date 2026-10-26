'use strict';
/* ============================================================
   game.js — الفيزياء، الزحمة، الأحداث، التحكم، الواجهة، التشغيل
   ============================================================ */
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
let pos=0,speed=0,px=0,steer=0,sv=0,brake=false,st='menu',time=300,dist=0,over=0,crash=0,shake=0,fuel=100,dmg=0,nit=100,flash=0,msgT=0,lastR=-1,paused=false,best=0,sens=1,tick=0,PL=[];
try{best=+localStorage.getItem('tt-best')||0}catch(e){}
const kmh=()=>speed*U*3.6*.75;               // السرعة المعروضة (أقصى سرعة ≈ 150 كم/س)
const key={},cars=[],COL=['#f4c20d','#2f9e6b','#3a6fd8','#d9482b','#e8e2d0'];
const touch=matchMedia('(pointer:coarse)').matches;
const S={res:3840,sens:1,fx:1,auto:0};   // Ultra HD 4K + HDR ثابتين

function initCars(){cars.length=0;
  for(let i=0;i<CFG.traffic;i++){const r0=Math.random(),ty=r0<.22?0:r0<.42?1:r0<.6?4:r0<.78?5:r0<.86?2:r0<.94?3:6;
    cars.push({z:rnd(0,TL),base:[-.75,-.25,.25,.75][i%4]+rnd(-.08,.08),off:0,tk:ty===0,ty,sp:MAX*[rnd(.2,.38),rnd(.42,.6),rnd(.3,.45),rnd(.25,.4),rnd(.4,.55),rnd(.35,.55),rnd(.35,.5)][ty],c:COL[i%5],ph:rnd(0,6),rel:0,hit:0})}}
function buildPL(){PL=[...ZN.map((n,z)=>({n,i:ZB[z]})),...RAD.map(r=>({n:'رادار',i:r})),{n:'محطة بنزين',i:GAS[0]},{n:'ورشة صيانة',i:WRK[0]}]}
function msg(t,c){const m=$('msg');m.textContent=t;m.style.background=c||'rgba(12,16,24,.8)';m.style.opacity=1;msgT=2.2}
function places(){if((tick++&7)!==0)return;const o=PL.map(p=>({n:p.n,d:((p.i*SL-pos+TL)%TL)*U/1000})).sort((a,b)=>a.d-b.d)[0];$('sn').textContent=o.n;$('sk').textContent=o.d.toFixed(1)+' كم'}

/* ---------- أحداث: رادار، بنزين، ورشة، منطقة ---------- */
let lastZ=-1;
function ev(dt){
  const sI=Math.floor(pos/SL)%N,cz=zone(sI);if(cz!==lastZ){lastZ=cz;$('zn').textContent=ZN[cz]}
  if(st==='run'){
    fuel=Math.max(0,fuel-dt*(.15+.45*speed/MAX));if(fuel<=0&&msgT<=0)msg('البنزين خلص! دوّر على محطة','#d9482b');
    for(const r of RAD){const d=(sI-r+N)%N;if(d<4&&lastR!==r){lastR=r;
      if(kmh()>LIM+3){time=Math.max(0,time-5);flash=.35;msg('اتصورت! غرامة ٥ ثواني','#d9482b')}else{time+=2;msg('عدّيت الرادار سليم +٢ ثانية','#1f7a4a')}}}
    if(lastR>=0&&(sI-lastR+N)%N>=6)lastR=-1;
    const slow=speed<MAX*.4;
    if(slow&&px>.96&&sI>=GAS[0]&&sI<=GAS[1])fuel=Math.min(100,fuel+30*dt);
    if(slow&&px<-.96&&sI>=WRK[0]&&sI<=WRK[1])dmg=Math.max(0,dmg-40*dt);
  }
  if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').style.opacity=0}
  if(flash>0)flash-=dt;$('fl').style.opacity=Math.max(0,flash*2);
}
/* ---------- فيزياء: نموذج سيارة (اتجاه نسبي للطريق + انزلاق) ---------- */
function update(dt){
  const pct=Math.min(1,speed/MAX),seg=segs[Math.floor(pos/SL)%N];
  if(st==='run'){
    const gas=key.g||S.auto,base=fuel<=0?MAX*.2:MAX*(1-dmg/100*.35),nOn=!!key.n&&nit>0&&!brake&&!key.h&&fuel>0;
    nit=nOn?Math.max(0,nit-35*dt):Math.min(100,nit+8*dt);
    if(brake)speed-=MAX*.6*dt;else if(key.h)speed-=MAX*.3*dt;else if(nOn)speed+=MAX*.9*dt;
    else if(gas){if(speed<base)speed+=MAX*(.28*(1-pct*pct)+.02)*dt;else if(speed>base)speed=Math.max(base,speed-MAX*.6*dt)}
    else speed=Math.max(0,speed-MAX*(speed>base?.6:.1)*dt);
    if(Math.abs(px)>1.02)speed=Math.max(speed-MAX*.5*dt,Math.min(speed,MAX*.25));
    speed=Math.max(0,Math.min(nOn?base*1.35:1e9,speed));
    sv+=(steer-sv)*Math.min(1,dt*9);
    const vm=speed*U,kap=seg.dh/SG,ym=Math.min(2.2,2.4/(1+vm/14))*sens*(key.h?1.5:1),yawc=sv*ym*Math.min(1,vm/4);
    hd+=(yawc-vm*kap)*dt;hd-=hd*(key.h?.7:3.2)*dt;hd=Math.max(-.9,Math.min(.9,hd));
    px+=vm*Math.sin(hd)*dt/HW;px=Math.max(-1.25,Math.min(1.25,px));
    const si=Math.floor(pos/SL)%N,rM=(si>=GAS[0]&&si<=GAS[1])?1.25:.92,lM=(si>=WRK[0]&&si<=WRK[1])?-1.25:-.92;
    if(px>rM){hd*=.9;px=Math.max(rM,px-dt*2);if(rM<1)speed=Math.max(speed-MAX*.35*dt,Math.min(speed,MAX*.25))}
    if(px<lM){hd*=.9;px=Math.min(lM,px+dt*2);if(lM>-1)speed=Math.max(speed-MAX*.35*dt,Math.min(speed,MAX*.25))}
    time-=dt;dist+=speed*dt*U;if(time<=0){time=0;end()}
  }else speed=MAX*.3;
  ev(dt);
  pos=(pos+speed*dt)%TL;if(shake>0)shake=Math.max(0,shake-dt*1.6);
  const t=performance.now()/1000;
  for(const c of cars){const pr=c.rel;c.z=(c.z+c.sp*dt)%TL;c.off=c.base+(c.tk?Math.sin(t*.9+c.ph)*.09:0);
    let r=((c.z-pos+TL*1.5)%TL)-TL/2;
    if(r<-20000||r>65000){c.z=(pos+rnd(30000,55000))%TL;c.hit=0;r=((c.z-pos+TL*1.5)%TL)-TL/2}c.rel=r;
    if(st==='run'){
      if(pr>0&&r<=0&&pr<TL/4){over++;time+=1.5}
      if(r>0&&r<SL*.8&&Math.abs(c.off-px)<F*.95&&speed>c.sp&&c.hit<=0){crash++;hd+=(Math.random()<.5?-1:1)*.35;dmg=Math.min(100,dmg+20);time=Math.max(0,time-3);speed=Math.max(MAX*.12,c.sp*.5);shake=.5;c.hit=1}}
    if(c.hit>0)c.hit-=dt}
}
/* ---------- صوت الموتور ---------- */
let AC,eo,eg;
function engInit(){try{if(AC)return;AC=new(window.AudioContext||window.webkitAudioContext)();eo=AC.createOscillator();eg=AC.createGain();eo.type='sawtooth';eg.gain.value=0;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;eo.connect(f);f.connect(eg);eg.connect(AC.destination);eo.start()}catch(e){}}
function engine(){if(!eo)return;const p=Math.min(1.35,speed/MAX),g=Math.min(5,Math.floor(p*5)+1),r=(p*5)%1;eo.frequency.value=55+r*140+g*12;eg.gain.value=(st==='run'&&!paused)?.03+.03*((key.g||S.auto||key.n)?1:0):0}
function horn(){try{engInit();const a=AC;[420,530].forEach(f=>{const o=a.createOscillator(),v=a.createGain();o.type='square';o.frequency.value=f;v.gain.value=.05;o.connect(v);v.connect(a.destination);o.start();o.stop(a.currentTime+.35)})}catch(e){}}
/* ---------- الواجهة ---------- */
const E={};['tm','ov2','km','sp','gear','rpmf','fu','dm','nt'].forEach(i=>E[i]=$(i));
function hud(){
  places();engine();
  const p=Math.min(1.35,speed/MAX),g=Math.min(5,Math.floor(p*5)+1);
  E.sp.textContent=Math.round(kmh());
  E.gear.textContent=g;E.rpmf.style.width=Math.min(100,((p*5)%1)*85+15*Math.min(1,p*5))+'%';
  E.tm.textContent=Math.max(0,Math.ceil(time));E.ov2.textContent=over;E.km.textContent=Math.floor(dist/LT)+1;
  E.fu.style.width=fuel+'%';E.dm.style.width=(100-dmg)+'%';E.nt.style.width=nit+'%';
}
function start(){
  try{screen.orientation.lock('landscape')}catch(e){}
  engInit();hd=0;chd=0;pos=0;speed=0;px=0;time=300;nit=100;fuel=100;dmg=0;lastR=-1;dist=0;over=0;crash=0;steer=0;sv=0;
  cars.forEach(c=>{c.z=rnd(10000,55000);c.hit=0});st='run';$('ov').hidden=true;document.body.classList.add('playing');
  setTimeout(()=>{if(typeof mini!=='undefined'&&mini)mini.invalidateSize()},50);
}
function end(){
  st='over';if(eg)eg.gain.value=0;document.body.classList.remove('playing');
  const sc=over*10+Math.round(dist/200)-crash*5;if(sc>best){best=sc;try{localStorage.setItem('tt-best',best)}catch(e){}}
  $('t').textContent='الوقت خلص';$('d').innerHTML='النتيجة: <b>'+sc+'</b> · أحسن نتيجة: <b>'+best+'</b><br>تعدّيت '+over+' · خبطات '+crash+' · '+(dist/1000).toFixed(1)+' كم';$('go').textContent='العب تاني';$('ov').hidden=false;
}
/* ---------- التحكم ---------- */
function sk(){steer=(key.l?-1:0)+(key.r?1:0);brake=!!key.b}
function bind(id,k){const el=$(id);
  const on=e=>{e.preventDefault();if(!key[k]&&navigator.vibrate)navigator.vibrate(8);key[k]=1;el.classList.add('on');sk()},off=()=>{key[k]=0;el.classList.remove('on');sk()};
  el.addEventListener('pointerdown',e=>{try{el.setPointerCapture(e.pointerId)}catch(x){}on(e)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(v=>el.addEventListener(v,off));
  el.addEventListener('contextmenu',e=>e.preventDefault())}
[['lb','l'],['rb','r'],['gs','g'],['bk','b'],['hb','h'],['ni','n']].forEach(a=>bind(a[0],a[1]));
const KM={ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r',ArrowUp:'g',w:'g',ArrowDown:'b',s:'b',' ':'b',n:'n',Shift:'n',h:'h'};
addEventListener('keydown',e=>{const k=KM[e.key];if(k){key[k]=1;sk();e.preventDefault()}});
addEventListener('keyup',e=>{const k=KM[e.key];if(k){key[k]=0;sk()}});
document.addEventListener('contextmenu',e=>e.preventDefault());
$('ps').onclick=()=>{paused=!paused;$('ps').textContent=paused?'▶':'❚❚'};
$('hn').addEventListener('pointerdown',e=>{e.preventDefault();horn()});
$('tn').onclick=()=>{nightT=nightT?0:1;$('tn').textContent=nightT?'🌙':'☀️'};
$('mp').onclick=()=>{paused=true;openBigMap()};
$('bx2').onclick=()=>{closeBigMap();paused=false;$('ps').textContent='❚❚'};
$('go').onclick=start;
// إعدادات كارت البداية
document.querySelectorAll('[data-set]').forEach(g=>{const k=g.dataset.set;
  const mark=()=>g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(S[k])===b.dataset.v));
  g.querySelectorAll('button').forEach(b=>b.onclick=()=>{S[k]=+b.dataset.v;mark();
    if(k==='sens')sens=S.sens});
  mark()});
/* ---------- حلقة اللعب + التشغيل ---------- */
let last=0,fpsN=0,fpsT=0;
function loop(ts){requestAnimationFrame(loop);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  fpsN++;if(ts-fpsT>500){const el=$('fps');if(el&&fpsT)el.textContent=Math.round(fpsN*1000/(ts-fpsT))+' FPS';fpsN=0;fpsT=ts}
  try{if(!paused)update(dt);render();if(st==='run')hud();updateMini();updateBig()}catch(e){console.error(e)}}
async function boot(){
  try{
    if(typeof THREE==='undefined'||typeof buildWorld!=='function')throw new Error('مكتبة Three.js ماتحملتش');
    $('lt').textContent='جاري تحميل مسار القاهرة…';await loadRoute();
    buildPL();initCars();$('lt').textContent='جاري بناء العالم ثلاثي الأبعاد…';await new Promise(r=>setTimeout(r,40));
    res=S.res;sens=S.sens;fxWanted=!!S.fx;buildWorld();initMaps();
    $('lt').textContent='';$('loading').classList.add('off');
    if(ROUTE_SRC!=='OSRM')setTimeout(()=>msg('المسار الاحتياطي شغّال (OSRM مش متاح دلوقتي)'),500);
    requestAnimationFrame(loop);
  }catch(e){$('lt').textContent='حصلت مشكلة في التحميل: '+e.message;console.error(e)}
}
addEventListener('resize',()=>{if(renderer)size()});
boot();
