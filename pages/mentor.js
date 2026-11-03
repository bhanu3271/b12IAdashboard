
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
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    margin: 0
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
  downloadButton: {
    border: '1px solid #1d4ed8',
    background: '#1d4ed8',
    color: '#fff',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '11px',
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px'
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

function csvCell(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function downloadRowsAsCsv(rows, filename, headers) {
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

function TableSection({
  title,
  rows,
  columns,
  filename,
  onDownload,
  loading
}) {
  return (
    <section style={styles.panel}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{title}</h2>

        <button
          type="button"
          style={{
            ...styles.downloadButton,
            opacity: loading || !rows.length ? 0.55 : 1,
            cursor: loading || !rows.length ? 'not-allowed' : 'pointer'
          }}
          disabled={loading || !rows.length}
          onClick={() => onDownload(rows, filename, columns)}
        >
          Download CSV
        </button>
      </div>

      {!rows.length ? (
        <p style={styles.muted}>
          No data available for the selected filters.
        </p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column.key} style={styles.th}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {columns.map(column => {
                    const value = getField(row, ...column.keys);

                    return (
                      <td key={column.key} style={styles.td}>
                        {column.format
                          ? column.format(value, row)
                          : column.type === 'text'
                            ? textValue(value)
                            : number(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function MentorDashboard() {
  const [data, setData] = useState(null);

  const [program, setProgram] = useState('');
  const [salesType, setSalesType] = useState('');
  const [mentor, setMentor] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setDownloadError('');
    setDownloadMessage('');

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
          `The dashboard API returned a non-JSON response. HTTP ${response.status}.`
        );
      }

      if (!response.ok || json.error) {
        throw new Error(
          json.error || `Request failed with HTTP ${response.status}.`
        );
      }

      if (!json.kpis || !json.filters) {
        throw new Error(
          'The API response is missing KPI or filter information.'
        );
      }

      setData(json);
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'Dashboard request timed out. Please retry.'
          : err.message || 'Unable to load dashboard data.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis || initialKpis;
  const filters = data?.filters || {};

  const totalLearners = Number(kpis.totalLearners || 0);
  const fullCount = Number(
    kpis.fullySubmitted ?? kpis.full ?? 0
  );

  const fullRate = totalLearners
    ? (fullCount / totalLearners) * 100
    : 0;

  const kpiCards = [
    {
      label: 'Total Learners',
      value: number(kpis.totalLearners),
      color: '#2563eb'
    },
    {
      label: 'Fully Submitted',
      value: number(kpis.fullySubmitted ?? kpis.full),
      color: '#16a34a'
    },
    {
      label: 'Partial Submission',
      value: number(kpis.partiallySubmitted ?? kpis.partial),
      color: '#d97706'
    },
    {
      label: 'Nil Submission',
      value: number(kpis.notSubmitted ?? kpis.nil),
      color: '#64748b'
    },
    {
      label: 'Average Submission',
      value: percent(kpis.averageSubmission ?? kpis.avgSubmission),
      color: '#7c3aed'
    },
    {
      label: 'Full Submission Rate',
      value: percent(fullRate),
      color: '#0891b2'
    }
  ];

  // Table 1: Submission Status
  const submissionStatusRows = data?.statusSummary || [];

  const submissionStatusColumns = [
    {
      key: 'status',
      label: 'Submission Status',
      keys: ['status'],
      type: 'text'
    },
    {
      key: 'count',
      label: 'Total Learners',
      keys: ['count', 'totalLearners']
    },
    {
      key: 'percentage',
      label: 'Percentage',
      keys: ['percentage', 'percent'],
      format: value => percent(value)
    }
  ];

  // Table 2: Mentor-wise Program Summary
  const mentorProgramRows = data?.mentorProgramSummary || [];

  const mentorProgramColumns = [
    {
      key: 'mentor',
      label: 'Mentor',
      keys: ['mentor', 'name'],
      type: 'text'
    },
    {
      key: 'program',
      label: 'Program',
      keys: ['program'],
      type: 'text'
    },
    {
      key: 'totalLearners',
      label: 'Total Learners',
      keys: ['totalLearners']
    },
    {
      key: 'fullySubmitted',
      label: 'Full',
      keys: ['fullySubmitted', 'full']
    },
    {
      key: 'partiallySubmitted',
      label: 'Partial',
      keys: ['partiallySubmitted', 'partial']
    },
    {
      key: 'notSubmitted',
      label: 'Nil',
      keys: ['notSubmitted', 'nil']
    }
  ];

  // Table 3: Mentor-wise Sales Type Summary
  const mentorSalesRows = data?.mentorSalesSummary || [];

  const mentorSalesColumns = [
    {
      key: 'mentor',
      label: 'Mentor',
      keys: ['mentor', 'name'],
      type: 'text'
    },
    {
      key: 'salesType',
      label: 'Sales Type',
      keys: ['salesType'],
      type: 'text'
    },
    {
      key: 'totalLearners',
      label: 'Total Learners',
      keys: ['totalLearners']
    },
    {
      key: 'fullySubmitted',
      label: 'Full',
      keys: ['fullySubmitted', 'full']
    },
    {
      key: 'partiallySubmitted',
      label: 'Partial',
      keys: ['partiallySubmitted', 'partial']
    },
    {
      key: 'notSubmitted',
      label: 'Nil',
      keys: ['notSubmitted', 'nil']
    }
  ];

  // Table 4: Mentor-wise Summary
  const mentorSummaryRows = data?.mentorSummary || [];

  const mentorSummaryColumns = [
    {
      key: 'mentor',
      label: 'Mentor',
      keys: ['mentor', 'name'],
      type: 'text'
    },
    {
      key: 'totalLearners',
      label: 'Total Learners',
      keys: ['totalLearners']
    },
    {
      key: 'fullySubmitted',
      label: 'Full',
      keys: ['fullySubmitted', 'full']
    },
    {
      key: 'partiallySubmitted',
      label: 'Partial',
      keys: ['partiallySubmitted', 'partial']
    },
    {
      key: 'notSubmitted',
      label: 'Nil',
      keys: ['notSubmitted', 'nil']
    }
  ];

  function downloadTable(rows, filename, columns) {
    setDownloadError('');
    setDownloadMessage('');

    const csvHeaders = columns.map(column => ({
      key: column.key,
      label: column.label
    }));

    const exportRows = rows.map(row => {
      const result = {};

      columns.forEach(column => {
        result[column.key] = getField(row, ...column.keys);
      });

      return result;
    });

    const success = downloadRowsAsCsv(
      exportRows,
      filename,
      csvHeaders
    );

    if (success) {
      setDownloadMessage(`${filename} downloaded successfully.`);
    } else {
      setDownloadMessage('No data available to download.');
    }
  }

  function resetFilters() {
    setProgram('');
    setSalesType('');
    setMentor('');
  }

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
          {kpiCards.map(item => (
            <div
              key={item.label}
              style={{
                ...styles.kpi,
                borderTop: `3px solid ${item.color}`
              }}
            >
              <div style={styles.kpiLabel}>{item.label}</div>
              <div style={styles.kpiValue}>
                {loading ? '—' : item.value}
              </div>
            </div>
          ))}
        </section>

        {downloadError && (
          <div style={styles.error}>
            <strong>Download failed:</strong> {downloadError}
          </div>
        )}

        {downloadMessage && (
          <div style={styles.success}>{downloadMessage}</div>
        )}

        {/* TABLE 1 */}
        <TableSection
          title="Submission Status"
          rows={submissionStatusRows}
          columns={submissionStatusColumns}
          filename="Submission_Status.csv"
          onDownload={downloadTable}
          loading={loading}
        />

        {/* TABLE 2 */}
        <TableSection
          title="Mentor-wise Program Summary"
          rows={mentorProgramRows}
          columns={mentorProgramColumns}
          filename="Mentor_Wise_Program_Summary.csv"
          onDownload={downloadTable}
          loading={loading}
        />

        {/* TABLE 3 */}
        <TableSection
          title="Mentor-wise Sales Type Summary"
          rows={mentorSalesRows}
          columns={mentorSalesColumns}
          filename="Mentor_Wise_Sales_Type_Summary.csv"
          onDownload={downloadTable}
          loading={loading}
        />

        {/* TABLE 4 */}
        <TableSection
          title="Mentor-wise Summary"
          rows={mentorSummaryRows}
          columns={mentorSummaryColumns}
          filename="Mentor_Wise_Summary.csv"
          onDownload={downloadTable}
          loading={loading}
        />

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
