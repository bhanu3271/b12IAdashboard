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
  container: { maxWidth: '1600px', margin: '0 auto' },
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
  kpiLabel: { color: '#64748b', fontSize: '11px', marginBottom: '8px' },
  kpiValue: { fontSize: '22px', fontWeight: 700, lineHeight: 1.2 },
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
  }
};

function number(value) {
  const parsed = Number(value);
  return value !== null && value !== undefined &&
    value !== '' && Number.isFinite(parsed)
    ? parsed.toLocaleString('en-IN')
    : '0';
}

function percentage(value) {
  const parsed = Number(value);
  return value !== null && value !== undefined &&
    value !== '' && Number.isFinite(parsed)
    ? `${parsed.toFixed(2)}%`
    : '—';
}

function textValue(value) {
  return value === null || value === undefined ||
    String(value).trim() === ''
    ? '—'
    : String(value);
}

function getPendingSubjectCodes(row) {
  return String(
    row?.pendingSubjectCodes ??
    row?.pendingSubjects ??
    row?.pendingCourseCode ??
    ''
  ).trim();
}

function formatChange(value) {
  if (value === null || value === undefined || value === '') {
    return 'No previous data';
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return '—';

  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function SummaryTable({ rows, firstColumn, columns }) {
  if (!rows || rows.length === 0) {
    return (
      <p style={styles.muted}>
        No data available for the selected filters.
      </p>
    );
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>{firstColumn}</th>
            {columns.map(column => (
              <th key={column.key} style={styles.th}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.name || row.program || row.mentor || row.salesType || 'row'}-${index}`}>
              <td style={styles.td}>
                {textValue(
                  row.name || row.program || row.mentor || row.salesType
                )}
              </td>

              {columns.map(column => {
                const value = row[column.key];
                let output;

                if (column.format) {
                  output = column.format(value, row);
                } else if (column.type === 'text') {
                  output = textValue(value);
                } else {
                  output = number(value);
                }

                return (
                  <td key={column.key} style={styles.td}>
                    {output}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function prepareMentorProgramSummary(rows) {
  const grouped = {};

  (rows || []).forEach(row => {
    const mentorName = String(row.mentor || 'Unassigned').trim();

    if (!grouped[mentorName]) grouped[mentorName] = [];
    grouped[mentorName].push(row);
  });

  return Object.keys(grouped).sort().map(mentorName => {
    const programs = grouped[mentorName].slice().sort((a, b) =>
      String(a.program || '').localeCompare(String(b.program || ''))
    );

    const getProgram = index => {
      const item = programs[index] || {};
      return {
        program: item.program || '—',
        full: Number(item.fullySubmitted || 0),
        partial: Number(item.partiallySubmitted || 0),
        nil: Number(item.notSubmitted || 0)
      };
    };

    const p1 = getProgram(0);
    const p2 = getProgram(1);
    const p3 = getProgram(2);

    return {
      mentor: mentorName,
      program1: p1.program,
      full1: p1.full,
      partial1: p1.partial,
      nil1: p1.nil,
      program2: p2.program,
      full2: p2.full,
      partial2: p2.partial,
      nil2: p2.nil,
      program3: p3.program,
      full3: p3.full,
      partial3: p3.partial,
      nil3: p3.nil
    };
  });
}

function downloadCsv(rows) {
  if (!rows || rows.length === 0) {
    alert('No pending-subject records available to download.');
    return;
  }

  const headers = ['Roll No.', 'Program', 'Mentor', 'Pending Subjects'];

  const csvCell = value =>
    `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;

  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map(row => [
      row.rollNo,
      row.program,
      row.mentor,
      getPendingSubjectCodes(row)
    ].map(csvCell).join(','))
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'IA_Pending_Subject_Codes.csv';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [program, setProgram] = useState('');
  const [salesType, setSalesType] = useState('');
  const [mentor, setMentor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          `The dashboard API returned a non-JSON response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || json.error) {
        throw new Error(json.error || `Request failed with HTTP ${response.status}.`);
      }

      if (!json.kpis || !json.filters) {
        throw new Error(
          'The API response is missing dashboard data. Check your API route and Apps Script deployment.'
        );
      }

      setData(json);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('The dashboard request took longer than 60 seconds. Please retry.');
      } else {
        setError(err.message || 'Unable to load dashboard data.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis || initialKpis;
  const pendingLearners = data?.pendingLearners || [];
  const mentorProgramSummary = prepareMentorProgramSummary(
    data?.mentorProgramSummary || []
  );

  const totalLearners = Number(kpis.totalLearners || 0);
  const fullCount = Number(kpis.fullySubmitted ?? kpis.full ?? 0);
  const fullRate = totalLearners ? fullCount * 100 / totalLearners : 0;

  function resetFilters() {
    setProgram('');
    setSalesType('');
    setMentor('');
  }

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
            <div style={{ marginTop: '9px' }}>
              <button style={styles.button} onClick={load} disabled={loading}>
                Retry
              </button>
            </div>
          </div>
        )}

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Filters</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              alignItems: 'end'
            }}
          >
            <div>
              <label style={styles.label}>Program</label>
              <select
                style={styles.select}
                value={program}
                onChange={event => setProgram(event.target.value)}
              >
                <option value="">All Programs</option>
                {(data?.filters?.programs || []).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Sales Type</label>
              <select
                style={styles.select}
                value={salesType}
                onChange={event => setSalesType(event.target.value)}
              >
                <option value="">All Sales Types</option>
                {(data?.filters?.salesTypes || []).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Mentor</label>
              <select
                style={styles.select}
                value={mentor}
                onChange={event => setMentor(event.target.value)}
              >
                <option value="">All Mentors</option>
                {(data?.filters?.mentors || []).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button style={styles.button} onClick={resetFilters} disabled={loading}>
                Clear Filters
              </button>
              <button style={styles.button} onClick={load} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh Data'}
              </button>
            </div>
          </div>

          {loading && (
            <p style={{ ...styles.muted, marginTop: '10px' }}>
              Loading dashboard data…
            </p>
          )}
        </section>

        <section style={styles.grid}>
          {[
            ['Total Learners', number(kpis.totalLearners)],
            ['Fully Submitted', number(kpis.fullySubmitted ?? kpis.full)],
            ['Partial Submission', number(kpis.partiallySubmitted ?? kpis.partial)],
            ['Nil Submission', number(kpis.notSubmitted ?? kpis.nil)],
            ['Average Submission', percentage(kpis.averageSubmission ?? kpis.avgSubmission)],
            ['Full Submission Rate', percentage(fullRate)]
          ].map(([label, value]) => (
            <div key={label} style={styles.kpi}>
              <div style={styles.kpiLabel}>{label}</div>
              <div style={styles.kpiValue}>{loading ? '—' : value}</div>
            </div>
          ))}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Submission Status</h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            {(data?.statusSummary || []).map(item => {
              const width = totalLearners
                ? Math.min(100, Number(item.count || 0) * 100 / totalLearners)
                : 0;

              return (
                <div key={item.status}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                      fontSize: '11px'
                    }}
                  >
                    <span>{item.status}</span>
                    <strong>{number(item.count)}</strong>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '5px',
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

        {/* Mentor-wise Program Summary: now includes Program 3. */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Program Summary</h2>
          <p style={styles.muted}>
            Up to three programs per mentor, with Full, Partial and Nil counts.
          </p>

          {mentorProgramSummary.length === 0 ? (
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
                    <th style={styles.th}>Full 1</th>
                    <th style={styles.th}>Partial 1</th>
                    <th style={styles.th}>Nil 1</th>
                    <th style={styles.th}>Full 2</th>
                    <th style={styles.th}>Partial 2</th>
                    <th style={styles.th}>Nil 2</th>
                    <th style={styles.th}>Full 3</th>
                    <th style={styles.th}>Partial 3</th>
                    <th style={styles.th}>Nil 3</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorProgramSummary.map((row, index) => (
                    <tr key={`${row.mentor}-${index}`}>
                      <td style={styles.td}>{row.mentor}</td>
                      <td style={styles.td}>{textValue(row.program1)}</td>
                      <td style={styles.td}>{number(row.full1)}</td>
                      <td style={styles.td}>{number(row.partial1)}</td>
                      <td style={styles.td}>{number(row.nil1)}</td>
                      <td style={styles.td}>{textValue(row.program2)}</td>
                      <td style={styles.td}>{number(row.full2)}</td>
                      <td style={styles.td}>{number(row.partial2)}</td>
                      <td style={styles.td}>{number(row.nil2)}</td>
                      <td style={styles.td}>{textValue(row.program3)}</td>
                      <td style={styles.td}>{number(row.full3)}</td>
                      <td style={styles.td}>{number(row.partial3)}</td>
                      <td style={styles.td}>{number(row.nil3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Sales Type Summary</h2>
          <SummaryTable
            rows={data?.mentorSalesSummary || []}
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

        {/* NEW TABLE 1: Programme Submission Summary */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Programme Submission Summary</h2>
          <p style={styles.muted}>
            Full and Full + Partial submission percentages compared with targets
            and the previous available daily snapshot.
          </p>

          <SummaryTable
            rows={data?.programmeSubmissionSummary || []}
            firstColumn="Programme"
            columns={[
              { key: 'salesType', label: 'Sales Type', type: 'text' },
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'fullySubmitted', label: 'Full' },
              { key: 'partiallySubmitted', label: 'Partial' },
              { key: 'notSubmitted', label: 'Nil' },
              { key: 'targetPercent', label: 'Target %', format: percentage },
              { key: 'fullPercent', label: 'Full %', format: percentage },
              { key: 'fullPartialPercent', label: 'Full + Partial %', format: percentage },
              { key: 'changeFullPercent', label: 'Change in Full %', format: formatChange },
              {
                key: 'changeFullPartialPercent',
                label: 'Change in Full + Partial %',
                format: formatChange
              },
              {
                key: 'previousSnapshotDate',
                label: 'Previous Snapshot Date',
                type: 'text'
              }
            ]}
          />
        </section>

        {/* NEW TABLE 2: Programme Performance Table */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Programme Performance Table</h2>
          <p style={styles.muted}>
            Channel, Inside and overall performance, including Full and
            Full + Partial submission rates.
          </p>

          <SummaryTable
            rows={data?.programmePerformanceTable || []}
            firstColumn="Programme"
            columns={[
              { key: 'channelLearners', label: 'Channel Learners' },
              { key: 'insideLearners', label: 'Inside Learners' },
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'targetPercent', label: 'Target %', format: percentage },
              { key: 'fullChannelPercent', label: 'Channel Full %', format: percentage },
              { key: 'fullInsidePercent', label: 'Inside Full %', format: percentage },
              { key: 'overallFullPercent', label: 'Overall Full %', format: percentage },
              {
                key: 'fullPartialChannelPercent',
                label: 'Channel Full + Partial %',
                format: percentage
              },
              {
                key: 'fullPartialInsidePercent',
                label: 'Inside Full + Partial %',
                format: percentage
              },
              {
                key: 'overallFullPartialPercent',
                label: 'Overall Full + Partial %',
                format: percentage
              }
            ]}
          />
        </section>

        {/* Pending Subjects: CSV download only. */}
        <section style={styles.panel}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <h2 style={{ ...styles.sectionTitle, margin: 0 }}>
              Partial Submission — Pending Subjects
            </h2>
            <button
              style={{
                ...styles.primaryButton,
                opacity: pendingLearners.length > 0 && !loading ? 1 : 0.55
              }}
              disabled={pendingLearners.length === 0 || loading}
              onClick={() => downloadCsv(pendingLearners)}
            >
              Download Pending Subjects (CSV)
            </button>
          </div>
        </section>

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
          style={{
            ...styles.muted,
            textAlign: 'center',
            padding: '5px'
          }}
        >
          IA Submission Dashboard
        </footer>
      </div>
    </main>
  );
}
