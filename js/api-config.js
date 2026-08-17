(function (global) {
  function sitePrefix() {
    var path = global.location.pathname.replace(/\/[^/]*$/, '');
    if (!path || path === '/') return '';
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  function configuredBase() {
    var cfg = global.JavaLavaConfig || {};
    if (!cfg.apiBase) return '';
    return String(cfg.apiBase).replace(/\/$/, '');
  }

  function candidateBases() {
    var bases = [];
    var configured = configuredBase();
    if (configured) bases.push(configured);

    var prefix = sitePrefix();
    if (prefix) bases.push(global.location.origin + prefix);
    bases.push(global.location.origin);

    if (global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1') {
      bases.push('http://localhost:3000');
      bases.push('http://127.0.0.1:3000');
    }

    var seen = {};
    return bases.filter(function (base) {
      base = base.replace(/\/$/, '');
      if (seen[base]) return false;
      seen[base] = true;
      return true;
    });
  }

  function resolveApiPath(path) {
    var normalized = path.charAt(0) === '/' ? path : '/' + path;
    return candidateBases().map(function (base) {
      return base + normalized;
    });
  }

  function fetchWithFallback(path, options) {
    var urls = resolveApiPath(path);
    var index = 0;
    var lastError = null;

    function tryNext() {
      if (index >= urls.length) {
        return Promise.reject(lastError || new Error('API route was not found.'));
      }
      var url = urls[index++];
      var opts = options || {};
      // Short timeout when falling back to a separate local API port.
      if (/:3000(\/|$)/.test(url) && !opts.signal && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        opts = Object.assign({}, opts, { signal: AbortSignal.timeout(1500) });
      }
      return fetch(url, opts).then(function (response) {
        if (response.status === 404 && index < urls.length) {
          lastError = new Error('API route was not found at ' + url);
          return tryNext();
        }
        return response;
      }).catch(function (error) {
        lastError = error;
        if (index < urls.length) return tryNext();
        throw error;
      });
    }

    return tryNext();
  }

  function loadLocalConfig() {
    if (global.location.hostname !== 'localhost' && global.location.hostname !== '127.0.0.1') {
      return Promise.resolve(false);
    }
    return fetch('config.local.js', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) return false;
      return response.text();
    }).then(function (scriptText) {
      if (!scriptText) return false;
      new Function(scriptText)();
      return true;
    }).catch(function () {
      return false;
    });
  }

  global.JavaLavaApi = {
    candidateBases: candidateBases,
    resolveApiPath: resolveApiPath,
    fetchWithFallback: fetchWithFallback,
    loadLocalConfig: loadLocalConfig
  };
})(window);
