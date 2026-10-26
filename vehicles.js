'use strict';
/* ============================================================
   vehicles.js — العربيات: مجسّمات من منحنيات جانبية + طلاء لامع + زجاج
   (وتقدر تستبدل أي نوع بموديل GLB من config.js)
   ============================================================ */
let GLASS,TIRE,RIM,CHR,BM,GLOW;const MC={},GC={};
const mat=(c,o)=>{const k=c+JSON.stringify(o||{});return MC[k]||(MC[k]=new THREE.MeshStandardMaterial(Object.assign({color:SRGB(c),roughness:.7,metalness:.05},o||{})))};
const paint=c=>MC['p'+c]||(MC['p'+c]=new THREE.MeshPhysicalMaterial({color:SRGB(c),metalness:.55,roughness:.32,clearcoat:1,clearcoatRoughness:.1}));
function initMats(){
  GLASS=new THREE.MeshPhysicalMaterial({color:SRGB('#10161d'),metalness:.9,roughness:.06});
  TIRE=mat('#111214',{roughness:.9});RIM=mat('#b8bcc2',{metalness:.9,roughness:.3});CHR=mat('#2a2d33',{roughness:.5,metalness:.4});
  BM=B('#ff2a22');GLOW=B('#fff3b0');
}
function prof(key,a,len,wd,m,bv){
  if(!GC[key]){const sh=new THREE.Shape();
    a.forEach((p,i)=>{if(!i)sh.moveTo(p[0],p[1]);else if(p.length===2)sh.lineTo(p[0],p[1]);else sh.quadraticCurveTo(p[0],p[1],p[2],p[3])});
    bv=bv||.06;const gm=new THREE.ExtrudeGeometry(sh,{depth:wd,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:3,curveSegments:12});
    gm.translate(-len/2,0,-wd/2);gm.rotateY(-Math.PI/2);GC[key]=gm}
  return new THREE.Mesh(GC[key],m);
}
function bx(g,w,h,d,x,y,z,c,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||mat(c));o.position.set(x,y,z);g.add(o);return o}
let WG,RG;
function wl(g,x,z,r,w){w=w||.26;WG=WG||new THREE.CylinderGeometry(1,1,1,20);RG=RG||new THREE.CylinderGeometry(.62,.62,1.02,16);
  const t=new THREE.Mesh(WG,TIRE);t.rotation.z=Math.PI/2;t.scale.set(r,w,r);t.position.set(x,r,z);g.add(t);
  const m=new THREE.Mesh(RG,RIM);m.rotation.z=Math.PI/2;m.scale.set(r,w,r);m.position.set(x,r,z);g.add(m)}
function blob(g,w,l){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,l),B('#000',{transparent:true,opacity:.35}));o.rotation.x=-Math.PI/2;o.position.y=.06;g.add(o)}

const SED=[[0,.38],[0,.82],[.06,.98,.3,1.0],[1.0,1.02],[1.38,1.1,1.72,1.45],[2.0,1.56,2.5,1.5],[2.9,1.45,3.3,1.06],[4.0,.98],[4.35,.92,4.4,.7],[4.4,.38]];
const SEDG=[[1.1,1.04],[1.4,1.1,1.78,1.4],[2.0,1.47,2.45,1.44],[2.85,1.4,3.22,1.06]];
function mkSedan(col,taxi){const g=new THREE.Group();g.add(prof('sed',SED,4.4,1.78,paint(col)));g.add(prof('sedg',SEDG,4.4,1.84,GLASS,.02));
  for(const z of[2.2,-2.2])bx(g,1.9,.2,.28,0,.45,z,0,CHR);bx(g,1.0,.18,.05,0,.74,2.28,0,CHR);
  for(const s of[-1,1]){bx(g,.42,.14,.06,s*.62,.82,2.25,0,GLOW);bx(g,.44,.14,.06,s*.6,.86,-2.25,0,BM);bx(g,.12,.1,.22,s*.98,1.12,.9,0,paint(col));for(const z of[-1.36,1.36])wl(g,s*.86,z,.34)}
  bx(g,.5,.16,.03,0,.62,-2.27,'#e8ecf0');
  if(taxi){bx(g,1.96,.3,3.5,0,.64,-.1,'#0c0c0c');bx(g,.55,.16,.28,0,1.64,-.1,0,B('#f4c20d'))}
  blob(g,2.3,4.8);return g}
const MIC=[[0,.42],[0,1.95],[.05,2.05,.3,2.05],[3.95,2.05],[4.4,2.05,4.75,1.35],[5.15,1.12],[5.3,1.05,5.3,.85],[5.3,.42]];
function mkMicro(){const g=new THREE.Group();g.add(prof('mic',MIC,5.3,1.9,paint('#f1efe8')));g.add(prof('micg',[[.45,1.35],[.45,1.88],[3.9,1.88],[4.55,1.4]],5.3,1.96,GLASS,.02));
  bx(g,2.0,.2,4.4,0,1.02,-.3,'#2c4f9e');bx(g,1.2,.2,.05,0,.7,2.68,0,CHR);
  for(const s of[-1,1]){bx(g,.4,.18,.06,s*.65,.9,2.66,0,GLOW);bx(g,.3,.3,.06,s*.8,1.2,-2.68,0,BM);for(const z of[-1.6,1.7])wl(g,s*.88,z,.37)}
  blob(g,2.2,5.6);return g}
const PU=[[0,.45],[0,1.12],[2.3,1.12],[2.35,1.7],[2.6,1.82,3.2,1.8],[3.7,1.78,4.0,1.2],[4.7,1.12],[4.85,1.0,4.85,.8],[4.85,.45]];
function mkPickup(col){const g=new THREE.Group();g.add(prof('pu',PU,4.85,1.85,paint(col)));g.add(prof('pug',[[2.5,1.22],[2.5,1.68],[3.2,1.7],[3.85,1.24]],4.85,1.9,GLASS,.02));bx(g,1.7,.05,2.1,0,1.14,-1.2,'#222');
  for(const s of[-1,1]){bx(g,.4,.16,.06,s*.65,.88,2.45,0,GLOW);bx(g,.36,.16,.06,s*.65,.86,-2.45,0,BM);for(const z of[-1.5,1.5])wl(g,s*.9,z,.38)}
  blob(g,2.3,5.2);return g}
const BUS=[[0,.5],[0,3.0],[0,3.4,.45,3.4],[10.4,3.4],[11,3.4,11,2.9],[11,.5]];
function mkBus(){const g=new THREE.Group();g.add(prof('bus',BUS,11,2.5,paint('#e9eef5')));g.add(prof('busg',[[.9,1.75],[.9,2.95],[10.3,2.95],[10.3,1.75]],11,2.56,GLASS,.02));
  bx(g,2.6,.5,10.6,0,1.2,0,'#2c4f9e');bx(g,2.3,1.3,.05,0,2.3,5.55,0,GLASS);
  for(const s of[-1,1]){bx(g,.4,.2,.06,s*.9,.9,5.52,0,GLOW);bx(g,.4,.2,.06,s*.9,.9,-5.52,0,BM);for(const z of[-3.2,3.2])wl(g,s*1.2,z,.55,.32)}
  blob(g,2.9,11.4);return g}
const TCAB=[[0,.7],[0,3.0],[1.8,3.0],[2.5,2.0],[2.6,.7]];
function mkTruck(col){const g=new THREE.Group(),c=prof('tcab',TCAB,2.6,2.4,paint(col));c.position.z=3.7;g.add(c);
  const gl=prof('tcabg',[[1.0,2.1],[1.0,2.85],[1.75,2.85],[2.3,2.05]],2.6,2.46,GLASS,.02);gl.position.z=3.7;g.add(gl);
  bx(g,2.55,3.2,6.6,0,2.4,-.9,'#4b5740');bx(g,2.2,.3,.1,0,.9,5.0,0,CHR);
  for(const s of[-1,1]){bx(g,.4,.2,.06,s*.9,1.0,5.03,0,GLOW);bx(g,.4,.2,.06,s*.9,.9,-4.22,0,BM);for(const z of[3.6,-1.5,-3.5])wl(g,s*1.1,z,.55,.3)}
  blob(g,2.9,10.6);return g}
const TB=[[0,.5],[0,1.1],[0,1.3,.35,1.32],[1.1,1.25],[1.5,1.2,1.7,1.05],[2.3,1.15,2.55,.85],[2.7,.7,2.7,.5]],TR=[[.1,1.78],[1.4,2.25,2.65,1.9],[2.65,1.82],[1.4,2.15,.1,1.7]];
function mkTuk(col,roof,driver){const g=new THREE.Group();g.add(prof('tkb',TB,2.7,1.25,paint(col),.05));g.add(prof('tkr',TR,2.7,1.45,paint(roof||'#16130f'),.03));
  for(const s of[-1,1]){bx(g,.06,.75,.06,s*.66,1.47,.95,'#14110d');bx(g,.06,.6,.06,s*.66,1.5,-.85,'#14110d')}
  bx(g,1.2,.62,.03,0,1.5,1.0,0,GLASS).rotation.x=-.45;bx(g,1.05,.3,.45,0,.95,-.75,'#352419');bx(g,.55,.3,.4,0,.92,.45,'#241c16');
  wl(g,0,1.15,.27,.14);bx(g,.36,.1,.7,0,.62,1.15,0,paint(col));wl(g,-.64,-.85,.3,.16);wl(g,.64,-.85,.3,.16);
  bx(g,.3,.18,.08,0,.98,1.4,0,GLOW);bx(g,.18,.1,.05,-.5,.82,-1.38,0,BM);bx(g,.18,.1,.05,.5,.82,-1.38,0,BM);bx(g,.42,.14,.03,0,.66,-1.4,'#e8ecf0');bx(g,.7,.04,.04,0,1.22,.9,0,CHR);
  if(driver){const h=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),mat('#c68e63'));h.position.set(0,1.58,.4);g.add(h);bx(g,.42,.5,.28,0,1.15,.4,'#3d4c5e')}
  blob(g,1.9,3.5);return g}

/* ---------- تجميع العربيات في المشهد ---------- */
const TYPE_KEYS=['tuk','sedan','bus','truck','taxi','micro','pickup'];
const SC5=['#e9e6de','#7f858d','#1f2a3a','#7a1f1f','#bfb9a8'];
function holder(build,key){const h=new THREE.Group(),v=build();h.add(v);h.userData={v,key};return h}
function buildVehicles(){
  initMats();
  const beamTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d'),q=x.createLinearGradient(0,128,0,0);q.addColorStop(0,'rgba(255,240,200,.9)');q.addColorStop(1,'rgba(255,240,200,0)');x.fillStyle=q;x.fillRect(0,0,64,128);return new THREE.CanvasTexture(c)})();
  const BPG=new THREE.PlaneGeometry(4,14);
  BPM=new THREE.MeshBasicMaterial({map:beamTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide});
  carM=cars.map((c,i)=>{
    const b=[()=>mkTuk(c.c,null,true),()=>mkSedan(SC5[i%5]),mkBus,()=>mkTruck('#5e6b4a'),()=>mkSedan('#f2f0ea',true),mkMicro,()=>mkPickup(SC5[(i+2)%5])][c.ty];
    const m=holder(b,TYPE_KEYS[c.ty]);const bb=new THREE.Mesh(BPG,BPM);bb.rotation.x=Math.PI/2;bb.position.set(0,.09,9);m.add(bb);scene.add(m);return m});
  player=holder(()=>mkTuk('#1d1a17','#f4c20d',true),'tuk');player.scale.set(1.2,1.2,1.2);scene.add(player);
  beamM=new THREE.MeshBasicMaterial({map:beamTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide});
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(9,24),beamM);beam.rotation.x=Math.PI/2;beam.position.set(0,.09,14);player.add(beam);
  HL=[-.55,.55].map(x=>{const l=new THREE.SpotLight(SRGB('#fff0d0'),0,95,.5,.55,1);l.position.set(x,.95,1.4);l.target.position.set(x*.6,0,30);player.add(l);player.add(l.target);return l});
  tryModels();
}
/* ---------- موديلات GLB اختيارية ---------- */
function tryModels(){
  if(!THREE.GLTFLoader)return;const ld=new THREE.GLTFLoader();
  if(THREE.DRACOLoader){const d=new THREE.DRACOLoader();d.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');ld.setDRACOLoader(d)}
  Object.keys(CFG.models).forEach(k=>{const m=CFG.models[k];if(!m||!m.url)return;
    ld.load(m.url,g=>{const o=g.scene,bb=new THREE.Box3().setFromObject(o),sz=new THREE.Vector3();bb.getSize(sz);
      const len=Math.max(sz.x,sz.z)||1,s=(m.len||4.4)/len;o.scale.setScalar(s);o.rotation.y=m.rotY||0;
      const b2=new THREE.Box3().setFromObject(o),ct=new THREE.Vector3();b2.getCenter(ct);o.position.set(-ct.x,-b2.min.y,-ct.z);
      const wrap=new THREE.Group();wrap.add(o);
      [...carM,player].forEach(h=>{if(h.userData.key!==k)return;h.remove(h.userData.v);const c=wrap.clone(true);h.add(c);h.userData.v=c});
    },undefined,()=>{});
  });
}
