
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
  kpiLabel: { color: '#64748b', fontSize: '11px', marginBottom: '8px' },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1.2,
    overflowWrap: 'anywhere'
  },
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

  return value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(parsed)
    ? parsed.toLocaleString('en-IN')
    : '0';
}

function percent(value) {
  const parsed = Number(value);

  return value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(parsed)
    ? `${parsed.toFixed(1)}%`
    : '0.0%';
}

function textValue(value) {
  return value === null ||
    value === undefined ||
    String(value).trim() === ''
    ? '—'
    : String(value);
}

function getPendingSubjectCodes(row) {
  const value =
    row?.pendingSubjectCodes ??
    row?.pendingSubjects ??
    '';

  return String(value || '').trim();
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
            <tr
              key={`${row.name || row.mentor || row.salesType || 'row'}-${index}`}
            >
              <td style={styles.td}>
                {textValue(row.name || row.mentor || row.salesType)}
              </td>

              {columns.map(column => {
                const value = row[column.key];

                let displayedValue;

                if (column.format) {
                  displayedValue = column.format(value, row);
                } else if (column.type === 'text') {
                  displayedValue = textValue(value);
                } else {
                  displayedValue = number(value);
                }

                return (
                  <td key={column.key} style={styles.td}>
                    {displayedValue}
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
    const mentor = row.mentor || 'Unassigned';

    if (!grouped[mentor]) {
      grouped[mentor] = [];
    }

    grouped[mentor].push(row);
  });

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map(mentor => {
      const programs = grouped[mentor]
        .slice()
        .sort((a, b) =>
          String(a.program || '').localeCompare(String(b.program || ''))
        );

      const first = programs[0] || {};
      const second = programs[1] || {};

      return {
        mentor,
        program1: first.program || '',
        full1: first.fullySubmitted || 0,
        partial1: first.partiallySubmitted || 0,
        nil1: first.notSubmitted || 0,
        program2: second.program || '',
        full2: second.fullySubmitted || 0,
        partial2: second.partiallySubmitted || 0,
        nil2: second.notSubmitted || 0
      };
    });
}

function downloadCsv(rows) {
  if (!rows || rows.length === 0) {
    alert('No pending-subject records available to download.');
    return;
  }

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
      getPendingSubjectCodes(row)
    ].map(csvCell).join(','))
  ];

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], {
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
        throw new Error(
          json.error || `Request failed with HTTP ${response.status}.`
        );
      }

      if (!json.kpis || !json.filters) {
        throw new Error(
          'The API response is missing dashboard data. Check the Apps Script deployment.'
        );
      }

      setData(json);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError(
          'The dashboard request took longer than 60 seconds. Please retry. If this continues, the API response may be too slow or too large.'
        );
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
  const mentorSalesSummary = data?.mentorSalesSummary || [];

  const mentorProgramSummary = prepareMentorProgramSummary(
    data?.mentorProgramSummary || []
  );

  const totalLearners = Number(kpis.totalLearners || 0);

  const fullCount = Number(
    kpis.fullySubmitted ?? kpis.full ?? 0
  );

  const fullRate = totalLearners
    ? (fullCount / totalLearners) * 100
    : 0;

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
            ['Average Submission', percent(kpis.averageSubmission ?? kpis.avgSubmission)],
            ['Full Submission Rate', percent(fullRate)]
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
          <h2 style={styles.sectionTitle}>Mentor-wise Program Summary</h2>
          <p style={styles.muted}>
            Shows the first two programs alphabetically for each mentor.
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
                      <td style={styles.td}>{textValue(row.program1)}</td>
                      <td style={styles.td}>{number(row.full1)}</td>
                      <td style={styles.td}>{number(row.partial1)}</td>
                      <td style={styles.td}>{number(row.nil1)}</td>
                      <td style={styles.td}>{textValue(row.program2)}</td>
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
          <h2 style={styles.sectionTitle}>Mentor-wise Sales Type Summary</h2>
          <p style={styles.muted}>
            One row per mentor and sales type. Program is not included in this table.
          </p>

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

        {/* Pending Subjects: download button only; table and count removed. */}
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
                opacity: pendingLearners.length > 0 && !loading ? 1 : 0.55,
                cursor: pendingLearners.length > 0 && !loading
                  ? 'pointer'
                  : 'not-allowed'
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
