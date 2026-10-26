'use strict';
/* ============================================================
   world.js — العالم 3D: سما HDR، طريق، مباني، نخل، إضاءة نهار/ليل،
   كشافات حقيقية، وتأثيرات سينمائية (Bloom + تحويل ألوان + Motion blur)
   ============================================================ */
let scene,cam,renderer,composer,bloom,finalP,post=false,skyU,skyM,skyScene,pmrem,hemi,sun,moon,RDM,WM,groundM,bMat,lampM,poolM,BPM,beamM,radM,HL=[],carM=[],player;
let night=0,nightT=0,lastT=0,W=innerWidth,H=innerHeight,res=3840,fxWanted=true,hd=0,chd=0;
const MT=new THREE.Matrix4(),QQ=new THREE.Quaternion(),PS=new THREE.Vector3(),SC=new THREE.Vector3(),AX=new THREE.Vector3(0,1,0),ONE=new THREE.Vector3(1,1,1);
const SRGB=c=>new THREE.Color(c).convertSRGBToLinear();
const B=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:SRGB(c)},o||{}));
function wp(p){const u=((p/SL)%N+N)%N,i=Math.floor(u),f=u-i,j=(i+1)%N;let dx=DX[i]+(DX[j]-DX[i])*f,dz=DZ[i]+(DZ[j]-DZ[i])*f;const m=Math.hypot(dx,dz)||1;return{x:PX[i]+(PX[j]-PX[i])*f,z:PZ[i]+(PZ[j]-PZ[i])*f,dx:dx/m,dz:dz/m}}
function tex(t,bg,fg,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.font='800 '+Math.round(h*.52)+'px Tajawal,Tahoma,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(t,w/2,h/2+4);const r=new THREE.CanvasTexture(c);r.encoding=THREE.sRGBEncoding;return r}
function asphaltTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#c8c8c8';x.fillRect(0,0,128,128);
  for(let i=0;i<2200;i++){const v=150+Math.random()*90|0;x.fillStyle='rgb('+v+','+v+','+v+')';x.fillRect(Math.random()*128,Math.random()*128,1.6,1.6)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t}

/* ---------- شادر السما HDR (شمس > 1.0 + سحب + نجوم + قمر) ---------- */
const SKY_FS=`uniform vec3 sun;uniform float night;uniform float time;varying vec3 vd;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}
void main(){vec3 d=normalize(vd);float e=clamp(d.y,0.,1.);
vec3 col=mix(vec3(.80,.85,.88),vec3(.14,.34,.76),pow(e,.5));
float sd=max(dot(d,normalize(sun)),0.);
col+=vec3(1.,.8,.55)*pow(sd,6.)*.28+vec3(1.,.97,.9)*pow(sd,700.)*6.;
if(d.y>.01){vec2 uv=d.xz/(d.y+.12)*1.4+vec2(time*.012,0.);float c=smoothstep(.5,.82,fbm(uv));col=mix(col,vec3(1.),c*.85*smoothstep(.01,.25,d.y));}
vec3 nc=mix(vec3(.045,.06,.11),vec3(.008,.015,.05),pow(e,.5));
vec2 su=d.xz/(d.y+.25)*55.;nc+=vec3(step(.988,h(floor(su)))*smoothstep(.04,.35,d.y));
float md=dot(d,normalize(vec3(-.4,.55,-.7)));
nc+=vec3(.9,.92,1.)*smoothstep(.9986,.9993,md)*3.+vec3(.4,.5,.8)*pow(max(md,0.),30.)*.12;
col=mix(col,nc,night);gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
#include <tonemapping_fragment>
#include <encodings_fragment>
}`;
/* ---------- المرحلة الأخيرة: Tone-mapping ACES + ألوان سينمائية + فينييت + Motion blur ---------- */
const FINAL={uniforms:{tDiffuse:{value:null},speed:{value:0},night:{value:0}},
vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:`uniform sampler2D tDiffuse;uniform float speed,night;varying vec2 vUv;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec2 c=vUv-.5;float r=length(c);vec3 col=texture2D(tDiffuse,vUv).rgb;float s=speed*.05;
if(speed>.01){col=vec3(0.);for(int i=0;i<5;i++){float t=float(i)/4.;col+=texture2D(tDiffuse,.5+c*(1.-s*t*r*2.)).rgb;}col/=5.;
float ca=.0012+speed*.004;col.r=mix(col.r,texture2D(tDiffuse,.5+c*(1.+ca*r*8.)).r,.6);col.b=mix(col.b,texture2D(tDiffuse,.5+c*(1.-ca*r*8.)).b,.6);}
float l=dot(col,vec3(.2126,.7152,.0722));
col=mix(col,col*vec3(.92,1.,1.08),.5*(1.-smoothstep(0.,.6,l)));col=mix(col,col*vec3(1.08,1.,.92),.4*smoothstep(.4,1.5,l));
col*=mix(1.,1.3,night);col=aces(col);
col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,1.12);
col*=1.-.55*smoothstep(.35,.9,r);col=pow(col,vec3(1./2.2));gl_FragColor=vec4(col,1.);}`};

/* ---------- بناء العالم ---------- */
function buildWorld(){
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:false,powerPreference:'high-performance',stencil:false});
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(52,1,.3,3200);scene.fog=new THREE.Fog(SRGB('#c9d3d8'),150,1100);
  hemi=new THREE.HemisphereLight(SRGB('#dbe8ff'),SRGB('#b9a47c'),.85);sun=new THREE.DirectionalLight(SRGB('#fff1dc'),1.25);moon=new THREE.DirectionalLight(SRGB('#8fa8ff'),0);
  sun.position.set(50,62,40);moon.position.set(-40,55,-70);scene.add(hemi,sun,moon);
  // سما + بيئة انعكاسات HDR (PMREM)
  skyU={sun:{value:new THREE.Vector3(50,62,40).normalize()},night:{value:0},time:{value:0}};
  const skyMat=new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:'varying vec3 vd;void main(){vd=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:SKY_FS});
  skyM=new THREE.Mesh(new THREE.SphereGeometry(2800,32,20),skyMat);scene.add(skyM);
  skyScene=new THREE.Scene();skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),skyMat));pmrem=new THREE.PMREMGenerator(renderer);
  radM=B('#ee3333');
  // أرض + طريق
  groundM=new THREE.MeshStandardMaterial({color:SRGB('#bba883'),roughness:1});
  RDM=new THREE.MeshStandardMaterial({vertexColors:true,map:asphaltTex(),roughness:.92,metalness:0,side:THREE.DoubleSide});
  WM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.12,metalness:.15,side:THREE.DoubleSide});
  const gp=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),groundM);gp.rotation.x=-Math.PI/2;gp.position.y=-.05;scene.add(gp);
  const colC={},cc=h=>colC[h]||(colC[h]=SRGB(h));
  function strip(l1,y1,l2,y2,col,skip,mo){const P=[],C=[],UV=[],I=[];let v=0;
    for(let i=0;i<N;i++){if(skip&&skip(i))continue;const j=(i+1)%N,c=cc(col(i));
      [[i,i],[j,i+1]].forEach(([k,ci])=>{const dx=DX[k],dz=DZ[k];for(const[l,y]of[[l1,y1],[l2,y2]]){P.push(PX[k]-dz*l,y,PZ[k]+dx*l);C.push(c.r,c.g,c.b);UV.push((l+y)*.25,ci*SG*.25)}});
      I.push(v,v+1,v+2,v+2,v+1,v+3);v+=4}
    if(!I.length)return;const gm=new THREE.BufferGeometry();gm.setAttribute('position',new THREE.Float32BufferAttribute(P,3));gm.setAttribute('color',new THREE.Float32BufferAttribute(C,3));gm.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));gm.setIndex(I);gm.computeVertexNormals();scene.add(new THREE.Mesh(gm,mo||RDM))}
  const alt=(a,b)=>i=>(i>>2)&1?a:b,gS=i=>i>=GAS[0]-1&&i<=GAS[1]+1,wS=i=>i>=WRK[0]-1&&i<=WRK[1]+1,GZ=ZB[6]-80;
  strip(-26,.012,-520,.012,alt('#5b8ea6','#558aa2'),i=>i>OE||i>=GZ,WM);strip(-26,.012,-1100,.012,alt('#5b8ea6','#558aa2'),i=>i<GZ||i>OE,WM);
  strip(-170,.02,-400,.02,alt('#7f9f5e','#789856'),i=>i<ZB[4]-40||i>ZB[5]+60);strip(-330,.02,-1000,.02,alt('#7f9f5e','#789856'),i=>i<GZ||i>OE);
  strip(-HW,.02,HW,.02,alt('#5b5e66','#565961'));
  strip(-HW,.04,-HW+.7,.04,alt('#d4622c','#c9572a'));strip(HW-.7,.04,HW,.04,alt('#d4622c','#c9572a'));
  for(const l of[-3.75,0,3.75])strip(l-.07,.05,l+.07,.05,()=>'#f1ead7',i=>!((i>>2)&1));
  const bc=alt('#d6cfc0','#b9b2a4');
  for(const sd of[-1,1]){const sk=sd>0?gS:wS,a=sd*(HW+.4),b=sd*(HW+.9);strip(a,0,a,.9,bc,sk);strip(a,.9,b,.9,()=>'#e4ddcd',sk);strip(b,.9,b,0,bc,sk)}
  strip(HW,.03,HW+4.5,.03,()=>'#55514a',gS);strip(-HW-4.5,.03,-HW,.03,()=>'#55514a',wS);
  // مباني (شبابيك بتنوّر بالليل)
  const mkFac=lit=>{const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.fillStyle=lit?'#000':'#e9e4d6';x.fillRect(0,0,64,128);
    for(let r=0;r<10;r++)for(let q=0;q<4;q++){x.fillStyle=lit?(hs(r*7+q*13)>.45?'#ffd890':'#000'):'rgba(40,62,74,.85)';x.fillRect(5+q*15,6+r*12,9,7)}
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t};
  bMat=new THREE.MeshStandardMaterial({map:mkFac(0),roughness:.9,metalness:0,emissive:SRGB('#ffd9a0'),emissiveMap:mkFac(1),emissiveIntensity:0});
  {const bg=new THREE.BoxGeometry(1,1,1);bg.translate(0,.5,0);const bm=new THREE.InstancedMesh(bg,bMat,N),pal=['#d8cfae','#c9b890','#e0d8bf','#bba98a','#d2c4a0'].map(SRGB);let n=0;
    for(let j=0;j<N&&n<N-2;j+=3)for(const sd of[-1,1]){if(hs(j*7+sd)<.15)continue;if(sd<0&&j<=OE)continue;if(sd>0&&j>=GAS[0]-6&&j<=GAS[1]+6||sd<0&&j>=WRK[0]-6&&j<=WRK[1]+6)continue;
      const zh=[.9,.5,.7,.7,.9,1.3,1.9,1][zone(j)],w=14+hs(j+sd)*14,h=(12+hs(j*2+sd)*40)*zh,d=14+hs(j*5+sd)*10,off=sd*(HW+14+hs(j*3+sd)*22+w/2);
      QQ.setFromAxisAngle(AX,Math.atan2(DX[j],DZ[j]));PS.set(PX[j]-DZ[j]*off,0,PZ[j]+DX[j]*off);SC.set(w,h,d);MT.compose(PS,QQ,SC);bm.setMatrixAt(n,MT);bm.setColorAt(n,pal[Math.floor(hs(j+9*sd)*5)]);n++}
    bm.count=n;scene.add(bm)}
  // نخل على كورنيش النيل
  {const tg=new THREE.CylinderGeometry(.16,.26,7,6);tg.translate(0,3.5,0);const cg=new THREE.SphereGeometry(1,8,6);cg.scale(3.4,1.1,3.4);cg.translate(0,7.3,0);
    const tm=new THREE.InstancedMesh(tg,mat('#6b5a44'),N),cm=new THREE.InstancedMesh(cg,mat('#3f6b32',{roughness:.9}),N);let n=0;
    for(let j=0;j<N;j+=9){if(gS(j)||wS(j))continue;const o=-(HW+4+hs(j)*2);QQ.setFromAxisAngle(AX,hs(j+3)*6);PS.set(PX[j]-DZ[j]*o,0,PZ[j]+DX[j]*o);const s=.8+hs(j+5)*.5;SC.set(s,s,s);MT.compose(PS,QQ,SC);tm.setMatrixAt(n,MT);cm.setMatrixAt(n,MT);n++}
    tm.count=cm.count=n;scene.add(tm,cm)}
  // أعمدة إنارة + بقع ضوء على الأسفلت
  const poolTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),q=x.createRadialGradient(32,32,0,32,32,32);q.addColorStop(0,'rgba(255,225,160,.9)');q.addColorStop(1,'rgba(255,225,160,0)');x.fillStyle=q;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  poolM=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});lampM=B('#9a927a');
  {const pg=new THREE.CylinderGeometry(.12,.15,9,6);pg.translate(0,4.5,0);const hg=new THREE.BoxGeometry(1.8,.2,.5);hg.translate(0,9,0);const plg=new THREE.PlaneGeometry(18,18);plg.rotateX(-Math.PI/2);plg.translate(0,.09,0);
    const pm2=new THREE.InstancedMesh(pg,new THREE.MeshStandardMaterial({color:SRGB('#6b6660'),roughness:.6,metalness:.5}),N),hm=new THREE.InstancedMesh(hg,lampM,N),pl=new THREE.InstancedMesh(plg,poolM,N);let n=0;
    for(let j=0;j<N;j+=8)for(const sd of[-1,1]){if(sd>0&&gS(j)||sd<0&&wS(j))continue;const o=sd*(HW+1.4);PS.set(PX[j]-DZ[j]*o,0,PZ[j]+DX[j]*o);QQ.setFromAxisAngle(AX,Math.atan2(DX[j],DZ[j])+Math.PI/2);MT.compose(PS,QQ,ONE);pm2.setMatrixAt(n,MT);hm.setMatrixAt(n,MT);
      const lp=sd*(HW-3);PS.set(PX[j]-DZ[j]*lp,0,PZ[j]+DX[j]*lp);QQ.set(0,0,0,1);MT.compose(PS,QQ,ONE);pl.setMatrixAt(n,MT);n++}
    pm2.count=hm.count=pl.count=n;scene.add(pm2,hm,pl)}
  buildVehicles();
  // لوحات فوق الطريق + رادار
  GAN.forEach(o=>{const j=((o.i%N)+N)%N,g2=new THREE.Group(),fg=o.c==='#f2c230'?'#1d1a17':'#ffffff',bw=2*(HW+1.6),bd=new THREE.Mesh(new THREE.PlaneGeometry(bw,1.7),new THREE.MeshBasicMaterial({map:tex(o.t,o.c,fg,512,128)}));bd.position.set(0,6.3,0);g2.add(bd);
    for(const s of[-1,1])bx(g2,.4,6.2,.4,s*(HW+1.4),3.1,0,'#3a3631');
    if(o.r){bx(g2,1.2,.7,.8,0,5.2,.2,'#14110d');const lp=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),radM);lp.position.set(0,5.2,.65);g2.add(lp)}
    g2.position.set(PX[j],0,PZ[j]);g2.rotation.y=Math.atan2(DX[j],DZ[j])+Math.PI;scene.add(g2)});
  const place=(g,j,off,yaw)=>{g.position.set(PX[j]-DZ[j]*off,0,PZ[j]+DX[j]*off);g.rotation.y=Math.atan2(DX[j],DZ[j])+yaw;scene.add(g)};
  {const g=new THREE.Group();bx(g,12,.5,9,0,5,0,'#e8453c');for(const x of[-5,5])for(const z of[-3.5,3.5])bx(g,.4,5,.4,x,2.5,z,'#d8d2c4');for(const x of[-2,2])bx(g,.9,1.4,.6,x,.7,0,'#e8453c');
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(6,1.6),new THREE.MeshBasicMaterial({map:tex('بنزين','#d9482b','#fff',256,72)}));sg.position.set(0,6.3,4.6);g.add(sg);place(g,GAS[0]+6,HW+9,Math.PI/2)}
  {const g=new THREE.Group();bx(g,12,5,8,0,2.5,0,'#8c8678');bx(g,3.4,3.6,.2,-2.8,1.8,4.05,'#3c3a36');bx(g,3.4,3.6,.2,2.8,1.8,4.05,'#3c3a36');
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(6,1.6),new THREE.MeshBasicMaterial({map:tex('ورشة','#1f5fa8','#fff',256,72)}));sg.position.set(0,5.9,4.1);g.add(sg);place(g,WRK[0]+6,-(HW+9),-Math.PI/2)}
  // معالم القاهرة في أماكنها التقريبية
  const LMK=(a,o,fn)=>{const q=XY(a,o);fn(q[0],q[1])};
  LMK(30.0459,31.2243,(x,z)=>{const g=new THREE.Group(),a=new THREE.Mesh(new THREE.CylinderGeometry(4,7,160,12),mat('#d2c7b4')),t=new THREE.Mesh(new THREE.SphereGeometry(11,12,8),mat('#cfc2ab')),sp=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,35,6),mat('#9a8f7e'));a.position.y=80;t.position.y=162;t.scale.y=.6;sp.position.y=185;g.add(a,t,sp);g.position.set(x,0,z);scene.add(g)});
  LMK(30.0435,31.2310,(x,z)=>bx(scene,38,140,24,x,70,z,'#9fa8b4'));
  LMK(30.0478,31.2336,(x,z)=>bx(scene,70,16,40,x,8,z,'#b87a5a'));
  LMK(30.0437,31.2357,(x,z)=>bx(scene,120,45,60,x,22,z,'#b9ad92'));
  LMK(30.0225,31.2255,(x,z)=>{bx(scene,50,12,30,x,6,z,'#c9b98f');bx(scene,14,24,14,x+30,12,z,'#d8cdaa')});
  LMK(30.0068,31.2324,(x,z)=>{const g=new THREE.Group(),d=new THREE.Mesh(new THREE.SphereGeometry(14,16,10,0,Math.PI*2,0,Math.PI/2),mat('#c9c0a8'));d.position.y=22;g.add(d);bx(g,34,22,34,0,11,0,'#d9d0b8');
    for(const o of[-26,26]){const m=new THREE.Mesh(new THREE.CylinderGeometry(2,2.6,70,8),mat('#d9d0b8'));m.position.set(o,35,0);g.add(m);const t=new THREE.Mesh(new THREE.ConeGeometry(3,10,8),mat('#6f8f7a'));t.position.set(o,75,0);g.add(t)}g.position.set(x,0,z);scene.add(g)});
  setupPost();applyTOD(0);regenEnv();size();setFX(fxWanted);
}
function regenEnv(){try{const o=scene.environment;scene.environment=pmrem.fromScene(skyScene,.04).texture;if(o&&o.dispose)o.dispose()}catch(e){}}

/* ---------- تأثيرات سينمائية HDR ---------- */
function setupPost(){
  try{
    if(!THREE.EffectComposer||!THREE.UnrealBloomPass||!THREE.ShaderPass||!THREE.RenderPass)return;
    const rt=new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,encoding:THREE.LinearEncoding});
    composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,cam));
    bloom=new THREE.UnrealBloomPass(new THREE.Vector2(W,H),.45,.65,.9);composer.addPass(bloom);
    finalP=new THREE.ShaderPass(FINAL);composer.addPass(finalP);
  }catch(e){composer=null}
}
function setFX(on){
  fxWanted=on;post=!!(on&&composer);
  if(!renderer)return;
  renderer.toneMapping=post?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;
  scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>{m.needsUpdate=true})});
  if(skyM&&skyM.material)skyM.material.needsUpdate=true;
}
function size(){
  W=innerWidth;H=innerHeight;const pr=Math.min(res/Math.max(W,H),5);
  renderer.setPixelRatio(pr);renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();
  if(composer){composer.setPixelRatio(pr);composer.setSize(W,H)}
}
/* ---------- نهار / ليل ---------- */
const dayF=SRGB('#c9d3d8'),nightF=SRGB('#0a0f1c'),lampD=SRGB('#9a927a'),lampN=SRGB('#fff0b8');
function applyTOD(k){
  hemi.intensity=.85-.63*k;sun.intensity=1.25*(1-k);moon.intensity=.35*k;skyU.night.value=k;scene.fog.color.copy(dayF).lerp(nightF,k);
  renderer.toneMappingExposure=1+.3*k;bMat.emissiveIntensity=k*1.4;lampM.color.copy(lampD).lerp(lampN,k);
  beamM.opacity=k*.3;BPM.opacity=k*.4;poolM.opacity=k*.6;HL.forEach(l=>l.intensity=3.2*k);
  RDM.roughness=.92-.5*k;groundM.roughness=1-.25*k;if(bloom)bloom.strength=.4+.5*k;if(finalP)finalP.uniforms.night.value=k;
}
/* ---------- الرسم كل فريم ---------- */
function render(){
  const t=performance.now()/1000,dtr=Math.min(.1,t-lastT);lastT=t;
  if(night!==nightT){night+=Math.sign(nightT-night)*Math.min(Math.abs(nightT-night),dtr*.7);applyTOD(night);if(night===nightT)regenEnv()}
  skyU.time.value=t;
  const w=wp(pos),rx=-w.dz,rz=w.dx,ex=w.x+rx*px*HW,ez=w.z+rz*px*HW;
  player.position.set(ex,0,ez);player.rotation.y=Math.atan2(w.dx,w.dz)-hd;
  const sx=shake>0?rnd(-1,1)*shake*.25:0,sy=shake>0?rnd(-1,1)*shake*.2:0;
  chd+=(hd*.85-chd)*Math.min(1,dtr*4);const ca=Math.cos(chd),sa=Math.sin(chd),cdx=w.dx*ca+rx*sa,cdz=w.dz*ca+rz*sa;
  cam.position.set(ex-cdx*10.5+sx,3.6+sy,ez-cdz*10.5);cam.lookAt(ex+cdx*3,1.1,ez+cdz*3);
  const sp=Math.min(1.4,speed/MAX);cam.fov=52+sp*14;cam.updateProjectionMatrix();skyM.position.copy(cam.position);radM.color.set(flash>0?'#ffffff':'#ee3333');
  cars.forEach((c,i)=>{const m=carM[i],v=c.rel>-1000&&c.rel<58000;m.visible=v;if(!v)return;const q=wp(c.z);m.position.set(q.x-q.dz*c.off*HW,0,q.z+q.dx*c.off*HW);m.rotation.y=Math.atan2(q.dx,q.dz)+(c.tk?Math.sin(t*.9+c.ph)*.05:0)});
  if(post){finalP.uniforms.speed.value=Math.max(0,sp-.55)*(.6+(key.n?.6:0));composer.render()}else renderer.render(scene,cam);
}
