
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({
      error: 'APPS_SCRIPT_URL is not configured in Vercel environment variables.'
    });
  }

  try {
    const status = String(req.query.status || '')
      .trim()
      .toLowerCase();

    const allowedStatuses = ['all', 'full', 'partial', 'nil'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Use all, full, partial, or nil.'
      });
    }

    const url = new URL(APPS_SCRIPT_URL);

    url.searchParams.set('action', 'export');
    url.searchParams.set('status', status);

    ['program', 'salesType', 'mentor'].forEach(key => {
      const value = req.query[key];

      if (typeof value === 'string' && value.trim()) {
        url.searchParams.set(key, value.trim());
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(
        `Google Apps Script returned HTTP ${response.status}`
      );
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    const rows = Array.isArray(result.rows) ? result.rows : [];

    const headers = [
      'Roll Number',
      'Program',
      'Sales Type',
      'Mentor',
      'Submission Status',
      'Expected Subjects',
      'Submitted Subjects',
      'Submission Percentage',
      'Pending Subject Count',
      'Pending Subject Codes'
    ];

    const escapeCsv = value => {
      const text = String(value == null ? '' : value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csvRows = [
      headers.map(escapeCsv).join(','),

      ...rows.map(row => [
        row.rollNo,
        row.program,
        row.salesType,
        row.mentor,
        row.status,
        row.expectedSubjects,
        row.submittedSubjects,
        row.submissionPercent,
        row.pendingSubjectCount,
        row.pendingSubjectCodes
      ].map(escapeCsv).join(','))
    ];

    const csv = '\uFEFF' + csvRows.join('\r\n');

    const filename = `IA_${status}_Submission_Learners.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    return res.status(200).send(csv);

  } catch (error) {
    console.error('Submission CSV download error:', error);

    return res.status(502).json({
      error: error.message || 'Unable to download learner data.'
    });
  }
}
