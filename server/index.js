'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const SERVE_STATIC = String(process.env.SERVE_STATIC || 'true').toLowerCase() !== 'false';

const API_ROUTES = {
  '/api/blog': require('../api/blog'),
  '/api/contact': require('../api/contact'),
  '/api/newsletter': require('../api/newsletter'),
  '/api/merch-notify': require('../api/merch-notify'),
  '/api/merch-signups': require('../api/merch-signups'),
  '/api/mailing-records': require('../api/mailing-records'),
  '/api/instagram-feed': require('../api/instagram-feed'),
  '/api/instagram-config': require('../api/instagram-config'),
  '/api/google-maps-config': require('../api/google-maps-config'),
};

function wrapHandler(handler) {
  return function onRequest(req, res, next) {
    Promise.resolve(handler(req, res)).catch(function (error) {
      if (res.headersSent) return next(error);
      console.error('[api]', req.method, req.originalUrl, error);
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
  };
}

function mountHandler(app, routePath, handler) {
  const fn = wrapHandler(handler);
  app.all(routePath, fn);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', function (_req, res) {
  res.status(200).json({ ok: true, service: 'java-lava-api' });
});

Object.entries(API_ROUTES).forEach(function ([routePath, handler]) {
  mountHandler(app, routePath, handler);
});

const blogHandler = API_ROUTES['/api/blog'];
app.get('/rss.xml', function (req, res) {
  req.query = Object.assign({}, req.query, { action: 'rss' });
  return blogHandler(req, res);
});
app.get('/sitemap-blog.xml', function (req, res) {
  req.query = Object.assign({}, req.query, { action: 'sitemap' });
  return blogHandler(req, res);
});

app.get('/favicon.ico', function (_req, res) {
  res.redirect(302, '/assets/product-6cafc4.png');
});

if (SERVE_STATIC) {
  app.use(express.static(ROOT, { extensions: ['html'], index: 'index.html' }));

  app.get('*', function (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();

    const cleanPath = req.path.replace(/\/$/, '') || '/';
    if (cleanPath === '/') return next();

    const htmlFile = path.join(ROOT, cleanPath + '.html');
    if (fs.existsSync(htmlFile)) {
      return res.sendFile(htmlFile);
    }

    const notFound = path.join(ROOT, '404.html');
    if (fs.existsSync(notFound)) {
      res.status(404);
      return res.sendFile(notFound);
    }

    return next();
  });
}

app.use(function (_req, res) {
  if (!res.headersSent) {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, function () {
  console.log(`Java Lava server listening on http://localhost:${PORT}`);
  if (SERVE_STATIC) {
    console.log('Serving static files from project root (SERVE_STATIC=false to disable)');
  } else {
    console.log('API-only mode — static files served by Apache/nginx');
  }
});
