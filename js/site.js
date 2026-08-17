/* Java Lava — Volcanic Cinematic · shared behavior */

/* branded handoff between documents; also masks the browser's default white canvas */
(function(){
  var transition=document.createElement('div');
  transition.className='page-transition';
  transition.setAttribute('aria-hidden','true');
  transition.innerHTML='<span>Java Lava</span>';
  document.body.appendChild(transition);

  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var navigating=false;
  document.addEventListener('click',function(event){
    var link=event.target.closest&&event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
    if(link.hasAttribute('download')||link.target&&link.target.toLowerCase()!=='_self'&&link.target.toLowerCase()!=='_top') return;

    var url;
    try{url=new URL(link.href,location.href);}catch(error){return;}
    var isJavaLavaDestination=/(^|\.)javalava\.rocks$/i.test(url.hostname);
    if((url.origin!==location.origin&&!isJavaLavaDestination)||!/^https?:$/.test(url.protocol)) return;
    if(url.pathname===location.pathname&&url.search===location.search&&(url.hash||link.getAttribute('href').charAt(0)==='#')) return;

    event.preventDefault();
    if(navigating) return;
    navigating=true;
    transition.classList.add('is-active');
    window.setTimeout(function(){
      if(link.target&&link.target.toLowerCase()==='_top') window.top.location.href=url.href;
      else location.href=url.href;
    },reduceMotion?20:360);
  });

  window.addEventListener('pageshow',function(){
    navigating=false;
    transition.classList.remove('is-active');
  });
})();

/* fail-safe: if GSAP didn't load, reveal everything + drop loader */
setTimeout(function(){
  if(!window.gsap){
    document.querySelectorAll('.reveal,[data-hero]').forEach(function(e){e.style.opacity=1;e.style.transform='none';});
    var l=document.getElementById('loader'); if(l){l.style.display='none';}
    document.body.classList.remove('loading');
  }
}, 1200);

/* mobile drawer (works with or without GSAP) */
(function(){
  var btn=document.querySelector('.menu-btn'), drawer=document.getElementById('drawer');
  if(!btn||!drawer) return;
  function toggle(open){drawer.classList.toggle('open',open); document.body.style.overflow=open?'hidden':'';}
  btn.addEventListener('click',function(){toggle(!drawer.classList.contains('open'));});
  drawer.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){toggle(false);});});
})();

/* keep Vercel absolute home links, but make local/Laragon previews folder-relative */
(function(){
  var isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if(!isLocal) return;
  document.querySelectorAll('nav.site .brand[href="index.html"]').forEach(function(link){
    link.setAttribute('href','index.html');
  });
})();

/* nav background on scroll (interior pages can force .solid in markup) */
(function(){
  var nav=document.querySelector('nav.site'); if(!nav) return;
  if(nav.classList.contains('solid')) return;
  var onScroll=function(){nav.classList.toggle('scrolled',window.scrollY>60);};
  window.addEventListener('scroll',onScroll); onScroll();
})();

if(window.gsap){
  gsap.registerPlugin(ScrollTrigger);

  /* native/instant scroll — smooth-scroll (Lenis) disabled for the snappiest feel */
  gsap.ticker.lagSmoothing(0);

  /* loader (only if present) */
  var loader=document.getElementById('loader');
  function intro(){
    var heroItems = gsap.utils.toArray('[data-hero]');
    if(!heroItems.length) return;
    gsap.from(heroItems,{y:40,autoAlpha:0,duration:1.1,ease:'power3.out',stagger:.14});
  }
  if(loader){
    var loaderStarted = false;
    function startLoader(){
      if(loaderStarted) return;
      loaderStarted = true;
      gsap.to('#loader .bar span',{width:'100%',duration:1,ease:'power2.inOut'});
      gsap.to('#loader',{autoAlpha:0,duration:.6,delay:1,onComplete:function(){
        loader.style.display='none'; document.body.classList.remove('loading'); intro();
      }});
    }
    if(document.readyState === 'complete') startLoader();
    else {
      window.addEventListener('load',startLoader,{once:true});
      setTimeout(startLoader,900);
    }
  } else { intro(); }

  /* parallax on any [data-parallax] background */
  gsap.utils.toArray('[data-parallax]').forEach(function(el){
    gsap.to(el,{yPercent:16,scale:1.08,ease:'none',
      scrollTrigger:{trigger:el.closest('.hero,.page-hero')||el,start:'top top',end:'bottom top',scrub:true}});
  });

  /* generic scroll reveals */
  gsap.utils.toArray('.reveal').forEach(function(el){
    gsap.to(el,{y:0,autoAlpha:1,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 86%'}});
  });

  /* flavor words pop */
  if(document.querySelector('.flavor .words')){
    gsap.from('.flavor .words div',{scale:.6,autoAlpha:0,stagger:.12,duration:.8,ease:'back.out(1.7)',
      scrollTrigger:{trigger:'.flavor',start:'top 72%'}});
  }
}

/* newsletter capture (shared — home, blog, merch, etc.) */
(function(){
  var nl=document.querySelector('.newsletter'); if(!nl) return;
  var form=nl.querySelector('form'); if(!form) return;
  form.addEventListener('submit',async function(ev){
    ev.preventDefault();
    var input=form.querySelector('input[type="email"]');
    var button=form.querySelector('button[type="submit"]');
    var error=form.querySelector('.nl-error');
    if(!input||!input.checkValidity()){ if(input) input.reportValidity(); return; }
    if(error) error.hidden=true;
    if(button){ button.disabled=true; button.textContent='Saving...'; }
    var source=/blog/i.test(location.pathname)?'blog-newsletter':'homepage-newsletter';
    try{
      var opts={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:input.value,source:source})};
      var response=window.JavaLavaApi&&window.JavaLavaApi.fetchWithFallback
        ? await window.JavaLavaApi.fetchWithFallback('/api/newsletter',opts)
        : await fetch('/api/newsletter',opts);
      if(!response.ok) throw new Error('Newsletter signup failed');
      nl.classList.add('done');
      form.reset();
      var ok=nl.querySelector('.nl-ok');
      if(window.gsap&&ok) gsap.from(ok,{y:12,autoAlpha:0,duration:.5,ease:'power3.out'});
    }catch(err){
      if(error){ error.textContent='Signup could not be saved. Please try again.'; error.hidden=false; }
    }finally{
      if(button){ button.disabled=false; button.textContent='Sign Up'; }
    }
  });
})();

/* Vercel Web Analytics (static HTML — no npm). Skip local dev and admin routes. */
(function(){
  var isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if(isLocal) return;
  if(/^\/(admin|email-admin|merch-admin)(\.html)?$/i.test(location.pathname)) return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
})();

/* AccelPay — site-wide checkout (matches legacy Wix embed). Skip admin routes. */
(function(){
  if(/^\/(admin|email-admin|merch-admin|blog-admin)(\.html)?$/i.test(location.pathname)) return;

  window.apbrand = window.apbrand || { id: 4041823 };
  if(document.querySelector('script[data-jl-accelpay]')) return;

  var readyWaiters = [];
  var accelpayReady = false;

  function markAccelPayReady(){
    if(accelpayReady) return;
    if(!window.apbrand || !apbrand.accelpay || !apbrand.accelpay.dom) return;
    accelpayReady = true;
    readyWaiters.splice(0).forEach(function(cb){ try{ cb(apbrand.accelpay); }catch(err){} });
  }

  function pollAccelPayReady(){
    markAccelPayReady();
    if(!accelpayReady) window.setTimeout(pollAccelPayReady, 200);
  }

  function whenAccelPayReady(timeoutMs){
    timeoutMs = timeoutMs || 15000;
    return new Promise(function(resolve, reject){
      if(accelpayReady) return resolve(apbrand.accelpay);
      var timer = window.setTimeout(function(){
        reject(new Error('AccelPay did not load in time'));
      }, timeoutMs);
      readyWaiters.push(function(ap){
        window.clearTimeout(timer);
        resolve(ap);
      });
      pollAccelPayReady();
    });
  }

  window.JavaLavaAccelPay = {
    brandId: 4041823,
    whenReady: whenAccelPayReady,
    addToCart: function(opts){
      opts = opts || {};
      var listingId = String(opts.listingId || '');
      var variantId = String(opts.variantId || '');
      var qty = Math.max(1, opts.qty || 1);
      if(!listingId || !variantId) return Promise.reject(new Error('AccelPay product mapping missing.'));

      return whenAccelPayReady().then(function(){
        var slot = document.querySelector('[data-bclistingid="' + listingId + '"][data-bcvariantid="' + variantId + '"]');
        var btn = slot && slot.querySelector('button');
        if(!btn) throw new Error('AccelPay add-to-cart control not found');
        for(var i = 0; i < qty; i++) btn.click();
      });
    },
    openCart: function(){
      return whenAccelPayReady().then(function(ap){
        ap.dom.openCart();
      });
    }
  };

  window.addEventListener('message', function(event){
    var data = event.data;
    if(!data || typeof data !== 'object' || !data.action || data.action !== 'bc-add-item') return;
    document.dispatchEvent(new CustomEvent('javalava:cart-add', { detail: data.value }));
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://cart.accelpay.io/scripts/brand.js';
  script.setAttribute('data-jl-accelpay', '1');
  script.addEventListener('load', pollAccelPayReady);
  document.body.appendChild(script);
  pollAccelPayReady();
})();
