/* Cinematic motion, pointer and scroll rendering */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const fadeWindow=(p,a,b,c,d)=>{if(p<a||p>d)return 0;if(p<b)return seg(p,a,b);if(p<=c)return 1;return 1-seg(p,c,d);}
const mix=(a,b,t)=>a+(b-a)*t;
const mixPts=(a,b,t)=>a.map((p,i)=>[mix(p[0],b[i][0],t),mix(p[1],b[i][1],t)]);
const ptsToPath=pts=>'M'+pts.map(p=>p[0]+' '+p[1]).join(' L');

const progress=document.getElementById('progress');
const cursorGlow=document.getElementById('cursorGlow');
const sculpture=document.getElementById('signalSculpture');
const story=document.getElementById('story');
const scene=document.getElementById('scene');
const device=document.getElementById('device');
const pulseGlowBand=document.getElementById('pulseGlowBand');
const paper=document.getElementById('paper');
const app=document.getElementById('app');
const measureStage=document.getElementById('measureStage');
const measure=document.getElementById('measureLayer');
const measureNo=document.getElementById('measureNo');
const specBand=document.getElementById('specBand');
const measureSpec=document.getElementById('measureSpec');
const contexts=[...document.querySelectorAll('.context')];
const morphBridge=document.getElementById('morphBridge');
const morphNumber=document.getElementById('morphNumber');
const morphDot=document.getElementById('morphDot');
const particles=[...document.querySelectorAll('.morphParticle')];
const analysis=document.getElementById('analysisLayer');
const streamInner=document.getElementById('streamInner');
const processLine=document.getElementById('processLine');
const kpis=[...document.querySelectorAll('.kpi')];
const trace=document.getElementById('traceLayer');
const deploy=document.getElementById('deployLayer');
const thread=document.getElementById('threadPath');
const threadCursor=document.getElementById('threadCursor');
const menuBtn=document.getElementById('mobileMenuBtn');
const mobileMenu=document.getElementById('mobileMenu');
const preloader=document.getElementById('preloader');
const contextCursor=document.getElementById('contextCursor');
const contextCursorLabel=document.getElementById('contextCursorLabel');
const deviceReflection=document.getElementById('deviceReflection');
const revealEls=[...document.querySelectorAll('[data-reveal]')];
const mobileActs=[...document.querySelectorAll('.mobileAct')];
const mobileDetectValue=document.querySelector('.mobileDetectValue');
const mobileTolerance=document.querySelector('.mobileTolerance');
const mobileMorphValue=document.querySelector('.mobileMorphValue');
const mobileTraceItems=[...document.querySelectorAll('.mobileTraceItem')];

const mobileStickyCta=document.getElementById('mobileStickyCta');
const mobilePulsePath=document.getElementById('mobilePulsePath');
const mobilePulseCursor=document.getElementById('mobilePulseCursor');
const mobileTraceInteractive=[...document.querySelectorAll('.mobileTraceItem[role="button"]')];

const cloudTab=document.getElementById('cloudTab');
const premTab=document.getElementById('premTab');
const mobileDeployPanel=document.getElementById('mobileDeployPanel');

const magneticEls=[...document.querySelectorAll('.magnetic')];

const desktopChapters=[...document.querySelectorAll('.desktopChapter')];
const mobileChapters=[...document.querySelectorAll('.mobileChapter')];
const desktopDots=[...document.querySelectorAll('#desktopRail i')];
const mobileDots=[...document.querySelectorAll('#mobileRail i')];

let storyStart=0, storyTravel=1, ticking=false, storyActive=false, mobileMode=window.matchMedia('(max-width: 820px)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');
const lowPowerDevice =
  (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2) ||
  (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 2);
let pointerDirty=false, pointerX=innerWidth/2, pointerY=innerHeight/2;
let contextMode=''; let contextVisible=false; let magneticTarget=null; let magneticDirty=false;
let resizeObserver;
let mouseNX=0, mouseNY=0;
let lastScroll=window.scrollY || 0, lastTs=performance.now(), velocity=0;

const pulseA=[[0,318],[58,316],[117,313],[175,309],[233,304],[292,301],[350,297],[408,293],[467,290],[525,286],[583,224],[642,288],[700,284]];
const pulseB=[[0,325],[58,325],[117,325],[175,325],[233,325],[292,325],[350,325],[408,325],[467,325],[525,325],[583,276],[642,325],[700,325]];
const pulseC=[[0,360],[58,348],[117,352],[175,338],[233,344],[292,329],[350,334],[408,316],[467,321],[525,303],[583,307],[642,296],[700,289]];
const pulseD=[[0,305],[58,304],[117,302],[175,301],[233,300],[292,298],[350,297],[408,296],[467,295],[525,293],[583,292],[642,291],[700,290]];



function setContextCursor(mode,visible){
  contextMode=mode;
  contextVisible=visible;
  if(!finePointer.matches || reducedMotion.matches) return;
  contextCursorLabel.textContent=mode||'Scroll';
  contextCursor.classList.toggle('visible',visible);
}

function updateMagnetic(){
  if(!finePointer.matches || reducedMotion.matches || lowPowerDevice || !magneticTarget) return;
  const r=magneticTarget.getBoundingClientRect();
  const cx=r.left+r.width/2;
  const cy=r.top+r.height/2;
  const dx=pointerX-cx, dy=pointerY-cy;
  const dist=Math.hypot(dx,dy);
  const radius=Math.max(90,Math.max(r.width,r.height)*1.5);
  if(dist<radius){
    const strength=(1-dist/radius);
    magneticTarget.style.setProperty('--mag-x',(dx*0.10*strength).toFixed(2)+'px');
    magneticTarget.style.setProperty('--mag-y',(dy*0.10*strength).toFixed(2)+'px');
    contextCursor.classList.add('active');
  }else{
    magneticTarget.style.setProperty('--mag-x','0px');
    magneticTarget.style.setProperty('--mag-y','0px');
    contextCursor.classList.remove('active');
  }
}

function resetMagnetic(el){
  if(!el) return;
  el.style.setProperty('--mag-x','0px');
  el.style.setProperty('--mag-y','0px');
  contextCursor.classList.remove('active');
}

function cacheLayout(){
  mobileMode=window.matchMedia('(max-width: 820px)').matches;
  const pageY=window.scrollY || document.documentElement.scrollTop;
  const rect=story.getBoundingClientRect();
  storyStart=pageY+rect.top;
  storyTravel=Math.max(1,story.offsetHeight-innerHeight);
}

function currentPhase(p){
  if(mobileMode){
    return Math.min(3, Math.floor(p*4));
  }
  return Math.min(5, Math.floor(p*6));
}


function setMotionLayers(activeEls){
  const all=[device,paper,app,measure,morphBridge,analysis,trace,deploy];
  const activeSet=new Set(activeEls.filter(Boolean));
  all.forEach(el=>el.classList.toggle('motionActive',activeSet.has(el)));
}

function updatePointerVisuals(){
  if(!finePointer.matches || reducedMotion.matches || !pointerDirty) return;
  pointerDirty=false;

  cursorGlow.style.left=pointerX+'px';
  cursorGlow.style.top=pointerY+'px';

  contextCursor.style.left=pointerX+'px';
  contextCursor.style.top=pointerY+'px';

  mouseNX=pointerX/innerWidth-.5;
  mouseNY=pointerY/innerHeight-.5;
  sculpture.style.transform=`translate(${mouseNX*20}px,${mouseNY*14}px) rotateY(${mouseNX*4}deg) rotateX(${-mouseNY*3}deg)`;

  const reflectionX=-22 + mouseNX*24;
  const reflectionY=mouseNY*8;
  deviceReflection.style.transform=`translate3d(${reflectionX}%,${reflectionY}%,0) rotate(${2+mouseNX*2}deg)`;

  updateMagnetic();
}

function applyReducedMotionState(){
  if(!reducedMotion.matches) return false;

  progress.style.width=((window.scrollY||0)/Math.max(1,document.documentElement.scrollHeight-innerHeight)*100)+'%';
  paper.style.opacity='0';
  app.style.opacity='1';
  app.style.transform='none';
  measure.style.opacity='0';
  morphBridge.style.opacity='0';
  analysis.style.opacity='1';
  analysis.style.transform='none';
  processLine.style.strokeDashoffset='0';
  kpis.forEach(el=>{el.style.opacity='1';el.style.transform='none';});
  trace.style.opacity='0';
  deploy.style.opacity='0';
  thread.setAttribute('d',ptsToPath(pulseD));
  threadCursor.setAttribute('cx','515');
  threadCursor.setAttribute('cy','313');
  device.style.transform='none';
  device.style.boxShadow='0 50px 130px rgba(0,0,0,.48)';
  setMotionLayers([]);
  return true;
}

function render(){
  ticking=false;
  updatePointerVisuals();
  if(applyReducedMotionState()) return;
  const now=performance.now();
  const scrollTop=window.scrollY || document.documentElement.scrollTop;
  const maxDoc=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  progress.style.width=(scrollTop/maxDoc*100)+'%';

  const dt=Math.max(16, now-lastTs);
  const rawVel=(scrollTop-lastScroll)/dt;     // px per ms
  velocity = velocity*0.82 + rawVel*0.18;    // smooth
  lastScroll=scrollTop; lastTs=now;
  const vAbs=clamp(Math.abs(velocity)*16,0,1);
  const vDir=Math.sign(velocity||0);

  const p=clamp((scrollTop-storyStart)/storyTravel);
  storyActive=scrollTop >= storyStart-innerHeight && scrollTop <= storyStart+story.offsetHeight;
  story.classList.toggle('is-active',storyActive);

  const phase=currentPhase(p);
  if(mobileMode){
    mobileChapters.forEach((c,i)=>c.classList.toggle('active',i===phase));
    mobileDots.forEach((d,i)=>d.classList.toggle('on',i===phase));
  }else{
    desktopChapters.forEach((c,i)=>c.classList.toggle('active',i===phase));
    desktopDots.forEach((d,i)=>d.classList.toggle('on',i===phase));
  }

  // Phase windows
  const fPaper = mobileMode ? 0 : fadeWindow(p,0,.01,.09,.145);
  const fApp   = mobileMode ? fadeWindow(p,0,.02,.10,.18) : fadeWindow(p,.10,.16,.245,.31);
  const fMeas  = mobileMode ? fadeWindow(p,.13,.20,.36,.43) : fadeWindow(p,.255,.315,.405,.46);
  const fMorph = mobileMode ? fadeWindow(p,.38,.44,.56,.63) : fadeWindow(p,.405,.435,.49,.535);
  const fAnal  = mobileMode ? fadeWindow(p,.42,.49,.66,.74) : fadeWindow(p,.47,.535,.61,.67);
  const fTrace = mobileMode ? fadeWindow(p,.67,.74,.94,1)   : fadeWindow(p,.615,.68,.77,.835);
  const fDep   = mobileMode ? 0 : fadeWindow(p,.79,.85,.995,1);

  const activeLayers=[device];
  if(fPaper>.05) activeLayers.push(paper);
  if(fApp>.05) activeLayers.push(app);
  if(fMeas>.05) activeLayers.push(measure);
  if(fMorph>.05) activeLayers.push(morphBridge);
  if(fAnal>.05) activeLayers.push(analysis);
  if(fTrace>.05) activeLayers.push(trace);
  if(fDep>.05) activeLayers.push(deploy);
  setMotionLayers(activeLayers);

  paper.style.opacity=fPaper;
  paper.style.transform=`rotate(${(-2.3+2.3*seg(p,.07,.15)).toFixed(2)}deg) scale(${(0.93+0.07*seg(p,.05,.15)).toFixed(3)}) translateY(${(-14*seg(p,.09,.15)).toFixed(1)}px)`;

  app.style.opacity=fApp;
  app.style.transform=`scale(${(0.96+0.04*fApp).toFixed(3)}) translateY(${(10*(1-fApp)).toFixed(1)}px)`;

  const blackout = mobileMode ? seg(p,.17,.24)*(1-seg(p,.39,.43)) : seg(p,.27,.31)*(1-seg(p,.435,.46));
  measureStage.style.opacity=String(blackout*.94);
  measure.style.opacity=fMeas;
  measure.style.transform=`scale(${(.90+.10*fMeas).toFixed(3)})`;

  const numIntro = mobileMode ? seg(p,.18,.25) : seg(p,.285,.33);
  measureNo.style.transform=`scale(${(.82+.18*numIntro).toFixed(3)})`;
  const bandIntro = mobileMode ? seg(p,.22,.29) : seg(p,.315,.355);
  specBand.style.opacity=bandIntro;
  specBand.style.transform=`translateY(${(8*(1-bandIntro)).toFixed(1)}px)`;
  measureSpec.style.opacity = mobileMode ? seg(p,.24,.31) : seg(p,.33,.365);

  contexts.forEach((el,i)=>{
    const local = mobileMode ? seg(p,.26+i*.01,.34+i*.01) : seg(p,.345+i*.006,.385+i*.006);
    el.style.opacity=local;
    el.style.transform=`translateY(${(10*(1-local)).toFixed(1)}px)`;
  });

  // Morph: 25.14 becomes a red chart point.
  morphBridge.style.opacity=fMorph;
  const mp = mobileMode ? seg(p,.43,.57) : seg(p,.42,.51);
  const targetX = -165;  // move toward chart area
  const targetY = 76;
  const numScale = 1 - .94*mp;
  morphNumber.style.transform=`translate(calc(-50% + ${targetX*mp}px), calc(-50% + ${targetY*mp}px)) scale(${numScale.toFixed(3)}) rotate(${(-2*mp).toFixed(2)}deg)`;
  morphNumber.style.opacity=1-seg(mp,.78,1);
  morphDot.style.opacity=seg(mp,.55,.9);
  morphDot.style.transform=`translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px)) scale(${(0.2+0.8*seg(mp,.55,.9)).toFixed(3)})`;

  particles.forEach((el,i)=>{
    const baseStart = mobileMode ? .46 : .435;
    const baseEnd   = mobileMode ? .54 : .495;
    const local=seg(p,baseStart+i*.008,baseEnd+i*.008);
    const x=Number(el.dataset.x)*local;
    const y=Number(el.dataset.y)*local;
    el.style.opacity=local*(1-seg(p,baseEnd,.63));
    el.style.transform=`translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${(.8+.2*local).toFixed(3)})`;
  });

  analysis.style.opacity=fAnal;
  analysis.style.transform=`translateY(${(18*(1-fAnal)).toFixed(1)}px) scale(${(.98+.02*fAnal).toFixed(3)})`;
  const streamP = mobileMode ? seg(p,.50,.57) : seg(p,.49,.54);
  streamInner.style.transform=`translateX(${-220*streamP}px)`;
  const lineP = mobileMode ? seg(p,.54,.65) : seg(p,.515,.595);
  processLine.style.strokeDashoffset=String(900*(1-lineP));
  kpis.forEach((el,i)=>{
    const start = mobileMode ? .60 : .555;
    const end   = mobileMode ? .69 : .60;
    const local=seg(p,start+i*.012,end+i*.012);
    el.style.opacity=local;
    el.style.transform=`translateY(${(8*(1-local)).toFixed(1)}px)`;
  });

  trace.style.opacity=fTrace;
  trace.style.transform=`scale(${(.95+.05*fTrace).toFixed(3)})`;
  deploy.style.opacity=fDep;
  deploy.style.transform=`scale(${(.98+.02*fDep).toFixed(3)})`;

  // One Quality Signal morphs: process trace -> tolerance band -> SPC trend -> controlled process.
  let pulsePts=pulseA;
  if(mobileMode){
    if(p<.20) pulsePts=pulseA;
    else if(p<.38) pulsePts=mixPts(pulseA,pulseB,seg(p,.20,.30));
    else if(p<.68) pulsePts=mixPts(pulseB,pulseC,seg(p,.46,.60));
    else pulsePts=mixPts(pulseC,pulseD,seg(p,.72,.90));
  }else{
    if(p<.26) pulsePts=pulseA;
    else if(p<.43) pulsePts=mixPts(pulseA,pulseB,seg(p,.26,.33));
    else if(p<.66) pulsePts=mixPts(pulseB,pulseC,seg(p,.49,.60));
    else pulsePts=mixPts(pulseC,pulseD,seg(p,.72,.82));
  }
  // Add subtle velocity-driven energy to the Quality Signal
  const energeticPts=pulsePts.map((pt,i)=>{
    if(i===3||i===4||i===9||i===10){
      return [pt[0], pt[1] + (i%2===0?-1:1) * vAbs * 10 * vDir];
    }
    return pt;
  });
  thread.setAttribute('d', ptsToPath(energeticPts));

  const cursorFollow = energeticPts[Math.min(10, Math.max(0, Math.round(2 + p*(energeticPts.length-3))))];
  threadCursor.setAttribute('cx', cursorFollow[0].toFixed(1));
  threadCursor.setAttribute('cy', cursorFollow[1].toFixed(1));
  threadCursor.setAttribute('r', (4 + vAbs*1.4).toFixed(2));

  pulseGlowBand.style.opacity = String(0.15 + Math.max(seg(p,.26,.40), seg(p,.44,.60))*0.4);

  const tilt=-5+5*seg(p,0,.22);
  const scaleD=.94+.06*seg(p,0,.22)+.018*seg(p,.82,.95);
  const lift=-8*seg(p,.15,.5)+8*seg(p,.78,.95);
  const momentum = vDir * vAbs * 8;
  device.style.transform=`rotateY(${(tilt + mouseNX*1.5).toFixed(2)}deg) rotateX(${(-vDir*vAbs*1.6).toFixed(2)}deg) translateY(${(lift+momentum).toFixed(2)}px) scale(${scaleD})`;
  device.style.borderRadius=`${32-10*seg(p,.8,.95)}px`;
  const glow=.25+.75*Math.max(fMeas,fMorph,fAnal,fTrace)+vAbs*.15;
  device.style.boxShadow=`0 50px 130px rgba(0,0,0,.48),0 0 ${60*glow}px rgba(61,88,180,${0.06*glow})`;

  if(storyActive) scene.style.marginRight=`${mouseNX*5}px`;
}

function requestRender(){if(!ticking){ticking=true;requestAnimationFrame(render);}}

if(finePointer.matches && !lowPowerDevice){
  addEventListener('pointermove',e=>{
    pointerX=e.clientX;
    pointerY=e.clientY;
    pointerDirty=true;
    requestRender();
  },{passive:true});
}


if(finePointer.matches && !reducedMotion.matches && !lowPowerDevice){
  const heroEl=document.querySelector('.hero');
  const storyEl=document.querySelector('.story');

  heroEl.addEventListener('mouseenter',()=>setContextCursor('Explore',true));
  heroEl.addEventListener('mouseleave',()=>setContextCursor('',false));
  storyEl.addEventListener('mouseenter',()=>setContextCursor('Scroll',true));
  storyEl.addEventListener('mouseleave',()=>setContextCursor('',false));

  magneticEls.forEach(el=>{
    el.addEventListener('mouseenter',()=>{
      magneticTarget=el;
      contextCursorLabel.textContent='Open';
      contextCursor.classList.add('active');
      contextCursor.classList.add('visible');
    });
    el.addEventListener('mouseleave',()=>{
      resetMagnetic(el);
      magneticTarget=null;
      contextCursorLabel.textContent=contextMode||'Scroll';
      contextCursor.classList.toggle('visible',contextVisible);
    });
  });
}
