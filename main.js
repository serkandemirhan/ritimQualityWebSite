/* Bootstrap, menu, observers and startup */
function setupPreloader(){
  if(reducedMotion.matches){
    preloader.remove();
    return;
  }
  const seen=sessionStorage.getItem('ritim-quality-intro-seen')==='1';
  if(seen){
    preloader.remove();
    return;
  }
  sessionStorage.setItem('ritim-quality-intro-seen','1');
  document.documentElement.classList.add('introLocked');
  setTimeout(()=>{
    preloader.classList.add('is-hidden');
    document.documentElement.classList.remove('introLocked');
    setTimeout(()=>preloader.remove(),420);
  },820);
}

function setupReveals(){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  },{threshold:.28});
  revealEls.forEach(el=>io.observe(el));
}

menuBtn.addEventListener('click',()=>{
  const open=menuBtn.getAttribute('aria-expanded')==='true';
  const nextOpen=!open;
  menuBtn.setAttribute('aria-expanded',String(nextOpen));
  menuBtn.setAttribute('aria-label',nextOpen?'Menüyü kapat':'Menüyü aç');
  mobileMenu.classList.toggle('open',nextOpen);
  mobileMenu.setAttribute('aria-hidden',String(!nextOpen));
  if(nextOpen){
    const firstLink=mobileMenu.querySelector('a');
    if(firstLink) firstLink.focus();
  }
});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden','true');
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.setAttribute('aria-label','Menüyü aç');
}));

addEventListener('keydown',e=>{
  if(e.key==='Escape' && mobileMenu.classList.contains('open')){
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
    menuBtn.setAttribute('aria-label','Menüyü aç');
    menuBtn.focus();
  }
});


if('ResizeObserver' in window){
  resizeObserver=new ResizeObserver(()=>{
    cacheLayout();
    requestRender();
  });
  resizeObserver.observe(story);
  resizeObserver.observe(document.body);
}

addEventListener('orientationchange',()=>{
  setTimeout(()=>{
    cacheLayout();
    requestRender();
  },120);
},{passive:true});

if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(()=>{
    cacheLayout();
    requestRender();
  });
}

reducedMotion.addEventListener?.('change',()=>{
  cacheLayout();
  requestRender();
});

addEventListener('scroll',requestRender,{passive:true});
addEventListener('resize',()=>{pointerDirty=true;cacheLayout();requestRender()},{passive:true});
addEventListener('load',()=>{cacheLayout();requestRender()});
setupLanguageSwitcher();
setupPreloader();
setupSignatureProductTransition();
setupProductScreenFocus();
setupMobileProductScreens();
setupReveals();
setupMobileExperience();


cacheLayout();
requestRender();
