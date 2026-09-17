/* Adaptive mobile story and interactions */
function setupMobileExperience(){
  if(!window.matchMedia('(max-width: 820px)').matches) return;
  const reduceMobileMotion = reducedMotion.matches;

  const actObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        const firstActivation=entry.target.dataset.motionPlayed!=='1';

        if(firstActivation && !reduceMobileMotion && entry.target.id==='mDetect' && mobileDetectValue){
          mobileDetectValue.animate(
            [
              {transform:'scale(.88)',opacity:.2},
              {transform:'scale(1.06)',opacity:1,offset:.72},
              {transform:'scale(1)',opacity:1}
            ],
            {duration:720,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'}
          );
          mobileTolerance?.animate(
            [{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],
            {duration:520,delay:260,easing:'ease-out',fill:'both'}
          );
        }

        if(firstActivation && !reduceMobileMotion && entry.target.id==='mTrace'){
          mobileTraceItems.forEach((el,i)=>{
            el.animate(
              [
                {opacity:.2,transform:'translateX(12px)'},
                {opacity:1,transform:'translateX(0)'}
              ],
              {duration:420,delay:i*90,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'}
            );
          });
        }
        if(firstActivation) entry.target.dataset.motionPlayed='1';
      }
    });
  },{threshold:.42});

  mobileActs.forEach(act=>actObserver.observe(act));

  // V15 uses the post-product sticky CTA; the older story CTA observers were removed.

  // One pulse continues through all mobile acts.
  if(mobilePulsePath && mobilePulseCursor){
    const updateMobilePulse=()=>{
      const exp=document.getElementById('mobileExperience');
      if(!exp) return;
      const r=exp.getBoundingClientRect();
      const travel=Math.max(1,exp.offsetHeight-innerHeight);
      const p=clamp(-r.top/travel);
      const y=397;
      const amp=1-.56*p;
      const pts=[
        [10,y],[45,y-2],[80,y-4],[115,y-6],[150,y-8],[185,y-10],[220,y-12],
        [255,y-15],[290,y-18],[320,y-21],[345,y-25],[362,y-71*amp],[390,y-26]
      ];
      mobilePulsePath.setAttribute('d',ptsToPath(pts));
      const idx=Math.min(pts.length-1,Math.max(0,Math.floor(p*(pts.length-1))));
      mobilePulseCursor.setAttribute('cx',pts[idx][0]);
      mobilePulseCursor.setAttribute('cy',pts[idx][1]);
    };
    let pulseRaf=0;
    addEventListener('scroll',()=>{
      if(reduceMobileMotion || pulseRaf) return;
      pulseRaf=requestAnimationFrame(()=>{
        pulseRaf=0;
        updateMobilePulse();
      });
    },{passive:true});
    updateMobilePulse();
  }

  // Interactive trace detail: tap/click or keyboard Enter/Space.
  mobileTraceInteractive.forEach(item=>{
    const toggle=()=>{
      const open=item.getAttribute('aria-expanded')==='true';
      mobileTraceInteractive.forEach(other=>{
        if(other!==item) other.setAttribute('aria-expanded','false');
      });
      item.setAttribute('aria-expanded',String(!open));
    };
    item.addEventListener('click',toggle);
    item.addEventListener('keydown',e=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        toggle();
      }
    });
  });

  const deployData={
    tr:{
      cloud:{title:'Cloud',text:'Hızlı devreye alın, çoklu lokasyonları tek merkezden yönetin.',items:['Hızlı devreye alma','Yönetilen güncellemeler','Çoklu lokasyon görünürlüğü']},
      prem:{title:'On-Premise',text:'Fabrika ağı içinde çalışın; veri ve altyapı kontrolünü kurumunuzda tutun.',items:['Yerel veri','İç ağ','Müşteri kontrollü altyapı']}
    },
    en:{
      cloud:{title:'Cloud',text:'Roll out quickly and manage multiple sites from one central platform.',items:['Fast rollout','Managed updates','Multi-site visibility']},
      prem:{title:'On-Premise',text:'Run inside the factory network and keep data and infrastructure under your control.',items:['Local data','Internal network','Customer-controlled infrastructure']}
    },
    fr:{
      cloud:{title:'Cloud',text:'Déployez rapidement et gérez plusieurs sites depuis une plateforme centrale.',items:['Déploiement rapide','Mises à jour gérées','Visibilité multi-sites']},
      prem:{title:'On-Premise',text:'Fonctionnez dans le réseau de l’usine et gardez les données et l’infrastructure sous votre contrôle.',items:['Données locales','Réseau interne','Infrastructure contrôlée par le client']}
    }
  };

  function renderDeploy(key){
    const lang=window.__ritimLang || document.documentElement.lang || 'en';
    const d=(deployData[lang]||deployData.en)[key];
    mobileDeployPanel.innerHTML=
      `<h3>${d.title}</h3><p>${d.text}</p><div class="mobileDeployList">${d.items.map(x=>`<div>• ${x}</div>`).join('')}</div>`;
    const cloud=key==='cloud';
    cloudTab.classList.toggle('active',cloud);
    premTab.classList.toggle('active',!cloud);
    cloudTab.setAttribute('aria-selected',String(cloud));
    premTab.setAttribute('aria-selected',String(!cloud));
  }

  let currentDeploy='cloud';
  window.__renderCurrentDeploy=()=>renderDeploy(currentDeploy);
  cloudTab?.addEventListener('click',()=>{currentDeploy='cloud';renderDeploy('cloud')});
  premTab?.addEventListener('click',()=>{currentDeploy='prem';renderDeploy('prem')});
  renderDeploy(currentDeploy);
}
