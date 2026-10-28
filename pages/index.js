
import { useCallback, useEffect, useState } from 'react';

const initialKpis = {
  totalLearners: 0,
  fullySubmitted: 0,
  partiallySubmitted: 0,
  notSubmitted: 0,
  averageSubmission: 0,
  expectedSubjects: 0,
  submittedSubjects: 0,
  pendingSubjects: 0,
  fullySubmittedRate: 0
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
  container: {
    maxWidth: '1500px',
    margin: '0 auto'
  },
  title: {
    fontSize: '22px',
    margin: '0 0 5px',
    fontWeight: 700
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 20px'
  },
  panel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '9px',
    padding: '15px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    margin: '0 0 13px'
  },
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
  kpiLabel: {
    color: '#64748b',
    fontSize: '11px',
    marginBottom: '8px'
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1.2,
    overflowWrap: 'anywhere'
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto'
  },
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
  muted: {
    fontSize: '11px',
    color: '#64748b',
    lineHeight: 1.5
  },
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
  return Number(value || 0).toLocaleString('en-IN');
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
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
            <tr key={`${row.name || row.mentor || 'row'}-${index}`}>
              <td style={styles.td}>
                {row.name || row.mentor || '—'}
              </td>
              {columns.map(column => (
                <td key={column.key} style={styles.td}>
                  {column.format
                    ? column.format(row[column.key])
                    : number(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function downloadCsv(rows) {
  if (!rows || rows.length === 0) return;

  // Only these four columns are exported.
  const headers = [
    'Roll No.',
    'Program',
    'Mentor',
    'Pending Subjects'
  ];

  const csvCell = value => {
    const text = String(value == null ? '' : value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map(row => [
      row.rollNo,
      row.program,
      row.mentor,
      row.pendingSubjects
    ].map(csvCell).join(','))
  ];

  const blob = new Blob(
    ['\uFEFF' + lines.join('\r\n')],
    { type: 'text/csv;charset=utf-8;' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'IA_Pending_Subjects.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

    try {
      const params = new URLSearchParams();

      if (program) params.set('program', program);
      if (salesType) params.set('salesType', salesType);
      if (mentor) params.set('mentor', mentor);

      const query = params.toString();
      const response = await fetch(
        `/api/dashboard${query ? `?${query}` : ''}`
      );

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(
          json.error || `Request failed: ${response.status}`
        );
      }

      setData(json);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis || initialKpis;
  const pendingLearners = data?.pendingLearners || [];
  const mentorProgramSummary = data?.mentorProgramSummary || [];
  const mentorProgramSalesSummary =
    data?.mentorProgramSalesSummary || [];

  const resetFilters = () => {
    setProgram('');
    setSalesType('');
    setMentor('');
  };

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
              <button style={styles.button} onClick={load}>
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
              <button style={styles.button} onClick={resetFilters}>
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
            <p style={{ ...styles.muted, marginBottom: 0, marginTop: '10px' }}>
              Loading dashboard data…
            </p>
          )}
        </section>

        <section style={styles.grid}>
          {[
            ['Total Learners', number(kpis.totalLearners)],
            ['Fully Submitted', number(kpis.fullySubmitted)],
            ['Partial Submission', number(kpis.partiallySubmitted)],
            ['Nil Submission', number(kpis.notSubmitted)],
            ['Average Submission', percent(kpis.averageSubmission)],
            ['Full Submission Rate', percent(kpis.fullySubmittedRate)],
            ['Expected Subjects', number(kpis.expectedSubjects)],
            ['Submitted Subjects', number(kpis.submittedSubjects)],
            ['Pending Subject Count', number(kpis.pendingSubjects)]
          ].map(([label, value]) => (
            <div key={label} style={styles.kpi}>
              <div style={styles.kpiLabel}>{label}</div>
              <div style={styles.kpiValue}>
                {loading ? '—' : value}
              </div>
            </div>
          ))}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Submission Status</h2>

          <div style={{ display: 'grid', gap: '12px' }}>
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
                      gap: '12px',
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
                        background:
                          item.status === 'Full'
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

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Mentor-wise Program Summary
          </h2>

          <p style={styles.muted}>
            The first two alphabetically sorted programs per mentor are shown
            side by side. Counts update with the selected filters.
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
                  </tr>
                  <tr>
                    <th style={styles.th}>Full 1</th>
                    <th style={styles.th}>Partial 1</th>
                    <th style={styles.th}>Nil 1</th>
                    <th style={styles.th}>Full 2</th>
                    <th style={styles.th}>Partial 2</th>
                    <th style={styles.th}>Nil 2</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorProgramSummary.map((row, index) => (
                    <tr key={`${row.mentor}-${index}`}>
                      <td style={styles.td}>{row.mentor}</td>
                      <td style={styles.td}>{row.program1 || '—'}</td>
                      <td style={styles.td}>{number(row.full1)}</td>
                      <td style={styles.td}>{number(row.partial1)}</td>
                      <td style={styles.td}>{number(row.nil1)}</td>
                      <td style={styles.td}>{row.program2 || '—'}</td>
                      <td style={styles.td}>{number(row.full2)}</td>
                      <td style={styles.td}>{number(row.partial2)}</td>
                      <td style={styles.td}>{number(row.nil2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Mentor-wise Program &amp; Sales Type Summary
          </h2>

          <p style={styles.muted}>
            One row per unique mentor, program, and sales type combination.
            This table follows all selected filters.
          </p>

          <SummaryTable
            rows={mentorProgramSalesSummary}
            firstColumn="Mentor"
            columns={[
              { key: 'program', label: 'Program' },
              { key: 'salesType', label: 'Sales Type' },
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'fullySubmitted', label: 'Full' },
              { key: 'partiallySubmitted', label: 'Partial' },
              { key: 'notSubmitted', label: 'Nil' }
            ]}
          />
        </section>

        <section style={styles.panel}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '10px'
            }}
          >
            <div>
              <h2 style={{ ...styles.sectionTitle, marginBottom: '5px' }}>
                Partial Submission — Pending Subjects
              </h2>
              <p style={styles.muted}>
                {number(pendingLearners.length)} partially submitted learners
                match the current filters.
              </p>
            </div>

            <button
              style={{
                ...styles.primaryButton,
                opacity: pendingLearners.length ? 1 : 0.55,
                cursor: pendingLearners.length ? 'pointer' : 'not-allowed'
              }}
              disabled={pendingLearners.length === 0}
              onClick={() => downloadCsv(pendingLearners)}
            >
              Download Pending Subjects (CSV)
            </button>
          </div>

          <p style={styles.muted}>
            The CSV contains only Roll No., Program, Mentor, and Pending
            Subjects. Learner names and email addresses are excluded.
          </p>
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
              { key: 'notSubmitted', label: 'Nil' },
              {
                key: 'averageSubmission',
                label: 'Avg. Submission',
                format: percent
              }
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
              { key: 'notSubmitted', label: 'Nil' },
              {
                key: 'averageSubmission',
                label: 'Avg. Submission',
                format: percent
              }
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
              { key: 'notSubmitted', label: 'Nil' },
              {
                key: 'averageSubmission',
                label: 'Avg. Submission',
                format: percent
              }
            ]}
          />
        </section>

        <footer style={{ ...styles.muted, textAlign: 'center', padding: '5px' }}>
          IA Submission Dashboard
        </footer>
      </div>
    </main>
  );
}
