function sendConfig(res, key) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/javascript; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(
    'window.JavaLavaConfig = Object.assign({}, window.JavaLavaConfig, { googleMapsApiKey: ' +
      JSON.stringify(key || '') +
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

  sendConfig(res, process.env.GOOGLE_MAPS_API_KEY);
};
