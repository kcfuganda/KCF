/* Kamusenene Children's Foundation — site scripts
   Menu, photo viewer, stories, and the donation panel. */
(function () {
  'use strict';

  /* ── Flutterwave configuration ─────────────────────────────────────────────
     Everything the donation panel needs is in this one block.

     PUBLIC_KEY / TEST_PUBLIC_KEY are *public* keys. They are meant to sit in
     page source and cannot move money on their own. The matching SECRET key
     must never appear in this file or anywhere in this repository. If one is
     ever pasted here by accident, treat it as compromised: revoke it in the
     Flutterwave dashboard and generate a new one.

     Test mode: add ?flwtest=1 to the page address, e.g.
        https://kcfuganda.org/?flwtest=1#donate
     A yellow banner appears and the test key is used, so you can run a full
     donation with a Flutterwave test card without touching this file.

     MONTHLY_PLANS: monthly giving needs a Payment Plan created in the
     Flutterwave dashboard (Payments -> Payment Plans). Create one plan per
     currency, then paste its numeric plan ID below. Any currency left as ''
     falls back to the hosted Flutterwave donation page for monthly gifts,
     which is exactly how the site behaved before. One-time giving works now
     and needs no plan.                                                      */
  var FLW = {
    PUBLIC_KEY:      'FLWPUBK-0d2de87853217bfff13025ece2323730-X',
    TEST_PUBLIC_KEY: 'FLWPUBK_TEST-d46fa04ff3f3bcd617a8185834dcfa65-X',
    HOSTED_URL:      'https://flutterwave.com/donate/1vkp00dchzjl',
    LOGO_URL:        'https://kcfuganda.org/KCF-meal.jpg',
    MONTHLY_PLANS: { USD: '', GBP: '', EUR: '', UGX: '' }
  };

  var TEST_MODE = /[?&]flwtest=1\b/.test(window.location.search);

  /* ── Helpers ───────────────────────────── */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.setAttribute('style', attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    if (text != null) n.textContent = text;
    return n;
  }
  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function textFromHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function excerpt(story) {
    if (story.summary) return story.summary;
    var t = textFromHtml(story.body);
    return t.length > 170 ? t.slice(0, 167).replace(/\s+\S*$/, '') + '…' : t;
  }
  function paragraphs(container, text) {
    String(text || '').split(/\n\s*\n/).forEach(function (chunk) {
      if (chunk.trim()) container.appendChild(el('p', null, chunk.trim()));
    });
  }

  /* ── Year ──────────────────────────────── */
  $all('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ── Mobile menu ───────────────────────── */
  var menuBtn = $('.menu-btn');
  var nav = $('#site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
      }
    });
  }

  /* ── Photo viewer (lightbox) ───────────── */
  var lb = $('#lightbox');
  var lbItems = [], lbIndex = 0, lastFocus = null;

  function captionFor(img) {
    if (img.dataset.caption) return img.dataset.caption;
    var fig = img.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    return cap ? cap.textContent.trim() : (img.alt || '');
  }
  function showLb(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    var item = lbItems[lbIndex];
    var img = $('.lb-stage img', lb);
    img.src = item.src;
    img.alt = item.alt;
    $('.lb-caption span', lb).textContent = item.caption;
    $('.lb-count', lb).textContent = lbItems.length > 1 ? (lbIndex + 1) + ' of ' + lbItems.length : '';
    $all('[data-lb="prev"], [data-lb="next"]', lb).forEach(function (b) {
      b.style.visibility = lbItems.length > 1 ? 'visible' : 'hidden';
    });
  }
  function openLb(group, clicked) {
    var imgs = $all('img', group);
    lbItems = imgs.map(function (im) {
      return { src: im.currentSrc || im.src, alt: im.alt, caption: captionFor(im) };
    });
    if (!lb || typeof lb.showModal !== 'function') {
      window.open(clicked.currentSrc || clicked.src, '_blank');
      return;
    }
    lastFocus = document.activeElement;
    showLb(imgs.indexOf(clicked));
    lb.showModal();
    $('[data-lb="close"]', lb).focus();
  }
  if (lb) {
    lb.addEventListener('click', function (e) {
      var action = e.target.closest('[data-lb]');
      if (action) {
        var a = action.getAttribute('data-lb');
        if (a === 'close') lb.close();
        if (a === 'prev') showLb(lbIndex - 1);
        if (a === 'next') showLb(lbIndex + 1);
        return;
      }
      if (e.target.classList.contains('lb-stage') || e.target === lb) lb.close();
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    });
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
      touchX = null;
    });
    lb.addEventListener('close', function () {
      $('.lb-stage img', lb).removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    });
  }
  document.addEventListener('click', function (e) {
    var group = e.target.closest('[data-lightbox-group]');
    if (!group) return;
    var btn = e.target.closest('button');
    var img = e.target.tagName === 'IMG' ? e.target : (btn && btn.querySelector('img'));
    if (!img || !group.contains(img)) return;
    if (img.closest('a')) return;
    e.preventDefault();
    openLb(group, img);
  });

  /* ── Stories ───────────────────────────── */
  var storiesPromise = null;
  function loadStories() {
    if (!storiesPromise) {
      storiesPromise = fetch('stories.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (list) {
          return (Array.isArray(list) ? list : []).filter(function (s) { return s && s.title; });
        });
    }
    return storiesPromise;
  }

  function storyCard(s) {
    var a = el('a', { class: 'story-card', href: 'stories.html?story=' + encodeURIComponent(s.slug) });
    if (s.cover) {
      var fit = el('div', { class: 'fit', style: '--bg:url("' + encodeURI(s.cover) + '")' });
      fit.appendChild(el('img', { src: s.cover, alt: s.cover_caption || '', loading: 'lazy' }));
      a.appendChild(fit);
    }
    var body = el('div', { class: 'story-body' });
    if (s.date) body.appendChild(el('p', { class: 'story-date' }, formatDate(s.date)));
    body.appendChild(el('h3', null, s.title));
    var ex = excerpt(s);
    if (ex) body.appendChild(el('p', null, ex));
    a.appendChild(body);
    return a;
  }

  function emptyState(container, message) {
    container.innerHTML = '';
    var p = el('p', { class: 'empty' }, message);
    container.appendChild(p);
  }

  $all('[data-stories]').forEach(function (container) {
    var limit = parseInt(container.getAttribute('data-limit'), 10) || 0;
    loadStories().then(function (list) {
      if (!list.length) {
        emptyState(container, 'The first stories from Kamusenene are on their way. Check back soon.');
        return;
      }
      container.innerHTML = '';
      (limit ? list.slice(0, limit) : list).forEach(function (s) { container.appendChild(storyCard(s)); });
    }).catch(function () {
      emptyState(container, 'Stories could not be loaded right now. Please refresh the page to try again.');
    });
  });

  var storyRoot = $('[data-story-page]');
  if (storyRoot) {
    var slug = new URLSearchParams(location.search).get('story');
    var listView = $('[data-story-list]');
    var detailView = $('[data-story-detail]');
    if (slug) {
      listView.hidden = true;
      loadStories().then(function (list) {
        var i = -1;
        list.forEach(function (s, k) { if (s.slug === slug) i = k; });
        if (i < 0) { renderMissing(detailView); return; }
        renderStory(detailView, list[i], list[i - 1], list[i + 1]);
      }).catch(function () { renderMissing(detailView); });
    }
  }

  function renderMissing(root) {
    root.hidden = false;
    root.innerHTML = '';
    var wrap = el('div', { class: 'article' });
    wrap.appendChild(el('h1', { style: 'font-size:2rem;margin-bottom:1rem;' }, 'This story could not be found'));
    wrap.appendChild(el('p', { style: 'margin-bottom:1.5rem;' }, 'It may have been renamed or removed. You can browse all stories instead.'));
    wrap.appendChild(el('a', { class: 'btn btn-forest', href: 'stories.html' }, 'See all stories'));
    root.appendChild(wrap);
  }

  function renderStory(root, s, newer, older) {
    document.title = s.title + ' | Kamusenene Children\'s Foundation';
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', excerpt(s));

    root.hidden = false;
    root.innerHTML = '';

    var hero = el('header', { class: 'story-hero' });
    var hw = el('div', { class: 'wrap' });
    hw.appendChild(el('a', { class: 'back', href: 'stories.html' }, '‹ All stories'));
    if (s.date) hw.appendChild(el('p', { class: 'story-date' }, formatDate(s.date)));
    hw.appendChild(el('h1', null, s.title));
    if (s.summary) hw.appendChild(el('p', null, s.summary));
    hero.appendChild(hw);
    root.appendChild(hero);

    var art = el('article', { class: 'article', 'data-lightbox-group': '' });

    if (s.cover) {
      var fig = el('figure', { class: 'cover' });
      fig.appendChild(el('img', { src: s.cover, alt: s.cover_caption || s.title }));
      if (s.cover_caption) fig.appendChild(el('figcaption', { class: 'caption' }, s.cover_caption));
      art.appendChild(fig);
    }

    if (s.body) {
      var body = el('div', { class: 'article-body' });
      body.innerHTML = s.body; // written by the KCF team in the site editor
      art.appendChild(body);
    }

    var photos = (s.photos || []).filter(function (p) { return p && p.image; });
    if (photos.length) {
      var section = el('section', { class: 'photo-entries', 'aria-label': 'Photos' });
      section.appendChild(el('h2', null, 'Photos'));
      photos.forEach(function (p) {
        var f = el('figure', { class: 'photo-entry' });
        var firstLine = String(p.caption || '').split(/\n/)[0].trim();
        f.appendChild(el('img', { src: p.image, alt: firstLine || ('Photo from ' + s.title), loading: 'lazy', 'data-caption': firstLine }));
        if (p.caption) {
          var cap = el('figcaption', { class: 'photo-text' });
          paragraphs(cap, p.caption);
          f.appendChild(cap);
        }
        section.appendChild(f);
      });
      art.appendChild(section);
    }

    if (newer || older) {
      var sn = el('nav', { class: 'story-nav', 'aria-label': 'More stories' });
      if (older) {
        var o = el('a', { href: 'stories.html?story=' + encodeURIComponent(older.slug) });
        o.appendChild(el('span', null, 'Earlier story'));
        o.appendChild(el('strong', null, older.title));
        sn.appendChild(o);
      }
      if (newer) {
        var n = el('a', { class: 'next', href: 'stories.html?story=' + encodeURIComponent(newer.slug) });
        n.appendChild(el('span', null, 'Newer story'));
        n.appendChild(el('strong', null, newer.title));
        sn.appendChild(n);
      }
      art.appendChild(sn);
    }

    root.appendChild(art);
    window.scrollTo(0, 0);
  }

  /* ── Donation panel ────────────────────── */
  var give = $('#give');
  if (give) {
    var PRESETS = {
      USD: [10, 25, 50, 100],
      GBP: [10, 25, 50, 100],
      EUR: [10, 25, 50, 100],
      UGX: [20000, 50000, 100000, 250000]
    };
    var SYMBOL = { USD: '$', GBP: '£', EUR: '€', UGX: 'UGX ' };
    // Written as "helps with", not exact costs. Replace with real figures from the KCF team if available.
    var IMPACT = [
      'helps put nutritious meals on the table for the children.',
      'helps with school supplies and uniforms.',
      'helps cover school fees and care when a child falls ill.',
      'helps keep the children safely housed and the farm growing.'
    ];
    var amountsBox = $('#amounts', give);
    var custom = $('#custom-amt', give);
    var state = { freq: 'once', cur: 'USD', tier: 1, custom: '' };

    function fmt(cur, n) {
      return SYMBOL[cur] + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    function currentAmount() {
      if (state.custom) return parseFloat(state.custom);
      return PRESETS[state.cur][state.tier];
    }
    function buildChips() {
      amountsBox.innerHTML = '';
      PRESETS[state.cur].forEach(function (v, i) {
        var id = 'amt-' + i;
        var input = el('input', { type: 'radio', name: 'amt', id: id, value: String(i) });
        if (!state.custom && i === state.tier) input.checked = true;
        var label = el('label', { for: id }, state.cur === 'UGX' ? (v / 1000) + 'k' : fmt(state.cur, v));
        if (state.cur === 'UGX') label.setAttribute('aria-label', 'UGX ' + v.toLocaleString('en-US'));
        amountsBox.appendChild(input);
        amountsBox.appendChild(label);
      });
      $('#custom-cur', give).textContent = state.cur;
    }
    /* Monthly gifts need a Flutterwave payment plan for the chosen currency.
       Without one we send the donor to the hosted page, as the site did before. */
    function monthlyPlan() { return (FLW.MONTHLY_PLANS[state.cur] || '').trim(); }
    function inlineAvailable() {
      return state.freq === 'once' || monthlyPlan() !== '';
    }

    function setStatus(text, kind) {
      var box = $('#give-status', give);
      box.textContent = text || '';
      box.className = 'give-status' + (text ? ' is-' + (kind || 'info') : '');
    }

    function update() {
      var amt = currentAmount();
      var valid = amt && amt > 0;
      var impact = $('#impact', give);
      var steps = $('#steps', give);
      var lead = state.freq === 'monthly' ? 'Every month, ' : '';
      if (!valid) {
        impact.textContent = 'Enter an amount, or choose one above.';
      } else if (state.custom) {
        impact.textContent = (lead ? 'Every month, a gift of ' : 'A gift of ') + fmt(state.cur, amt) +
          ' goes toward the children\'s food, schooling, healthcare, and shelter.';
      } else {
        impact.textContent = (lead || '') + fmt(state.cur, amt) + ' ' + IMPACT[state.tier];
        impact.textContent = impact.textContent.charAt(0).toUpperCase() + impact.textContent.slice(1);
      }

      steps.textContent = '';
      if (valid && !inlineAvailable()) {
        steps.textContent = 'Monthly giving opens on Flutterwave’s secure page in a new tab. ' +
          'There, choose Monthly, select ' + state.cur + ', and enter ' + amt + '.';
      }

      var btn = $('#give-btn', give);
      btn.disabled = false;
      btn.textContent = !valid
        ? 'Donate'
        : (inlineAvailable()
            ? 'Donate ' + fmt(state.cur, amt) + (state.freq === 'monthly' ? ' monthly' : '')
            : 'Continue to secure checkout');
      setStatus('');
    }

    /* ── Flutterwave inline checkout ──────── */
    function txRef() {
      var rand = Math.random().toString(36).slice(2, 10);
      return 'KCF-' + Date.now().toString(36) + '-' + rand;
    }

    function openHosted() {
      var w = window.open(FLW.HOSTED_URL, '_blank', 'noopener');
      if (!w) setStatus('Your browser blocked the new tab. Please allow pop-ups, or open ' +
        'flutterwave.com/donate/1vkp00dchzjl directly.', 'warn');
    }

    function thankYou(amt) {
      var box = $('#give-status', give);
      box.className = 'give-status is-done';
      box.textContent = '';
      box.appendChild(el('strong', null, 'Thank you.'));
      box.appendChild(document.createTextNode(
        ' Your gift of ' + fmt(state.cur, amt) + (state.freq === 'monthly' ? ' a month' : '') +
        ' is on its way to Kamusenene. Flutterwave will email your receipt. ' +
        'To give again, change the amount above.'));
      /* Lock the button so a second click cannot charge twice. Any change to
         the form calls update(), which re-enables it. */
      var btn = $('#give-btn', give);
      btn.disabled = true;
      btn.textContent = 'Donation received';
      if (box.scrollIntoView) box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function pay() {
      var btn = $('#give-btn', give);
      var amt = currentAmount();
      if (!amt || amt <= 0) { setStatus('Please choose or enter an amount first.', 'warn'); return; }

      if (!inlineAvailable()) { openHosted(); return; }

      var email = ($('#donor-email', give).value || '').trim();
      var name = ($('#donor-name', give).value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setStatus('Please enter a valid email address so Flutterwave can send your receipt.', 'warn');
        $('#donor-email', give).focus();
        return;
      }

      if (typeof window.FlutterwaveCheckout !== 'function') {
        setStatus('The secure payment window could not load — an ad blocker or network ' +
          'filter may be blocking it. Opening Flutterwave in a new tab instead.', 'warn');
        setTimeout(openHosted, 1200);
        return;
      }

      var options = {
        public_key: TEST_MODE ? FLW.TEST_PUBLIC_KEY : FLW.PUBLIC_KEY,
        tx_ref: txRef(),
        amount: amt,
        currency: state.cur,
        customer: { email: email, name: name || 'KCF donor' },
        customizations: {
          title: 'Kamusenene Children’s Foundation',
          description: state.freq === 'monthly' ? 'Monthly donation to KCF' : 'Donation to KCF',
          logo: FLW.LOGO_URL
        },
        callback: function (data) {
          try { if (window.FlutterwaveCheckout && window.FlutterwaveCheckout.close) window.FlutterwaveCheckout.close(); } catch (e) {}
          var ok = data && (data.status === 'successful' || data.status === 'completed');
          if (ok) {
            thankYou(amt);
          } else {
            btn.disabled = false;
            setStatus('That payment did not complete. Nothing has been charged — ' +
              'you are welcome to try again, or use a different card.', 'warn');
          }
        },
        onclose: function () {
          var box = $('#give-status', give);
          if (!box.classList.contains('is-done')) {
            btn.disabled = false;
            setStatus('Checkout closed. Nothing has been charged.', 'info');
          }
        }
      };

      var plan = monthlyPlan();
      if (state.freq === 'monthly' && plan) options.payment_plan = plan;

      /* Guard against a double click opening two checkout windows. */
      btn.disabled = true;
      setStatus('Opening the secure payment window…', 'info');
      try {
        window.FlutterwaveCheckout(options);
      } catch (err) {
        btn.disabled = false;
        setStatus('The secure payment window could not open. Opening Flutterwave in a new tab instead.', 'warn');
        setTimeout(openHosted, 1200);
      }
    }

    give.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'freq') state.freq = t.value;
      if (t.name === 'cur') { state.cur = t.value; state.custom = ''; custom.value = ''; buildChips(); }
      if (t.name === 'amt') { state.tier = parseInt(t.value, 10); state.custom = ''; custom.value = ''; }
      update();
    });
    custom.addEventListener('input', function () {
      state.custom = custom.value;
      $all('input[name="amt"]', give).forEach(function (r) { r.checked = !state.custom && parseInt(r.value, 10) === state.tier; });
      update();
    });

    $('#give-btn', give).addEventListener('click', pay);

    if (TEST_MODE) {
      var bar = $('#testbar', give);
      if (bar) bar.hidden = false;
    }

    buildChips();
    update();
  }
})();
