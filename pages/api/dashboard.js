const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyCDbE7-zLpi8pAMvwhEoLxf6jrqiVbaE_oM60Ffm392KqZ0uA3l1jxtk_pjxyV2A/exec';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const url = new URL(APPS_SCRIPT_URL);

    for (const key of ['program', 'salesType', 'mentor']) {
      const value = req.query[key];

      if (typeof value === 'string' && value.trim()) {
        url.searchParams.set(key, value.trim());
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Apps Script returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({ error: data.error });
    }

    res.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=120'
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);

    return res.status(502).json({
      error:
        'Could not load dashboard data. Check the Apps Script deployment and access settings.'
    });
  }
}
