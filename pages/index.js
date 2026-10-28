const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyCDbE7-zLpi8pAMvwhEoLxf6jrqiVbaE_oM60Ffm392KqZ0uA3l1jxtk_pjxyV2A/exec';

const load = useCallback(async () => {
  setLoading(true);
  setError('');

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    setData(json);
  } catch (e) {
    setError(
      'Unable to load dashboard data. Check that the Apps Script web app is deployed and accessible. Details: ' +
      e.message
    );
  } finally {
    setLoading(false);
  }
}, []);
