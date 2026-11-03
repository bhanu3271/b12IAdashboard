
import { useCallback, useEffect, useState } from 'react';

const initialKpis = {
  totalLearners: 0,
  fullySubmitted: 0,
  partiallySubmitted: 0,
  notSubmitted: 0,
  averageSubmission: 0
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '22px',
    color: '#1f2937',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '12px'
  },
  container: { maxWidth: '1500px', margin: '0 auto' },
  title: { fontSize: '22px', margin: '0 0 5px', fontWeight: 700 },
  subtitle: { fontSize: '12px', color: '#64748b', margin: '0 0 20px' },
  panel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    padding: '15px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  sectionTitle: { fontSize: '14px', fontWeight: 700, margin: '0 0 13px' },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '5px'
  },
  select: {
    width: '100%',
    minWidth: 0,
    padding: '8px 9px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    background: '#fff',
    fontSize: '12px',
    color: '#1f2937'
  },
  button: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    borderRadius: '6px',
    padding: '9px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
    gap: '11px',
    marginBottom: '16px'
  },
  kpi: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    padding: '13px',
    minWidth: 0
  },
  kpiLabel: { color: '#64748b', fontSize: '11px', marginBottom: '8px' },
  kpiValue: { fontSize: '22px', fontWeight: 700, lineHeight: 1.2 },
  kpiHint: { fontSize: '10px', color: '#64748b', marginTop: '7px' },
  tileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '15px'
  },
  tile: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#1f2937',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease'
  },
  tileTitle: { fontSize: '15px', fontWeight: 700, marginBottom: '9px' },
  tileDescription: { fontSize: '11px', color: '#64748b', lineHeight: 1.6 },
  tileAction: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#1d4ed8',
    marginTop: '16px'
  },
  error: {
    background: '#fff1f2',
    color: '#9f1239',
    border: '1px solid #fecdd3',
    padding: '12px',
    borderRadius: '7px',
    marginBottom: '15px',
    fontSize: '12px'
  },
  success: {
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    padding: '10px 12px',
    borderRadius: '7px',
    marginBottom: '12px',
    fontSize: '12px'
  },
  muted: { fontSize: '11px', color: '#64748b', lineHeight: 1.5 }
};

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0';
}

function percent(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : '—';
}

function csvCell(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function downloadCsv(rows, filename, headers) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }

  const lines = [
    headers.map(h => csvCell(h.label)).join(','),
    ...rows.map(row =>
      headers.map(h => csvCell(row[h.key])).join(',')
    )
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return true;
}

function getValue(row, ...keys) {
  for (const key of keys) {
    if (
      row &&
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ''
    ) {
      return row[key];
    }
  }
  return '';
}

export default function MentorDashboard() {
  const [data, setData] = useState(null);

  const [program, setProgram] = useState('');
  const [salesType, setSalesType] = useState('');
  const [mentor, setMentor] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      60000
    );

    try {
      const params = new URLSearchParams();

      if (program) params.set('program', program);
      if (salesType) params.set('salesType', salesType);
      if (mentor) params.set('mentor', mentor);

      params.set('_refresh', String(Date.now()));

      const response = await fetch(
        `/api/dashboard?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        }
      );

      const responseText = await response.text();

      let json;

      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Dashboard API returned a non-JSON response. HTTP ${response.status}.`
        );
      }

      if (!response.ok || json.error) {
        throw new Error(
          json.error || `Request failed with HTTP ${response.status}.`
        );
      }

      if (!json.kpis || !json.filters) {
        throw new Error(
          'Dashboard API response is missing KPI or filter information.'
        );
      }

      setData(json);
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'Dashboard request timed out. Please retry.'
          : err.message || 'Unable to load dashboard.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const filters = data?.filters || {};

  const kpis = data?.kpis || initialKpis;

  const fullCount = Number(
    kpis.fullySubmitted ?? kpis.full ?? 0
  );

  const totalLearners = Number(kpis.totalLearners || 0);

  const fullRate = totalLearners
    ? (fullCount / totalLearners) * 100
    : 0;

  const submissionKpis = [
    {
      label: 'Total Learners',
      value: kpis.totalLearners,
      color: '#2563eb'
    },
    {
      label: 'Fully Submitted',
      value: kpis.fullySubmitted ?? kpis.full,
      color: '#16a34a'
    },
    {
      label: 'Partial Submission',
      value: kpis.partiallySubmitted ?? kpis.partial,
      color: '#d97706'
    },
    {
      label: 'Nil Submission',
      value: kpis.notSubmitted ?? kpis.nil,
      color: '#64748b'
    },
    {
      label: 'Average Submission',
      value: percent(
        kpis.averageSubmission ?? kpis.avgSubmission
      ),
      color: '#7c3aed',
      formatted: true
    },
    {
      label: 'Full Submission Rate',
      value: percent(fullRate),
      color: '#0891b2',
      formatted: true
    }
  ];

  function resetFilters() {
    setProgram('');
    setSalesType('');
    setMentor('');
    setDownloadMessage('');
    setDownloadError('');
  }

  async function downloadSubmissionStatus() {
    if (downloading) return;

    setDownloading('submission');
    setDownloadError('');
    setDownloadMessage('');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      60000
    );

    try {
      const params = new URLSearchParams();

      params.set('status', 'all');

      if (program) params.set('program', program);
      if (salesType) params.set('salesType', salesType);
      if (mentor) params.set('mentor', mentor);

      params.set('_refresh', String(Date.now()));

      const response = await fetch(
        `/api/download-submissions?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: 'text/csv, application/json' }
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || `Download failed. HTTP ${response.status}.`
        );
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const json = await response.json();

        if (json.error) throw new Error(json.error);

        const headers = [
          { key: 'rollNo', label: 'Roll Number' },
          { key: 'program', label: 'Program' },
          { key: 'salesType', label: 'Sales Type' },
          { key: 'mentor', label: 'Mentor' },
          { key: 'status', label: 'Submission Status' },
          { key: 'expectedSubjects', label: 'Expected Subjects' },
          { key: 'submittedSubjects', label: 'Submitted Subjects' },
          { key: 'submissionPercent', label: 'Submission Percentage' },
          { key: 'pendingSubjectCodes', label: 'Pending Course Codes' }
        ];

        const rows = json.rows || [];

        if (!downloadCsv(rows, 'Mentor_Submission_Status.csv', headers)) {
          setDownloadMessage('No submission records found.');
        } else {
          setDownloadMessage(
            `Downloaded ${number(rows.length)} learner records.`
          );
        }
      } else {
        const blob = await response.blob();

        if (!blob.size) {
          setDownloadMessage('No submission records found.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'Mentor_Submission_Status.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);

        setDownloadMessage('Submission Status downloaded successfully.');
      }
    } catch (err) {
      setDownloadError(
        err.name === 'AbortError'
          ? 'Download timed out. Please try again.'
          : err.message || 'Unable to download submission data.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      setDownloading('');
    }
  }

  function downloadMentorProgramSummary() {
    const rows = data?.mentorProgramSummary || [];

    const headers = [
      { key: 'mentor', label: 'Mentor' },
      { key: 'program', label: 'Program' },
      { key: 'totalLearners', label: 'Total Learners' },
      { key: 'fullySubmitted', label: 'Full' },
      { key: 'partiallySubmitted', label: 'Partial' },
      { key: 'notSubmitted', label: 'Nil' }
    ];

    const exportRows = rows.map(row => ({
      mentor: getValue(row, 'mentor', 'name'),
      program: getValue(row, 'program'),
      totalLearners: getValue(row, 'totalLearners'),
      fullySubmitted: getValue(row, 'fullySubmitted', 'full'),
      partiallySubmitted: getValue(row, 'partiallySubmitted', 'partial'),
      notSubmitted: getValue(row, 'notSubmitted', 'nil')
    }));

    if (!downloadCsv(
      exportRows,
      'Mentor_Wise_Program_Summary.csv',
      headers
    )) {
      setDownloadMessage('No mentor program summary data available.');
      return;
    }

    setDownloadMessage('Mentor-wise Program Summary downloaded.');
  }

  function downloadMentorSalesSummary() {
    const rows = data?.mentorSalesSummary || [];

    const headers = [
      { key: 'mentor', label: 'Mentor' },
      { key: 'salesType', label: 'Sales Type' },
      { key: 'totalLearners', label: 'Total Learners' },
      { key: 'fullySubmitted', label: 'Full' },
      { key: 'partiallySubmitted', label: 'Partial' },
      { key: 'notSubmitted', label: 'Nil' }
    ];

    const exportRows = rows.map(row => ({
      mentor: getValue(row, 'mentor', 'name'),
      salesType: getValue(row, 'salesType'),
      totalLearners: getValue(row, 'totalLearners'),
      fullySubmitted: getValue(row, 'fullySubmitted', 'full'),
      partiallySubmitted: getValue(row, 'partiallySubmitted', 'partial'),
      notSubmitted: getValue(row, 'notSubmitted', 'nil')
    }));

    if (!downloadCsv(
      exportRows,
      'Mentor_Wise_Sales_Type_Summary.csv',
      headers
    )) {
      setDownloadMessage('No mentor sales summary data available.');
      return;
    }

    setDownloadMessage('Mentor-wise Sales Type Summary downloaded.');
  }

  function downloadMentorSummary() {
    const rows = data?.mentorSummary || [];

    const headers = [
      { key: 'mentor', label: 'Mentor' },
      { key: 'totalLearners', label: 'Total Learners' },
      { key: 'fullySubmitted', label: 'Full' },
      { key: 'partiallySubmitted', label: 'Partial' },
      { key: 'notSubmitted', label: 'Nil' }
    ];

    const exportRows = rows.map(row => ({
      mentor: getValue(row, 'mentor', 'name'),
      totalLearners: getValue(row, 'totalLearners'),
      fullySubmitted: getValue(row, 'fullySubmitted', 'full'),
      partiallySubmitted: getValue(row, 'partiallySubmitted', 'partial'),
      notSubmitted: getValue(row, 'notSubmitted', 'nil')
    }));

    if (!downloadCsv(
      exportRows,
      'Mentor_Wise_Summary.csv',
      headers
    )) {
      setDownloadMessage('No mentor summary data available.');
      return;
    }

    setDownloadMessage('Mentor-wise Summary downloaded.');
  }

  const tiles = [
    {
      id: 'submission',
      title: 'Submission Status',
      description:
        'Download learner-level submission data, including Full, Partial and Nil status.',
      action: downloadSubmissionStatus,
      accent: '#2563eb'
    },
    {
      id: 'program',
      title: 'Mentor-wise Program Summary',
      description:
        'Download mentor-wise program allocation and Full, Partial and Nil submission counts.',
      action: downloadMentorProgramSummary,
      accent: '#16a34a'
    },
    {
      id: 'sales',
      title: 'Mentor-wise Sales Type Summary',
      description:
        'Download Inside and Channel learner counts with submission status for each mentor.',
      action: downloadMentorSalesSummary,
      accent: '#d97706'
    },
    {
      id: 'mentor',
      title: 'Mentor-wise Summary',
      description:
        'Download the overall learner and submission performance of every mentor.',
      action: downloadMentorSummary,
      accent: '#7c3aed'
    }
  ];

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <header>
          <h1 style={styles.title}>Mentor Dashboard</h1>
          <p style={styles.subtitle}>
            Internal Assessment submission tracking and mentor-wise reports
          </p>
        </header>

        {error && (
          <div style={styles.error}>
            <strong>Unable to load dashboard:</strong> {error}
            <div style={{ marginTop: 9 }}>
              <button
                style={styles.button}
                onClick={load}
                disabled={loading}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Filters</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              alignItems: 'end'
            }}
          >
            <div>
              <label style={styles.label}>Program</label>
              <select
                style={styles.select}
                value={program}
                onChange={e => setProgram(e.target.value)}
              >
                <option value="">All Programs</option>
                {(filters.programs || []).map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Sales Type</label>
              <select
                style={styles.select}
                value={salesType}
                onChange={e => setSalesType(e.target.value)}
              >
                <option value="">All Sales Types</option>
                {(filters.salesTypes || []).map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Mentor</label>
              <select
                style={styles.select}
                value={mentor}
                onChange={e => setMentor(e.target.value)}
              >
                <option value="">All Mentors</option>
                {(filters.mentors || []).map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                style={styles.button}
                onClick={resetFilters}
                disabled={loading}
              >
                Clear Filters
              </button>

              <button
                style={styles.button}
                onClick={load}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh Data'}
              </button>
            </div>
          </div>

          {loading && (
            <p style={{ ...styles.muted, marginTop: 10 }}>
              Loading dashboard data…
            </p>
          )}
        </section>

        {/* KPI CARDS */}
        <section style={styles.grid}>
          {submissionKpis.map(item => (
            <div
              key={item.label}
              style={{
                ...styles.kpi,
                borderTop: `3px solid ${item.color}`
              }}
            >
              <div style={styles.kpiLabel}>{item.label}</div>
              <div style={styles.kpiValue}>
                {loading
                  ? '—'
                  : item.formatted
                    ? item.value
                    : number(item.value)}
              </div>
            </div>
          ))}
        </section>

        {downloadError && (
          <div style={styles.error}>
            <strong>Download failed:</strong> {downloadError}
            <div style={{ marginTop: 8 }}>
              <button
                style={styles.button}
                onClick={() => setDownloadError('')}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {downloadMessage && (
          <div style={styles.success}>{downloadMessage}</div>
        )}

        {/* FOUR MENTOR DASHBOARD TILES */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor Reports</h2>

          <p style={styles.muted}>
            Select a report to download the data based on the filters above.
          </p>

          <div style={styles.tileGrid}>
            {tiles.map(tile => (
              <button
                key={tile.id}
                type="button"
                style={{
                  ...styles.tile,
                  borderTop: `4px solid ${tile.accent}`,
                  opacity: loading || Boolean(downloading) ? 0.6 : 1,
                  cursor: loading || downloading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading || Boolean(downloading)}
                onClick={() => {
                  setDownloadMessage('');
                  setDownloadError('');

                  if (tile.id === 'submission') {
                    tile.action();
                  } else {
                    tile.action();
                  }
                }}
              >
                <div style={styles.tileTitle}>{tile.title}</div>

                <div style={styles.tileDescription}>
                  {tile.description}
                </div>

                <div style={styles.tileAction}>
                  {downloading === tile.id
                    ? 'Preparing download…'
                    : '↓ Download CSV'}
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer
          style={{
            ...styles.muted,
            textAlign: 'center',
            padding: 5
          }}
        >
          IA Submission Dashboard — Mentor Portal
        </footer>

      </div>
    </main>
  );
}
