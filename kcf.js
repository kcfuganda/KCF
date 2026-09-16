/* Kamusenene Children's Foundation — site scripts
   Menu, photo viewer, stories, and the donation panel. */
(function () {
  'use strict';

  var FLUTTERWAVE_URL = 'https://flutterwave.com/donate/1vkp00dchzjl';

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

      steps.innerHTML = '';
      if (valid) {
        steps.appendChild(document.createTextNode('Checkout opens on Flutterwave in a new tab. There, choose '));
        steps.appendChild(el('b', null, state.freq === 'monthly' ? 'Monthly' : 'Give Once'));
        steps.appendChild(document.createTextNode(', select '));
        steps.appendChild(el('b', null, state.cur));
        steps.appendChild(document.createTextNode(', and enter '));
        steps.appendChild(el('b', null, String(amt)));
        steps.appendChild(document.createTextNode('. '));
        var copy = el('button', { type: 'button', class: 'copy' }, 'Copy amount');
        copy.addEventListener('click', function () {
          var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy amount'; }, 1800); };
          if (navigator.clipboard) navigator.clipboard.writeText(String(amt)).then(done, function () {});
        });
        steps.appendChild(copy);
      }
      var btn = $('#give-btn', give);
      btn.href = FLUTTERWAVE_URL;
      btn.textContent = valid
        ? 'Donate ' + fmt(state.cur, amt) + (state.freq === 'monthly' ? ' monthly' : '')
        : 'Continue to secure checkout';
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

    buildChips();
    update();
  }
})();
