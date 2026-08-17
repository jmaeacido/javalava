const DEFAULT_PROFILE_URL = 'https://www.instagram.com/drinkjavalava/';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=300, s-maxage=900');
  res.setHeader('access-control-allow-origin', '*');
  res.end(JSON.stringify(body));
}

function assetOrigin() {
  const explicit = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const value = explicit || vercel || 'https://java-lava-eta.vercel.app';
  const normalized = /^https?:\/\//i.test(value) ? value.replace(/\/$/, '') : `https://${value.replace(/\/$/, '')}`;
  try {
    return new URL(normalized).origin;
  } catch (error) {
    return 'https://java-lava-eta.vercel.app';
  }
}

function mockPosts() {
  const origin = assetOrigin();
  const asset = (path) => `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  const ig = (file) => asset(`/assets/instagram/${file}`);
  return [
    {
      id: 'mock-1',
      media_type: 'IMAGE',
      media_url: ig('ig-pour-with-friends.jpg'),
      permalink: DEFAULT_PROFILE_URL,
      caption: 'Cheers to the flow — Java Lava on the pour.'
    },
    {
      id: 'mock-2',
      media_type: 'VIDEO',
      media_url: ig('ig-event-clip.mp4'),
      thumbnail_url: ig('ig-brand-ambassador.jpg'),
      permalink: DEFAULT_PROFILE_URL,
      caption: 'Java Lava in motion at the tasting room.'
    },
    {
      id: 'mock-3',
      media_type: 'IMAGE',
      media_url: ig('ig-brand-ambassador.jpg'),
      permalink: DEFAULT_PROFILE_URL,
      caption: 'Serving the pour. Premium coffee liqueur, bottled energy.'
    },
    {
      id: 'mock-4',
      media_type: 'IMAGE',
      media_url: ig('ig-outdoor-bar-dusk.jpg'),
      permalink: DEFAULT_PROFILE_URL,
      caption: 'After-hours pours under the open sky.'
    },
    {
      id: 'mock-5',
      media_type: 'VIDEO',
      media_url: ig('ig-pour-clip.mp4'),
      thumbnail_url: ig('ig-pour-with-friends.jpg'),
      permalink: DEFAULT_PROFILE_URL,
      caption: 'Ignite the flow.'
    },
    {
      id: 'mock-6',
      media_type: 'IMAGE',
      media_url: ig('ig-event-tasting-table.jpg'),
      permalink: DEFAULT_PROFILE_URL,
      caption: 'The tasting table is set — come find the bottle.'
    }
  ];
}

function normalizePost(row) {
  return {
    id: row.id,
    caption: row.caption || '',
    media_type: row.media_type || 'IMAGE',
    media_url: row.media_url || row.thumbnail_url || '',
    thumbnail_url: row.thumbnail_url || '',
    permalink: row.permalink || DEFAULT_PROFILE_URL,
    timestamp: row.timestamp || null
  };
}

async function fetchLivePosts() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return null;

  const limit = Math.min(12, Math.max(1, Number(process.env.INSTAGRAM_FEED_LIMIT || 6)));
  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
  const url = `https://graph.instagram.com/${encodeURIComponent(userId)}/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Instagram API request failed');
  }
  const payload = await response.json();
  return (payload.data || []).map(normalizePost).filter((post) => post.media_url);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const forcedMock = String(process.env.INSTAGRAM_FEED_MODE || '').toLowerCase() === 'mock';

  try {
    if (!forcedMock) {
      const livePosts = await fetchLivePosts();
      if (livePosts && livePosts.length) {
        return json(res, 200, {
          ok: true,
          live: true,
          handle: process.env.INSTAGRAM_HANDLE || 'drinkjavalava',
          profileUrl: process.env.INSTAGRAM_PROFILE_URL || DEFAULT_PROFILE_URL,
          posts: livePosts
        });
      }
    }

    return json(res, 200, {
      ok: true,
      live: false,
      handle: process.env.INSTAGRAM_HANDLE || 'drinkjavalava',
      profileUrl: process.env.INSTAGRAM_PROFILE_URL || DEFAULT_PROFILE_URL,
      posts: mockPosts()
    });
  } catch (error) {
    return json(res, 502, {
      ok: false,
      live: false,
      error: 'Could not load Instagram feed',
      detail: error.message,
      posts: mockPosts()
    });
  }
};
