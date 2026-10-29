const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyCDbE7-zLpi8pAMvwhEoLxf6jrqiVbaE_oM60Ffm392KqZ0uA3l1jxtk_pjxyV2A/exec';

function csvCell(value) {
  let text = String(value == null ? '' : value);

  // Prevent CSV formula injection.
  if (/^[=+@\-\t\r]/.test(text)) {
    text = "'" + text;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const status = String(req.query.status || '');

  if (!['Full', 'Partial', 'Nil'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Use Full, Partial, or Nil.'
    });
  }

  try {
    const url = new URL(APPS_SCRIPT_URL);

    url.searchParams.set('action', 'export');
    url.searchParams.set('status', status);

    // Pass the dashboard filters to the export.
    for (const key of ['program', 'salesType', 'mentor']) {
      const value = req.query[key];

      if (typeof value === 'string' && value.trim()) {
        url.searchParams.set(key, value.trim());
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(
        `Apps Script returned HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({
        error: data.error
      });
    }

    const rows = Array.isArray(data.rows)
      ? data.rows
      : [];

    const headers = [
      'Roll Number',
      'Program',
      'Sales Type',
      'Mentor',
      'Submission Status',
      'Expected Subjects',
      'Submitted Subjects',
      'Submission Percentage',
      'Pending Course Codes'
    ];

    const lines = [
      headers.map(csvCell).join(',')
    ];

    for (const row of rows) {
      lines.push([
        row.rollNo,
        row.program,
        row.salesType,
        row.mentor,
        row.status,
        row.expectedSubjects,
        row.submittedSubjects,
        row.submissionPercent,
        row.pendingSubjectCodes
      ].map(csvCell).join(','));
    }

    const csv = '\uFEFF' + lines.join('\r\n');

    res.setHeader(
      'Cache-Control',
      'private, no-store, max-age=0'
    );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=IA_${status}_Submissions.csv`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Submission export error:', error);

    return res.status(502).json({
      error:
        'Could not download submission records. Check the Apps Script deployment.'
    });
  }
}
