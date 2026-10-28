import { google } from 'googleapis';

const clean = (v) => String(v ?? '').trim();

const keyify = (v) =>
  clean(v).toLowerCase().replace(/[^a-z0-9]/g, '');

const number = (v) => {
  const n = Number(clean(v).replace(/[% ,]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const average = (values) =>
  values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0;

const round = (n) => Number(n.toFixed(1));

function getField(row, ...names) {
  for (const name of names) {
    const target = keyify(name);
    const key = Object.keys(row).find(
      (k) => keyify(k) === target
    );

    if (key !== undefined && row[key] !== '') {
      return row[key];
    }
  }

  return '';
}

function getStatus(row) {
  const explicit = clean(
    getField(row, 'Submission Status')
  ).toLowerCase();

  const expected = number(
    getField(row, 'Expected Subjects')
  );

  const submitted = number(
    getField(row, 'Submitted Subjects')
  );

  const rawPercent = getField(
    row,
    'Submission %',
    'Submission Percentage'
  );

  let percent = number(rawPercent);

  if (percent > 0 && percent <= 1) {
    percent *= 100;
  }

  if (!clean(rawPercent) && expected > 0) {
    percent = (submitted / expected) * 100;
  }

  percent = Math.max(0, Math.min(100, percent));

  if (/not submitted|pending|not started|no submission/.test(explicit)) {
    return { status: 'Not Submitted', percent };
  }

  if (/partial|partially|in progress/.test(explicit)) {
    return { status: 'Partially Submitted', percent };
  }

  if (expected > 0 && submitted >= expected) {
    return { status: 'Fully Submitted', percent: 100 };
  }

  if (/complete|submitted|fully/.test(explicit)) {
    return { status: 'Partially Submitted', percent };
  }

  if (submitted > 0 || percent > 0) {
    return { status: 'Partially Submitted', percent };
  }

  return { status: 'Not Submitted', percent: 0 };
}

function emptyResponse() {
  return {
    updatedAt: new Date().toISOString(),
    filters: {
      programs: [],
      salesTypes: [],
      mentors: []
    },
    kpis: {
      totalLearners: 0,
      fullySubmitted: 0,
      partiallySubmitted: 0,
      notSubmitted: 0,
      averageSubmission: 0,
      expectedSubjects: 0,
      submittedSubjects: 0,
      pendingSubjects: 0,
      fullySubmittedRate: 0
    },
    statusSummary: [],
    programSummary: [],
    salesSummary: [],
    mentorSummary: []
  };
}

export default async function handler(req, res) {
  res.setHeader(
    'Cache-Control',
    's-maxage=300, stale-while-revalidate=600'
  );

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const {
    GOOGLE_SHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY
  } = process.env;

  const tab = process.env.GOOGLE_SHEET_TAB || 'IA Data';

  if (
    !GOOGLE_SHEET_ID ||
    !GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !GOOGLE_PRIVATE_KEY
  ) {
    return res.status(500).json({
      error: 'Google Sheets credentials are not configured.'
    });
  }

  try {
    const auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    });

    const sheets = google.sheets({
      version: 'v4',
      auth
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `'${tab.replace(/'/g, "''")}'!A:Z`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const values = response.data.values || [];

    if (values.length < 2) {
      return res.status(200).json(emptyResponse());
    }

    const headers = values[0].map(clean);

    const rows = values
      .slice(1)
      .filter((line) => line.some((cell) => clean(cell)))
      .map((line) => {
        const row = {};

        headers.forEach((header, index) => {
          row[header] = line[index] ?? '';
        });

        return row;
      });

    const learners = rows.map((row) => {
      const result = getStatus(row);

      return {
        program:
          clean(getField(row, 'Program')) || 'Not specified',

        salesType:
          clean(getField(row, 'Sales Type')) || 'Not specified',

        mentor:
          clean(getField(row, 'Primary Mentor', 'Mentor')) ||
          'Not specified',

        expected: number(getField(row, 'Expected Subjects')),
        submitted: number(getField(row, 'Submitted Subjects')),
        pending: number(getField(row, 'Pending Subjects')),
        percent: result.percent,
        status: result.status
      };
    });

    const programs = [
      ...new Set(learners.map((x) => x.program))
    ].sort();

    const salesTypes = [
      ...new Set(learners.map((x) => x.salesType))
    ].sort();

    const mentors = [
      ...new Set(
        learners
          .map((x) => x.mentor)
          .filter((x) => x !== 'Not specified')
      )
    ].sort();

    const selectedProgram = clean(req.query.program);
    const selectedSales = clean(req.query.salesType);
    const selectedMentor = clean(req.query.mentor);

    const filtered = learners.filter((x) =>
      (!selectedProgram || x.program === selectedProgram) &&
      (!selectedSales || x.salesType === selectedSales) &&
      (!selectedMentor || x.mentor === selectedMentor)
    );

    function makeSummary(field) {
      const map = new Map();

      filtered.forEach((x) => {
        const name = x[field];

        if (!map.has(name)) {
          map.set(name, {
            name,
            learners: 0,
            fullySubmitted: 0,
            partiallySubmitted: 0,
            notSubmitted: 0,
            expectedSubjects: 0,
            submittedSubjects: 0,
            pendingSubjects: 0,
            percents: []
          });
        }

        const item = map.get(name);

        item.learners++;
        item.expectedSubjects += x.expected;
        item.submittedSubjects += x.submitted;
        item.pendingSubjects += x.pending;
        item.percents.push(x.percent);

        if (x.status === 'Fully Submitted') {
          item.fullySubmitted++;
        } else if (x.status === 'Partially Submitted') {
          item.partiallySubmitted++;
        } else {
          item.notSubmitted++;
        }
      });

      return [...map.values()]
        .map((x) => ({
          name: x.name,
          learners: x.learners,
          fullySubmitted: x.fullySubmitted,
          partiallySubmitted: x.partiallySubmitted,
          notSubmitted: x.notSubmitted,
          expectedSubjects: x.expectedSubjects,
          submittedSubjects: x.submittedSubjects,
          pendingSubjects: x.pendingSubjects,
          averageSubmission: round(average(x.percents)),
          completionRate: round(
            x.learners
              ? (x.fullySubmitted / x.learners) * 100
              : 0
          )
        }))
        .sort((a, b) => b.learners - a.learners);
    }

    const statusSummary = [
      'Fully Submitted',
      'Partially Submitted',
      'Not Submitted'
    ].map((name) => ({
      name,
      value: filtered.filter((x) => x.status === name).length
    }));

    const expectedSubjects = filtered.reduce(
      (sum, x) => sum + x.expected,
      0
    );

    const submittedSubjects = filtered.reduce(
      (sum, x) => sum + x.submitted,
      0
    );

    const pendingSubjects = filtered.reduce(
      (sum, x) => sum + x.pending,
      0
    );

    return res.status(200).json({
      updatedAt: new Date().toISOString(),

      filters: {
        programs,
        salesTypes,
        mentors
      },

      kpis: {
        totalLearners: filtered.length,
        fullySubmitted: statusSummary[0].value,
        partiallySubmitted: statusSummary[1].value,
        notSubmitted: statusSummary[2].value,

        averageSubmission: round(
          average(filtered.map((x) => x.percent))
        ),

        expectedSubjects,
        submittedSubjects,
        pendingSubjects,

        fullySubmittedRate: round(
          filtered.length
            ? (statusSummary[0].value / filtered.length) * 100
            : 0
        )
      },

      statusSummary,
      programSummary: makeSummary('program'),
      salesSummary: makeSummary('salesType'),

      mentorSummary: makeSummary('mentor')
        .filter((x) => x.name !== 'Not specified')
        .slice(0, 20)
    });
  } catch (error) {
    console.error('Dashboard API error:', error);

    return res.status(500).json({
      error:
        'Unable to read Google Sheets. Check the sheet ID, tab name, service-account access, and environment variables.'
    });
  }
}
