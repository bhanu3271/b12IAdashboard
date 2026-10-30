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
  primaryButton: {
    border: '1px solid #1d4ed8',
    background: '#1d4ed8',
    color: '#fff',
    borderRadius: '6px',
    padding: '12px 18px',
    cursor: 'pointer',
    fontSize: '13px',
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
  clickableKpi: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    padding: '13px',
    minWidth: 0,
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    cursor: 'pointer',
    color: '#1f2937',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
  },
  kpiLabel: { color: '#64748b', fontSize: '11px', marginBottom: '8px' },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1.2,
    overflowWrap: 'anywhere'
  },
  kpiHint: { fontSize: '10px', color: '#64748b', marginTop: '7px' },
  tableWrap: { width: '100%', overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    whiteSpace: 'nowrap'
  },
  th: {
    padding: '9px 10px',
    background: '#f1f5f9',
    borderBottom: '1px solid #dbe2ea',
    textAlign: 'left',
    fontWeight: 700,
    color: '#334155'
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #edf0f4',
    textAlign: 'left'
  },
  muted: { fontSize: '11px', color: '#64748b', lineHeight: 1.5 },
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
  }
};

function number(value) {
  const n = Number(value);
  return value !== null && value !== undefined && value !== '' &&
    Number.isFinite(n) ? n.toLocaleString('en-IN') : '0';
}

function percent(value) {
  const n = Number(value);
  return value !== null && value !== undefined && value !== '' &&
    Number.isFinite(n) ? `${n.toFixed(1)}%` : '—';
}

function changePercent(value) {
  if (value === null || value === undefined || value === '') {
    return 'No baseline';
  }
  const n = Number(value);
  return Number.isFinite(n)
    ? `${n > 0 ? '+' : ''}${n.toFixed(1)} pp`
    : 'No baseline';
}

function textValue(value) {
  return value === null || value === undefined ||
    String(value).trim() === '' ? '—' : String(value);
}

function getField(row, ...keys) {
  for (const key of keys) {
    if (
      row &&
      Object.prototype.hasOwnProperty.call(row, key) &&
      row[key] !== null &&
      row[key] !== undefined &&
      row[key] !== ''
    ) {
      return row[key];
    }
  }
  return null;
}

function getPendingSubjectCodes(row) {
  return String(
    row?.pendingSubjectCodes ??
    row?.pendingSubjects ??
    row?.pendingCourseCode ??
    ''
  ).trim();
}

function csvCell(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function downloadRowsAsCsv(rows, filename, headers) {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map(row =>
      headers.map(header => csvCell(row[header.key])).join(',')
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

function SummaryTable({ rows, firstColumn, columns }) {
  if (!rows || rows.length === 0) {
    return <p style={styles.muted}>No data available for the selected filters.</p>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>{firstColumn}</th>
            {columns.map(c => (
              <th key={c.key} style={styles.th}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.name || row.mentor || row.salesType || 'row'}-${i}`}>
              <td style={styles.td}>
                {textValue(row.name || row.mentor || row.salesType)}
              </td>
              {columns.map(c => (
                <td key={c.key} style={styles.td}>
                  {c.format
                    ? c.format(row[c.key], row)
                    : c.type === 'text'
                      ? textValue(row[c.key])
                      : number(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Supports up to three programs per mentor */
function prepareMentorProgramSummary(rows) {
  const grouped = {};

  (rows || []).forEach(row => {
    const mentorName = row.mentor || 'Unassigned';
    if (!grouped[mentorName]) grouped[mentorName] = [];
    grouped[mentorName].push(row);
  });

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map(mentorName => {
      const programs = grouped[mentorName].slice().sort((a, b) =>
        String(a.program || '').localeCompare(String(b.program || ''))
      );

      const p1 = programs[0] || {};
      const p2 = programs[1] || {};
      const p3 = programs[2] || {};

      return {
        mentor: mentorName,
        program1: p1.program || '',
        full1: p1.fullySubmitted || 0,
        partial1: p1.partiallySubmitted || 0,
        nil1: p1.notSubmitted || 0,
        program2: p2.program || '',
        full2: p2.fullySubmitted || 0,
        partial2: p2.partiallySubmitted || 0,
        nil2: p2.notSubmitted || 0,
        program3: p3.program || '',
        full3: p3.fullySubmitted || 0,
        partial3: p3.partiallySubmitted || 0,
        nil3: p3.notSubmitted || 0
      };
    });
}

function downloadPendingSubjectsCsv(rows) {
  if (!rows || rows.length === 0) {
    alert('No pending-subject records available to download.');
    return;
  }

  const headers = [
    { key: 'rollNo', label: 'Roll No.' },
    { key: 'program', label: 'Program' },
    { key: 'mentor', label: 'Mentor' },
    { key: 'pendingSubjectCount', label: 'Pending Subject Count' },
    { key: 'pendingSubjectCodes', label: 'Pending Course Codes' }
  ];

  const exportRows = rows.map(row => {
    const codes = getPendingSubjectCodes(row);
    const count =
      row.pendingSubjectCount !== null &&
      row.pendingSubjectCount !== undefined
        ? Number(row.pendingSubjectCount)
        : codes
          ? codes.split(',').map(s => s.trim()).filter(Boolean).length
          : 0;

    return {
      rollNo: row.rollNo,
      program: row.program,
      mentor: row.mentor,
      pendingSubjectCount: count,
      pendingSubjectCodes: codes
    };
  });

  downloadRowsAsCsv(exportRows, 'IA_Pending_Subject_Codes.csv', headers);
}
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [program, setProgram] = useState('');
  const [salesType, setSalesType] = useState('');
  const [mentor, setMentor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingStatus, setDownloadingStatus] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const params = new URLSearchParams();
      if (program) params.set('program', program);
      if (salesType) params.set('salesType', salesType);
      if (mentor) params.set('mentor', mentor);
      params.set('_refresh', String(Date.now()));

      const response = await fetch(`/api/dashboard?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      const responseText = await response.text();
      let json;

      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The dashboard API returned a non-JSON response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || json.error) {
        throw new Error(json.error || `Request failed with HTTP ${response.status}.`);
      }

      if (!json.kpis || !json.filters) {
        throw new Error(
          'The API response is missing dashboard data. Check the Apps Script deployment.'
        );
      }

      setData(json);
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'The dashboard request took longer than 60 seconds. Please retry.'
          : err.message || 'Unable to load dashboard data.'
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadSubmissionStatus = useCallback(async status => {
    if (downloadingStatus) return;

    setDownloadingStatus(status);
    setDownloadError('');
    setDownloadMessage('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const params = new URLSearchParams();
      params.set('status', status);
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

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const errorText = await response.text();
        let message = `Download failed with HTTP ${response.status}.`;

        try {
          const json = JSON.parse(errorText);
          message = json.error || message;
        } catch {
          if (errorText.trim()) message = errorText.slice(0, 400);
        }

        throw new Error(message);
      }

      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (json.error) throw new Error(json.error);

        const rows = (Array.isArray(json.rows) ? json.rows : []).map(row => {
          const codes = getPendingSubjectCodes(row);
          const count = row.pendingSubjectCount !== null &&
            row.pendingSubjectCount !== undefined
              ? Number(row.pendingSubjectCount)
              : codes
                ? codes.split(',').map(code => code.trim()).filter(Boolean).length
                : 0;

          return {
            ...row,
            pendingSubjectCount: count,
            pendingSubjectCodes: codes
          };
        });

        const headers = [
          { key: 'rollNo', label: 'Roll Number' },
          { key: 'program', label: 'Program' },
          { key: 'salesType', label: 'Sales Type' },
          { key: 'mentor', label: 'Mentor' },
          { key: 'status', label: 'Submission Status' },
          { key: 'expectedSubjects', label: 'Expected Subjects' },
          { key: 'submittedSubjects', label: 'Submitted Subjects' },
          { key: 'submissionPercent', label: 'Submission Percentage' },
          { key: 'pendingSubjectCount', label: 'Pending Subject Count' },
          { key: 'pendingSubjectCodes', label: 'Pending Subject Codes' }
        ];

        if (rows.length === 0) {
          setDownloadMessage(
            `No ${status} submission records found for the selected filters.`
          );
          return;
        }

        downloadRowsAsCsv(rows, `IA_${status}_Submission_Learners.csv`, headers);
        setDownloadMessage(
          `Downloaded ${number(rows.length)} ${status.toLowerCase()} submission records.`
        );
      } else {
        const blob = await response.blob();

        if (blob.size === 0) {
          setDownloadMessage(
            `No ${status} submission records found for the selected filters.`
          );
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `IA_${status}_Submission_Learners.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setDownloadMessage(`${status} submission CSV downloaded successfully.`);
      }
    } catch (err) {
      setDownloadError(
        err.name === 'AbortError'
          ? 'The download took longer than 60 seconds. Please try again.'
          : err.message || 'Unable to download submission records.'
      );
    } finally {
      clearTimeout(timeoutId);
      setDownloadingStatus('');
    }
  }, [program, salesType, mentor, downloadingStatus]);

  const kpis = data?.kpis || initialKpis;
  const pendingLearners = data?.pendingLearners || [];
  const mentorSalesSummary = data?.mentorSalesSummary || [];
  const mentorProgramSummary = prepareMentorProgramSummary(
    data?.mentorProgramSummary || []
  );
  const totalLearners = Number(kpis.totalLearners || 0);
  const fullCount = Number(kpis.fullySubmitted ?? kpis.full ?? 0);
  const fullRate = totalLearners ? fullCount / totalLearners * 100 : 0;
  const programmeSummary = data?.programmeSubmissionSummary || [];
  const programmePerformanceTable = data?.programmePerformanceTable || [];

  function resetFilters() {
    setProgram('');
    setSalesType('');
    setMentor('');
    setDownloadError('');
    setDownloadMessage('');
  }

  const submissionKpis = [
    {
      label: 'Fully Submitted',
      value: number(kpis.fullySubmitted ?? kpis.full),
      status: 'Full',
      hint: 'Click to download Full learners',
      color: '#16a34a'
    },
    {
      label: 'Partial Submission',
      value: number(kpis.partiallySubmitted ?? kpis.partial),
      status: 'Partial',
      hint: 'Click to download Partial learners',
      color: '#d97706'
    },
    {
      label: 'Nil Submission',
      value: number(kpis.notSubmitted ?? kpis.nil),
      status: 'Nil',
      hint: 'Click to download Nil learners',
      color: '#64748b'
    }
  ];

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header>
          <h1 style={styles.title}>IA Submission Dashboard</h1>
          <p style={styles.subtitle}>
            Internal Assessment submission tracking and mentor-wise analysis
          </p>
        </header>
          {error && (
          <div style={styles.error}>
            <strong>Unable to load dashboard:</strong> {error}
            <div style={{ marginTop: 9 }}>
              <button style={styles.button} onClick={load} disabled={loading}>
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
                {(data?.filters?.programs || []).map(v => (
                  <option key={v} value={v}>{v}</option>
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
                {(data?.filters?.salesTypes || []).map(v => (
                  <option key={v} value={v}>{v}</option>
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
                {(data?.filters?.mentors || []).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={styles.button} onClick={resetFilters} disabled={loading}>
                Clear Filters
              </button>
              <button style={styles.button} onClick={load} disabled={loading}>
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
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Total Learners</div>
            <div style={styles.kpiValue}>
              {loading ? '—' : number(kpis.totalLearners)}
            </div>
          </div>

          {submissionKpis.map(item => {
            const isDownloading = downloadingStatus === item.status;

            return (
              <button
                key={item.status}
                type="button"
                title={item.hint}
                aria-label={`Download ${item.status} submission learners as CSV`}
                style={{
                  ...styles.clickableKpi,
                  borderTop: `3px solid ${item.color}`,
                  opacity: loading || Boolean(downloadingStatus) ? 0.65 : 1,
                  cursor: loading || Boolean(downloadingStatus)
                    ? 'not-allowed'
                    : 'pointer'
                }}
                disabled={loading || Boolean(downloadingStatus)}
                onClick={() => downloadSubmissionStatus(item.status)}
              >
                <div style={styles.kpiLabel}>{item.label}</div>
                <div style={styles.kpiValue}>
                  {loading ? '—' : isDownloading ? 'Preparing…' : item.value}
                </div>
                <div style={styles.kpiHint}>
                  {isDownloading ? 'Generating CSV…' : item.hint}
                </div>
              </button>
            );
          })}

          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Average Submission</div>
            <div style={styles.kpiValue}>
              {loading
                ? '—'
                : percent(kpis.averageSubmission ?? kpis.avgSubmission)}
            </div>
          </div>

          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>Full Submission Rate</div>
            <div style={styles.kpiValue}>
              {loading ? '—' : percent(fullRate)}
            </div>
          </div>
        </section>

        {downloadError && (
          <div style={styles.error}>
            <strong>Download failed:</strong> {downloadError}
            <div style={{ marginTop: 8 }}>
              <button style={styles.button} onClick={() => setDownloadError('')}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {downloadMessage && (
          <div style={styles.success}>{downloadMessage}</div>
        )}

        {/* PROGRAMME PERFORMANCE TABLE */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Programme Target & Submission Summary
          </h2>

          <p style={styles.muted}>
            Submission percentages use the selected filters. Grand Total
            percentages are calculated from combined learner counts, not by
            averaging programme percentages. Change columns show the difference
            from the previous available snapshot.
          </p>

          {!programmePerformanceTable.length ? (
            <p style={styles.muted}>No programme performance data available.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'Programme Name',
                      'B12 DA',
                      'B12 IS',
                      'Total Learners',
                      'Target %',
                      'Full Submission DA %',
                      'Full Submission IS %',
                      'Overall Full %',
                      'Change in Full %',
                      'Full + Partial DA %',
                      'Full + Partial IS %',
                      'Overall Full + Partial %',
                      'Change in Full + Partial %'
                    ].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {programmePerformanceTable.map((r, i) => {
                    const daLearners = getField(
                      r, 'daLearners', 'DALearners', 'channelLearners'
                    );
                    const isLearners = getField(
                      r, 'isLearners', 'ISLearners', 'insideLearners'
                    );
                    const total = getField(r, 'totalLearners');
                    const target = getField(r, 'targetPercent');

                    const daFull = getField(
                      r, 'daFullPercent', 'fullDAPercent', 'fullChannelPercent'
                    );
                    const isFull = getField(
                      r, 'isFullPercent', 'fullISPercent', 'fullInsidePercent'
                    );
                    const overallFull = getField(r, 'overallFullPercent');
                    const fullChange = getField(r, 'changeFullPercent');

                    const daFullPartial = getField(
                      r,
                      'daFullPartialPercent',
                      'fullPartialDAPercent',
                      'fullPartialChannelPercent'
                    );
                    const isFullPartial = getField(
                      r,
                      'isFullPartialPercent',
                      'fullPartialISPercent',
                      'fullPartialInsidePercent'
                    );
                    const overallFullPartial = getField(
                      r, 'overallFullPartialPercent'
                    );
                    const fullPartialChange = getField(
                      r, 'changeFullPartialPercent'
                    );

                    return (
                      <tr
                        key={`${r.program || 'program'}-${i}`}
                        style={r.program === 'Grand Total'
                          ? { fontWeight: 700, background: '#f8fafc' }
                          : undefined}
                      >
                        <td style={styles.td}>{textValue(r.program)}</td>
                        <td style={styles.td}>{number(daLearners)}</td>
                        <td style={styles.td}>{number(isLearners)}</td>
                        <td style={styles.td}>{number(total)}</td>
                        <td style={styles.td}>
                          {target == null ? '—' : percent(target)}
                        </td>
                        <td style={styles.td}>{percent(daFull)}</td>
                        <td style={styles.td}>{percent(isFull)}</td>
                        <td style={styles.td}>{percent(overallFull)}</td>
                        <td style={styles.td}>{changePercent(fullChange)}</td>
                        <td style={styles.td}>{percent(daFullPartial)}</td>
                        <td style={styles.td}>{percent(isFullPartial)}</td>
                        <td style={styles.td}>{percent(overallFullPartial)}</td>
                        <td style={styles.td}>{changePercent(fullPartialChange)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {/* PROGRAMME-WISE SUBMISSION SUMMARY */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Programme-wise Submission Summary
          </h2>

          <p style={styles.muted}>
            Full % = fully submitted learners ÷ total learners. Full + Partial %
            = learners who submitted at least one subject ÷ total learners.
            Change is the difference in percentage points from the most recent
            earlier daily snapshot.
          </p>

          {!programmeSummary.length ? (
            <p style={styles.muted}>No programme summary available.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'Programme',
                      'Sales Type',
                      'Total Learners',
                      'Target %',
                      'Full',
                      'Partial',
                      'Nil',
                      'Full %',
                      'Full + Partial %',
                      'Change in Full %',
                      'Change in Full + Partial %'
                    ].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {programmeSummary.map((r, i) => (
                    <tr key={`${r.program}-${r.salesType}-${i}`}>
                      <td style={styles.td}>{r.program}</td>
                      <td style={styles.td}>{r.salesType}</td>
                      <td style={styles.td}>{number(r.totalLearners)}</td>
                      <td style={styles.td}>
                        {r.targetPercent == null
                          ? 'Set target in Apps Script'
                          : percent(r.targetPercent)}
                      </td>
                      <td style={styles.td}>{number(r.fullySubmitted)}</td>
                      <td style={styles.td}>{number(r.partiallySubmitted)}</td>
                      <td style={styles.td}>{number(r.notSubmitted)}</td>
                      <td style={styles.td}>{percent(r.fullPercent)}</td>
                      <td style={styles.td}>{percent(r.fullPartialPercent)}</td>
                      <td style={styles.td}>{changePercent(r.changeFullPercent)}</td>
                      <td style={styles.td}>
                        {changePercent(r.changeFullPartialPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ ...styles.muted, marginTop: 10 }}>
            Snapshot status:{' '}
            {data?.snapshot?.recorded
              ? `Recorded for ${data.snapshot.date}`
              : data?.snapshot?.reason === 'already_recorded_today'
                ? `Today's snapshot already exists (${data.snapshot.date})`
                : data?.snapshot?.reason === 'disabled'
                  ? 'Daily snapshots are disabled'
                  : 'Status unavailable'}.
            {' '}First snapshot establishes the baseline; changes appear once a
            later day's snapshot exists.
          </p>
        </section>

        {/* SUBMISSION STATUS */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Submission Status</h2>

          <div style={{ display: 'grid', gap: 12 }}>
            {(data?.statusSummary || []).map(item => {
              const total = Number(kpis.totalLearners || 0);
              const width = total
                ? Math.min(100, Number(item.count || 0) * 100 / total)
                : 0;

              return (
                <div key={item.status}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                      fontSize: 11
                    }}
                  >
                    <span>{item.status}</span>
                    <strong>{number(item.count)}</strong>
                  </div>

                  <div
                    style={{
                      height: 8,
                      background: '#e2e8f0',
                      borderRadius: 5,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${width}%`,
                        height: '100%',
                        background: item.status === 'Full'
                          ? '#16a34a'
                          : item.status === 'Partial'
                            ? '#d97706'
                            : '#64748b'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* MENTOR-WISE PROGRAM SUMMARY */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Program Summary</h2>

          <p style={styles.muted}>
            Shows up to three programs alphabetically for each mentor, with
            Full, Partial and Nil submission counts for each program.
          </p>

          {!mentorProgramSummary.length ? (
            <p style={styles.muted}>No data available for the selected filters.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th} rowSpan={2}>Mentor</th>
                    <th style={styles.th} rowSpan={2}>Program 1</th>
                    <th style={styles.th} colSpan={3}>Program 1 Status</th>
                    <th style={styles.th} rowSpan={2}>Program 2</th>
                    <th style={styles.th} colSpan={3}>Program 2 Status</th>
                    <th style={styles.th} rowSpan={2}>Program 3</th>
                    <th style={styles.th} colSpan={3}>Program 3 Status</th>
                  </tr>
                  <tr>
                    {[
                      'Full 1', 'Partial 1', 'Nil 1',
                      'Full 2', 'Partial 2', 'Nil 2',
                      'Full 3', 'Partial 3', 'Nil 3'
                    ].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {mentorProgramSummary.map((r, i) => (
                    <tr key={`${r.mentor}-${i}`}>
                      <td style={styles.td}>{r.mentor}</td>
                      <td style={styles.td}>{textValue(r.program1)}</td>
                      <td style={styles.td}>{number(r.full1)}</td>
                      <td style={styles.td}>{number(r.partial1)}</td>
                      <td style={styles.td}>{number(r.nil1)}</td>
                      <td style={styles.td}>{textValue(r.program2)}</td>
                      <td style={styles.td}>{number(r.full2)}</td>
                      <td style={styles.td}>{number(r.partial2)}</td>
                      <td style={styles.td}>{number(r.nil2)}</td>
                      <td style={styles.td}>{textValue(r.program3)}</td>
                      <td style={styles.td}>{number(r.full3)}</td>
                      <td style={styles.td}>{number(r.partial3)}</td>
                      <td style={styles.td}>{number(r.nil3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* MENTOR-WISE SALES TYPE SUMMARY */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Sales Type Summary</h2>
          <p style={styles.muted}>One row per mentor and sales type.</p>

          <SummaryTable
            rows={mentorSalesSummary}
            firstColumn="Mentor"
            columns={[
              { key: 'salesType', label: 'Sales Type', type: 'text' },
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'fullySubmitted', label: 'Full' },
              { key: 'partiallySubmitted', label: 'Partial' },
              { key: 'notSubmitted', label: 'Nil' }
            ]}
          />
        </section>

        {/* PENDING SUBJECTS */}
        <section style={styles.panel}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <h2 style={{ ...styles.sectionTitle, margin: 0 }}>
              Partial Submission — Pending Subjects
            </h2>

            <button
              style={{
                ...styles.primaryButton,
                opacity: pendingLearners.length > 0 && !loading ? 1 : 0.55,
                cursor: pendingLearners.length > 0 && !loading
                  ? 'pointer'
                  : 'not-allowed'
              }}
              disabled={!pendingLearners.length || loading}
              onClick={() => downloadPendingSubjectsCsv(pendingLearners)}
            >
              Download Pending Subjects (CSV)
            </button>
          </div>

          <p style={{ ...styles.muted, marginTop: 10 }}>
            CSV includes pending subject count and pending course codes. Only
            partially submitted learners are included.
          </p>
        </section>

        {/* PROGRAM-WISE SUMMARY */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Program-wise Summary</h2>
          <SummaryTable
            rows={data?.programSummary || []}
            firstColumn="Program"
            columns={[
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'fullySubmitted', label: 'Full' },
              { key: 'partiallySubmitted', label: 'Partial' },
              { key: 'notSubmitted', label: 'Nil' }
            ]}
          />
        </section>

        {/* SALES TYPE SUMMARY */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Sales Type Summary</h2>
          <SummaryTable
            rows={data?.salesSummary || []}
            firstColumn="Sales Type"
            columns={[
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'fullySubmitted', label: 'Full' },
              { key: 'partiallySubmitted', label: 'Partial' },
              { key: 'notSubmitted', label: 'Nil' }
            ]}
          />
        </section>

        {/* MENTOR-WISE SUMMARY */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Summary</h2>
          <SummaryTable
            rows={data?.mentorSummary || []}
            firstColumn="Mentor"
            columns={[
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'fullySubmitted', label: 'Full' },
              { key: 'partiallySubmitted', label: 'Partial' },
              { key: 'notSubmitted', label: 'Nil' }
            ]}
          />
        </section>

        <footer
          style={{ ...styles.muted, textAlign: 'center', padding: 5 }}
        >
          IA Submission Dashboard
        </footer>
      </div>
    </main>
  );
}
