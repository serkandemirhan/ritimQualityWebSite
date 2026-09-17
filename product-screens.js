/* Real product screen focus, lightbox and signature transition */
function setupSignatureProductTransition(){
  const dot=document.getElementById('signatureSignalDot');
  const source=document.querySelector('.heroPulse .qualityDot');
  const target=document.getElementById('productEntryTarget');
  const firstFrame=document.querySelector('.productScreenFrame.plan');
  const productSection=document.getElementById('product-screens');

  if(!dot || !source || !target || !firstFrame || !productSection) return;

  const desktop=window.matchMedia('(min-width: 821px)');
  let layout=null;
  let ticking=false;

  const measure=()=>{
    if(!desktop.matches || reducedMotion.matches){
      layout=null;
      dot.classList.remove('active','arrived');
      firstFrame.classList.remove('signalArrived');
      return;
    }

    const s=source.getBoundingClientRect();
    const t=target.getBoundingClientRect();
    const hero=document.querySelector('.hero');
    const heroTop=hero ? hero.getBoundingClientRect().top + scrollY : 0;
    const heroHeight=hero ? hero.offsetHeight : innerHeight;

    const sourceAbs={
      x:s.left+s.width/2,
      y:s.top+s.height/2+scrollY
    };
    const targetAbs={
      x:t.left+t.width/2,
      y:t.top+t.height/2+scrollY
    };

    const start=Math.max(0,heroTop+heroHeight*.58);
    const end=Math.max(start+innerHeight*.7,productSection.offsetTop-innerHeight*.34);

    layout={
      start,end,
      sx:sourceAbs.x,
      sy:sourceAbs.y-start,
      tx:targetAbs.x,
      ty:targetAbs.y-end
    };
    render();
  };

  const bezier=(a,b,c,t)=>{
    const mt=1-t;
    return mt*mt*a+2*mt*t*b+t*t*c;
  };

  const render=()=>{
    ticking=false;
    if(!layout || !desktop.matches || reducedMotion.matches) return;

    const raw=(scrollY-layout.start)/(layout.end-layout.start);
    const p=Math.max(0,Math.min(1,raw));

    if(raw<0 || raw>1.045){
      dot.classList.remove('active');
      if(raw>1){
        firstFrame.classList.add('signalArrived');
        dot.classList.add('arrived');
      }else{
        firstFrame.classList.remove('signalArrived');
        dot.classList.remove('arrived');
      }
      return;
    }

    dot.classList.add('active');
    dot.classList.remove('arrived');

    // A shallow deliberate arc: enough to feel authored, not like a flying particle.
    const cx=(layout.sx+layout.tx)*.5;
    const cy=Math.min(layout.sy,layout.ty)-Math.min(120,innerHeight*.13);
    const x=bezier(layout.sx,cx,layout.tx,p);
    const y=bezier(layout.sy,cy,layout.ty,p);
    const scale=.72+.38*Math.sin(Math.PI*p);

    dot.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;

    if(p>.965){
      firstFrame.classList.add('signalArrived');
    }else{
      firstFrame.classList.remove('signalArrived');
    }
  };

  const queue=()=>{
    if(!ticking){
      ticking=true;
      requestAnimationFrame(render);
    }
  };

  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',()=>requestAnimationFrame(measure),{passive:true});
  addEventListener('orientationchange',()=>setTimeout(measure,120),{passive:true});
  if(document.fonts?.ready) document.fonts.ready.then(measure);
  else measure();

  if('ResizeObserver' in window){
    const ro=new ResizeObserver(()=>requestAnimationFrame(measure));
    ro.observe(productSection);
    const hero=document.querySelector('.hero');
    if(hero) ro.observe(hero);
  }
}

function setupProductScreenFocus(){
  const frames=[...document.querySelectorAll('.productScreenFrame[data-screen-focus]')];
  if(!frames.length) return;
  frames.forEach(frame=>{
    const title=frame.closest('.productScreen')?.querySelector('h3')?.textContent?.trim();
    if(title) frame.setAttribute('aria-label',title);
  });

  // Mobile has no hover: briefly reveal the meaningful area as each screen enters view.
  if(window.matchMedia('(max-width: 820px)').matches && !reducedMotion.matches){
    const timers=new WeakMap();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting && entry.intersectionRatio>.58){
          const frame=entry.target;
          frame.classList.add('focusActive');
          clearTimeout(timers.get(frame));
          const timer=setTimeout(()=>frame.classList.remove('focusActive'),1450);
          timers.set(frame,timer);
        }
      });
    },{threshold:[.35,.58,.75]});
    frames.forEach(frame=>observer.observe(frame));
  }
}


function setupMobileProductScreens(){
  if(!window.matchMedia('(max-width: 820px)').matches) return;

  const list=document.querySelector('.productScreenList');
  const cards=[...document.querySelectorAll('.productScreen')];
  const dots=[...document.querySelectorAll('.mobileProductDots i')];
  const lightbox=document.getElementById('mobileScreenLightbox');
  const lightboxImage=document.getElementById('mobileScreenLightboxImage');
  const lightboxTitle=document.getElementById('mobileScreenLightboxTitle');
  const lightboxClose=document.getElementById('mobileScreenLightboxClose');
  let lightboxReturnFocus=null;
  let lightboxScrollY=0;
  const afterCta=document.getElementById('mobileAfterProductCta');
  const productSection=document.getElementById('product-screens');
  const finalSection=document.getElementById('contact');

  if(list && cards.length){
    let raf=0;
    const updateDots=()=>{
      raf=0;
      const center=list.scrollLeft+list.clientWidth/2;
      let active=0;
      let best=Infinity;
      cards.forEach((card,i)=>{
        const c=card.offsetLeft+card.offsetWidth/2;
        const d=Math.abs(c-center);
        if(d<best){best=d;active=i}
      });
      dots.forEach((dot,i)=>dot.classList.toggle('active',i===active));
    };
    list.addEventListener('scroll',()=>{
      if(!raf) raf=requestAnimationFrame(updateDots);
    },{passive:true});
    updateDots();
  }

  const closeLightbox=()=>{
    if(!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.classList.remove('lightboxOpen');
    document.body.style.top='';
    window.scrollTo(0,lightboxScrollY);
    if(lightboxImage) lightboxImage.src='';
    lightboxReturnFocus?.focus?.();
    lightboxReturnFocus=null;
  };

  document.querySelectorAll('.productScreenFrame').forEach(frame=>{
    const openLightbox=()=>{
      if(!lightbox || !lightboxImage) return;
      const img=frame.querySelector('.productScreenViewport img');
      const title=frame.closest('.productScreen')?.querySelector('h3')?.textContent?.trim() || 'Ritim Quality';
      if(!img) return;
      lightboxReturnFocus=frame;
      lightboxScrollY=window.scrollY || 0;
      lightboxImage.src=img.src;
      lightboxImage.alt=img.alt || title;
      if(lightboxTitle) lightboxTitle.textContent=title;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden','false');
      document.body.style.top=`-${lightboxScrollY}px`;
      document.body.classList.add('lightboxOpen');
      requestAnimationFrame(()=>lightboxClose?.focus());
    };
    frame.addEventListener('click',openLightbox);
    frame.addEventListener('keydown',e=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        openLightbox();
      }
    });
  });

  lightboxClose?.addEventListener('click',closeLightbox);
  lightbox?.addEventListener('click',e=>{
    if(e.target===lightbox) closeLightbox();
  });
  document.addEventListener('keydown',e=>{
    if(!lightbox?.classList.contains('open')) return;
    if(e.key==='Escape'){
      e.preventDefault();
      closeLightbox();
      return;
    }
    if(e.key==='Tab' && lightboxClose){
      e.preventDefault();
      lightboxClose.focus();
    }
  });

  if(productSection && afterCta){
    let productSeen=false;

    const productObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting && entry.intersectionRatio>.32){
          productSeen=true;
        }
      });
    },{threshold:[.15,.32,.55]});
    productObserver.observe(productSection);

    const ctaObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(productSeen){
          afterCta.classList.toggle('visible',!entry.isIntersecting);
        }
      });
    },{threshold:.08});
    ctaObserver.observe(productSection);

    if(finalSection){
      const finalObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting) afterCta.classList.remove('visible');
        });
      },{threshold:.12});
      finalObserver.observe(finalSection);
    }
  }
}
