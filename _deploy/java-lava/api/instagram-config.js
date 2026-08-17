function sendConfig(res, config) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/javascript; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(
    'window.JavaLavaConfig = Object.assign({}, window.JavaLavaConfig, { instagram: ' +
      JSON.stringify(config) +
      ' });'
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET');
    res.end('Method not allowed');
    return;
  }

  const hasToken = !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID);
  const forcedMock = String(process.env.INSTAGRAM_FEED_MODE || '').toLowerCase() === 'mock';
  const widgetScriptSrc = process.env.INSTAGRAM_WIDGET_SCRIPT_SRC || '';
  const widgetHtml = process.env.INSTAGRAM_WIDGET_HTML || '';

  sendConfig(res, {
    mode: widgetScriptSrc || widgetHtml ? 'widget' : 'api',
    handle: process.env.INSTAGRAM_HANDLE || 'drinkjavalava',
    profileUrl: process.env.INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/drinkjavalava/',
    feedUrl: '/api/instagram-feed',
    liveReady: hasToken && !forcedMock,
    widgetScriptSrc,
    widgetHtml
  });
};
