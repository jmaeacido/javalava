/* Java Lava — Instagram feed widget (mock now, live when API token is configured) */
(function () {
  'use strict';

  var DEFAULT_PROFILE = 'drinkjavalava';
  var DEFAULT_PROFILE_URL = 'https://www.instagram.com/drinkjavalava/';

  function config() {
    return (window.JavaLavaConfig && window.JavaLavaConfig.instagram) || {};
  }

  function profileUrl() {
    var cfg = config();
    return cfg.profileUrl || DEFAULT_PROFILE_URL;
  }

  function profileHandle() {
    var cfg = config();
    return cfg.handle || DEFAULT_PROFILE;
  }

  function assetBase() {
    var cfg = config();
    if (cfg.assetBase) return cfg.assetBase.replace(/\/$/, '');
    var root = document.querySelector('nav.site .brand img');
    if (root && root.src) {
      return root.src.replace(/\/assets\/[^/]+$/, '/assets');
    }
    return 'assets';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncateCaption(text, max) {
    var clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1).trim() + '…';
  }

  function feedApiUrl() {
    var cfg = config();
    if (cfg.feedUrl) return cfg.feedUrl;
    if (window.location.protocol === 'file:') return '';
    return '/api/instagram-feed';
  }

  function instagramAsset(file) {
    return assetBase() + '/instagram/' + file;
  }

  function postMediaMarkup(post) {
    var image = post.media_url || post.thumbnail_url || '';
    var poster = post.thumbnail_url || '';
    var type = (post.media_type || 'IMAGE').toUpperCase();
    if (type === 'VIDEO' && post.media_url) {
      return '<video src="' + escapeHtml(post.media_url) + '"' +
        (poster ? ' poster="' + escapeHtml(poster) + '"' : '') +
        ' muted loop playsinline preload="metadata"></video>';
    }
    return '<img src="' + escapeHtml(image) + '" alt="" loading="lazy" decoding="async" />';
  }

  function bindVideoPosts(root) {
    root.querySelectorAll('.ig-post--video video').forEach(function (video) {
      var tile = video.closest('.ig-post');
      if (!tile) return;
      tile.addEventListener('mouseenter', function () {
        var play = video.play();
        if (play && play.catch) play.catch(function () {});
      });
      tile.addEventListener('mouseleave', function () {
        video.pause();
        video.currentTime = 0;
      });
      tile.addEventListener('focusin', function () {
        var play = video.play();
        if (play && play.catch) play.catch(function () {});
      });
      tile.addEventListener('focusout', function () {
        video.pause();
        video.currentTime = 0;
      });
    });
  }

  function renderWidgetShell(root, posts, meta) {
    var cfg = config();
    var handle = profileHandle();
    var url = profileUrl();
    var live = meta && meta.live;
    var avatar = assetBase() + '/product-6cafc4.png';

    root.innerHTML =
      '<div class="ig-panel' + (live ? ' ig-panel--live' : ' ig-panel--preview') + '">' +
        '<div class="ig-profile">' +
          '<img class="ig-avatar" src="' + escapeHtml(avatar) + '" alt="Java Lava" width="72" height="72" />' +
          '<div class="ig-meta">' +
            '<a class="ig-handle" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">@' + escapeHtml(handle) + '</a>' +
            '<p class="ig-tagline">Premium coffee liqueur · Ignite the flow</p>' +
            (live || !cfg.showPreviewBadge ? '' : '<span class="ig-badge">Preview feed</span>') +
          '</div>' +
          '<a class="btn ig-follow" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Follow on Instagram</a>' +
        '</div>' +
        '<div class="ig-grid" role="list" aria-label="Recent Instagram posts from @' + escapeHtml(handle) + '">' +
          posts.map(function (post, index) {
            var href = post.permalink || url;
            var alt = truncateCaption(post.caption, 120) || ('Java Lava Instagram post ' + (index + 1));
            var type = (post.media_type || 'IMAGE').toUpperCase();
            var typeLabel = type === 'VIDEO' ? 'Video post' : type === 'CAROUSEL_ALBUM' ? 'Carousel post' : 'Photo post';
            var videoClass = type === 'VIDEO' ? ' ig-post--video' : '';
            return (
              '<a class="ig-post' + videoClass + '" role="listitem" href="' + escapeHtml(href) + '" target="_blank" rel="noopener" aria-label="' + escapeHtml(typeLabel + ': ' + alt) + '">' +
                postMediaMarkup(post) +
                '<span class="ig-post-veil" aria-hidden="true">' +
                  '<span class="ig-post-type">' + (type === 'VIDEO'
                    ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="8,5 19,12 8,19"/></svg>'
                    : type === 'CAROUSEL_ALBUM'
                      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 14l4-4 4 4 4-6 4 6"/></svg>'
                      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3.2"/><circle cx="17.2" cy="6.8" r="1"/></svg>') +
                  '</span>' +
                '</span>' +
              '</a>'
            );
          }).join('') +
        '</div>' +
        '<p class="ig-foot">' +
          (live
            ? 'Latest posts from Instagram.'
            : 'Follow @' + escapeHtml(handle) + ' for the latest pours, serves, and drop dates.') +
          ' <a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">View on Instagram</a>' +
        '</p>' +
      '</div>';
    bindVideoPosts(root);
  }

  function renderWidgetEmbed(root) {
    var cfg = config();
    var html = cfg.widgetHtml || '';
    var scriptSrc = cfg.widgetScriptSrc || '';
    root.innerHTML = '<div class="ig-panel ig-panel--embed"><div class="ig-embed-slot"></div></div>';
    var slot = root.querySelector('.ig-embed-slot');
    if (html) {
      slot.innerHTML = html;
    }
    if (scriptSrc) {
      var script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      slot.appendChild(script);
    }
  }

  function renderError(root, message) {
    root.innerHTML =
      '<div class="ig-panel ig-panel--error">' +
        '<p class="ig-error">' + escapeHtml(message) + '</p>' +
        '<a class="btn ghost" href="' + escapeHtml(profileUrl()) + '" target="_blank" rel="noopener">Visit Instagram</a>' +
      '</div>';
  }

  function localMockPosts() {
    return [
      { media_url: instagramAsset('ig-pour-with-friends.jpg'), caption: 'Cheers to the flow — Java Lava on the pour.', permalink: profileUrl(), media_type: 'IMAGE' },
      { media_url: instagramAsset('ig-event-clip.mp4'), thumbnail_url: instagramAsset('ig-brand-ambassador.jpg'), caption: 'Java Lava in motion at the tasting room.', permalink: profileUrl(), media_type: 'VIDEO' },
      { media_url: instagramAsset('ig-brand-ambassador.jpg'), caption: 'Serving the pour. Premium coffee liqueur, bottled energy.', permalink: profileUrl(), media_type: 'IMAGE' },
      { media_url: instagramAsset('ig-outdoor-bar-dusk.jpg'), caption: 'After-hours pours under the open sky.', permalink: profileUrl(), media_type: 'IMAGE' },
      { media_url: instagramAsset('ig-pour-clip.mp4'), thumbnail_url: instagramAsset('ig-pour-with-friends.jpg'), caption: 'Ignite the flow.', permalink: profileUrl(), media_type: 'VIDEO' },
      { media_url: instagramAsset('ig-event-tasting-table.jpg'), caption: 'The tasting table is set — come find the bottle.', permalink: profileUrl(), media_type: 'IMAGE' }
    ];
  }

  function fetchFeed() {
    var api = feedApiUrl();
    if (!api) {
      return Promise.resolve({ ok: true, live: false, posts: localMockPosts() });
    }
    return fetch(api, { headers: { accept: 'application/json' } })
      .then(function (response) {
        return response.json().then(function (body) {
          if (body && body.posts && body.posts.length) return body;
          if (!response.ok) throw new Error('Feed request failed');
          return body;
        });
      })
      .catch(function () {
        return { ok: false, live: false, posts: localMockPosts() };
      });
  }

  function loadRuntimeConfig() {
    if (window.JavaLavaConfig && window.JavaLavaConfig.instagram) {
      return Promise.resolve(true);
    }
    function applyConfigScript(source) {
      return fetch(source, { cache: 'no-store' }).then(function (response) {
        if (!response.ok) return false;
        return response.text();
      }).then(function (scriptText) {
        if (!scriptText) return false;
        new Function(scriptText)();
        return true;
      }).catch(function () { return false; });
    }
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      return applyConfigScript('config.local.js');
    }
    return applyConfigScript('/api/instagram-config');
  }

  function initFeed() {
    var root = document.getElementById('jl-instagram-feed');
    if (!root) return;

    var cfg = config();
    if (cfg.mode === 'widget' && (cfg.widgetHtml || cfg.widgetScriptSrc)) {
      renderWidgetEmbed(root);
      return;
    }

    root.classList.add('ig-loading');
    fetchFeed().then(function (payload) {
      root.classList.remove('ig-loading');
      var posts = (payload && payload.posts) || [];
      if (!posts.length) {
        renderError(root, 'Instagram feed is not available right now.');
        return;
      }
      renderWidgetShell(root, posts.slice(0, 6), { live: !!(payload && payload.live) });
    });
  }

  function boot() {
    loadRuntimeConfig().finally(initFeed);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
