// Malachim Badrachim – interactions
(function () {
  // smooth page transitions – fade out before internal navigation (no fade-in-on-load, to avoid any risk of a stuck-invisible page if JS is delayed)
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep the short number readable in RTL while preserving the real dialing href (tel:*8237).
  // LTR isolation guarantees that the asterisk is rendered before the digits on every page.
  var numberWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      var parent = node.parentElement;
      if (!parent || parent.matches('script,style')) return NodeFilter.FILTER_REJECT;
      return /(?:\*8237|8237\*)/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  var numberNodes = [], numberNode;
  while ((numberNode = numberWalker.nextNode())) numberNodes.push(numberNode);
  numberNodes.forEach(function (node) {
    node.nodeValue = node.nodeValue.replace(/(?:\*8237|8237\*)/g, '\u2066*8237\u2069');
  });
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (/^(tel:|mailto:|https?:)/i.test(href)) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
    if (reduceMotion) return;
    ev.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(function () { window.location.href = href; }, 220);
  });

  // count-up numbers (odometer-style, ascending, stops at final value)
  var counters = [].slice.call(document.querySelectorAll('.counter'));
  if (counters.length && !reduceMotion) {
    var runCounter = function (el) {
      var raw = el.textContent.trim();
      var m = raw.match(/^([^\d]*)([\d,]+)([^\d]*)$/);
      if (!m) return;
      var prefix = m[1], target = parseInt(m[2].replace(/,/g, ''), 10), suffix = m[3];
      if (isNaN(target)) return;
      var duration = 1500, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased).toLocaleString('en-US') + suffix;
        if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var cIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { cIO.unobserve(entry.target); runCounter(entry.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cIO.observe(el); });
    } else {
      counters.forEach(runCounter);
    }
  }

  var pre = document.getElementById('preloader');
  if (pre) {
    document.body.classList.add('loading');
    
    // מעניקים זמן מינימלי של 1.8 שניות כדי שרואים את האנימציה של הלוגו והרכב
    setTimeout(function () {
      pre.classList.add('done');
      document.body.classList.remove('loading');
      setTimeout(function () { 
        if (pre && pre.parentNode) pre.remove(); 
      }, 1100);
    }, 1800); // כאן אפשר לשלוט כמה זמן האנימציה תישאר (1800 = 1.8 שניות)
  }

  // mobile nav
  var burger = document.getElementById('burger');
  var nav = document.getElementById('mobileNav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  // app-like bottom nav: highlight current page + "more" opens the mobile menu
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  [].slice.call(document.querySelectorAll('.app-nav-item[data-page]')).forEach(function (el) {
    if (el.getAttribute('data-page') === page) el.classList.add('is-active');
  });
  var navMore = document.getElementById('navMore');
  if (navMore && nav) {
    navMore.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navMore.classList.toggle('is-active', open);
      if (burger) burger.setAttribute('aria-expanded', String(open));
      if (open) {
        var header = document.getElementById('siteHeader');
        if (header) header.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  // header shadow
  var header = document.getElementById('siteHeader');
  var parallax = [].slice.call(document.querySelectorAll('[data-parallax]'));
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
    if (!reduceMotion) parallax.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.05;
      el.style.transform = 'translate3d(0,' + (window.scrollY * speed).toFixed(2) + 'px,0)';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // scroll reveal
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // 3D tilt
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) {
    [].slice.call(document.querySelectorAll('.tilt')).forEach(function (card) {
      card.addEventListener('mousemove', function (ev) {
        var r = card.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  // FAQ accordion
  [].slice.call(document.querySelectorAll('.faq-q')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      [].slice.call(document.querySelectorAll('.faq-item')).forEach(function (i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ---------- coverage map + branches (data: js/branches.js) ----------
  var branches = window.MB_BRANCHES || [];

  function cityChips(list) {
    return '<ul class="branch-cities">' + list.map(function (c) {
      return '<li>' + c + '</li>';
    }).join('') + '</ul>';
  }

  var pinWrap = document.getElementById('mapPins');
  var tabsWrap = document.getElementById('branchTabs');
  var panelBody = document.getElementById('branchBody');

  if (branches.length && pinWrap && tabsWrap && panelBody) {
    branches.forEach(function (b, i) {
      var pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'map-pin' + (i === 0 ? ' is-active' : '');
      pin.style.left = b.x + '%';
      pin.style.top = b.y + '%';
      pin.setAttribute('data-branch', b.id);
      pin.setAttribute('data-dir', b.dir || 'e');
      pin.setAttribute('aria-label', b.name);
      pin.innerHTML = '<i class="dot"></i><span>' + b.name.replace('אזור ', '') + '</span>';
      pinWrap.appendChild(pin);

      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'branch-tab' + (i === 0 ? ' is-active' : '');
      tab.setAttribute('data-branch', b.id);
      tab.textContent = b.name.replace('אזור ', '');
      tabsWrap.appendChild(tab);
    });

    var showBranch = function (id) {
      var b = branches.filter(function (x) { return x.id === id; })[0];
      if (!b) return;
      panelBody.innerHTML =
        '<h3>' + b.name + '</h3>' +
        '<p class="muted">' + b.lead + '</p>' +
        '<div class="branch-meta">' +
          '<div><strong>' + b.volunteers + '</strong>מתנדבים פעילים</div>' +
          '<div><strong>' + b.response + '</strong>זמן הגעה ממוצע</div>' +
          '<div><strong>24/6</strong>כוננות באזור</div>' +
        '</div>' +
        cityChips(b.cities);
      [].slice.call(document.querySelectorAll('[data-branch]')).forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-branch') === id);
      });
    };

    document.addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-branch]');
      if (!el) return;
      showBranch(el.getAttribute('data-branch'));
    });

    showBranch(branches[0].id);
  }

  // full branches list (branches.html)
  var branchList = document.getElementById('branchList');
  if (branchList && branches.length) {
    branchList.innerHTML = branches.map(function (b) {
      return '<article class="branch-card reveal">' +
        '<h3>' + b.name + '</h3>' +
        '<p class="lead">' + b.lead + '</p>' +
        '<div class="branch-meta">' +
          '<div><strong>' + b.volunteers + '</strong>מתנדבים פעילים</div>' +
          '<div><strong>' + b.response + '</strong>זמן הגעה ממוצע</div>' +
        '</div>' +
        cityChips(b.cities) +
        '</article>';
    }).join('');
    [].slice.call(branchList.querySelectorAll('.reveal')).forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- weekly news (data: js/news.js) ----------
  var newsWrap = document.getElementById('newsGrid');
  var news = window.MB_NEWS || [];
  if (newsWrap && news.length) {
    var limit = parseInt(newsWrap.getAttribute('data-limit'), 10) || news.length;
    var fmt = function (iso) {
      var p = String(iso).split('-');
      return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
    };
    newsWrap.innerHTML = news.slice(0, limit).map(function (n) {
      return '<article class="news-item reveal in">' +
        '<div class="news-top"><span class="pill">' + n.tag + '</span>' +
        '<span class="news-date">' + fmt(n.date) + '</span></div>' +
        '<h3>' + n.title + '</h3>' +
        '<p>' + n.text + '</p>' +
        (n.link ? '<a class="link" href="' + n.link + '">קראו עוד ←</a>' : '') +
        '</article>';
    }).join('');
    var stamp = document.getElementById('newsUpdated');
    if (stamp) stamp.textContent = 'עודכן לאחרונה: ' + fmt(news[0].date);
  }
})();
