
import { useCallback, useEffect, useState } from 'react';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '24px',
    color: '#1f2937',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '13px'
  },
  container: {
    maxWidth: '1600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    margin: '0 0 6px',
    fontWeight: 700
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  button: {
    border: '1px solid #1d4ed8',
    background: '#1d4ed8',
    color: '#fff',
    borderRadius: '6px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600
  },
  panel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '18px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    margin: '0 0 8px'
  },
  description: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 16px',
    lineHeight: 1.6
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    minWidth: '1250px',
    borderCollapse: 'collapse',
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums'
  },
  thGroup: {
    padding: '11px 10px',
    background: '#1e3a5f',
    color: '#fff',
    border: '1px solid #dbe2ea',
    textAlign: 'center',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  th: {
    padding: '11px 10px',
    background: '#eaf0f8',
    color: '#26364a',
    border: '1px solid #dbe2ea',
    textAlign: 'center',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '11px 10px',
    border: '1px solid #e5eaf0',
    textAlign: 'right',
    whiteSpace: 'nowrap'
  },
  programmeCell: {
    padding: '11px 12px',
    border: '1px solid #e5eaf0',
    textAlign: 'left',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  totalRow: {
    background: '#edf3fb',
    fontWeight: 700
  },
  message: {
    padding: '13px',
    borderRadius: '7px',
    marginBottom: '14px',
    fontSize: '13px'
  },
  error: {
    background: '#fff1f2',
    color: '#9f1239',
    border: '1px solid #fecdd3'
  },
  info: {
    background: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe'
  },
  footer: {
    marginTop: '14px',
    color: '#64748b',
    fontSize: '11px',
    textAlign: 'right'
  }
};

function number(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString('en-IN')
    : '—';
}

function percent(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const n = Number(value);
  return Number.isFinite(n)
    ? `${n.toFixed(2)}%`
    : '—';
}

function cellStyle(row) {
  return row.program === 'Grand Total'
    ? { ...styles.td, ...styles.totalRow }
    : styles.td;
}

function programmeStyle(row) {
  return row.program === 'Grand Total'
    ? { ...styles.programmeCell, ...styles.totalRow }
    : styles.programmeCell;
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
        `/api/dashboard?_refresh=${Date.now()}`,
        {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const responseText = await response.text();
      let json;

      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The API returned a non-JSON response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || json.error || json.success === false) {
        throw new Error(
          json.error || `Request failed with HTTP ${response.status}.`
        );
      }

      if (!Array.isArray(json.programTable)) {
        throw new Error(
          'The API did not return programTable. Deploy the updated Apps Script and verify the API URL.'
        );
      }

      setRows(json.programTable);
      setGeneratedAt(json.generatedAt || '');

    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'The request exceeded 60 seconds. Please try refreshing again.'
          : err.message || 'Unable to load programme data.'
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const regularRows = rows.filter(row => row.program !== 'Grand Total');
  const grandTotal = rows.find(row => row.program === 'Grand Total');

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>IA Submission Dashboard</h1>
            <p style={styles.subtitle}>
              B11 programme-wise Internal Assessment submission performance
            </p>
          </div>

          <button
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </header>

        {error && (
          <div style={{ ...styles.message, ...styles.error }}>
            <strong>Unable to load data:</strong> {error}
            <div style={{ marginTop: '10px' }}>
              <button style={styles.button} onClick={load} disabled={loading}>
                Retry
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ ...styles.message, ...styles.info }}>
            Loading programme submission data…
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ ...styles.message, ...styles.info }}>
            The API returned no programme rows. Check the IA Data sheet and
            Apps Script deployment.
          </div>
        )}

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Programme-wise Submission Summary
          </h2>

          <p style={styles.description}>
            Full Submission % is based on learners with all expected subjects
            submitted. Full + Partial % includes learners who submitted at
            least one subject. Overall percentages are calculated using
            combined learner counts, not averages of percentages.
          </p>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={styles.thGroup}
                    rowSpan={2}
                  >
                    Programme Name
                  </th>

                  <th style={styles.thGroup} colSpan={3}>
                    B11 Learner Count
                  </th>

                  <th
                    style={styles.thGroup}
                    rowSpan={2}
                  >
                    Target %
                  </th>

                  <th style={styles.thGroup} colSpan={3}>
                    Full Submission
                  </th>

                  <th style={styles.thGroup} colSpan={3}>
                    Full + Partial Submission
                  </th>
                </tr>

                <tr>
                  <th style={styles.th}>Channel</th>
                  <th style={styles.th}>Inside</th>
                  <th style={styles.th}>Total Learners</th>

                  <th style={styles.th}>Channel %</th>
                  <th style={styles.th}>Inside %</th>
                  <th style={styles.th}>Overall Full %</th>

                  <th style={styles.th}>Channel %</th>
                  <th style={styles.th}>Inside %</th>
                  <th style={styles.th}>Overall Full + Partial %</th>
                </tr>
              </thead>

              <tbody>
                {regularRows.map(row => (
                  <tr key={row.program}>
                    <td style={programmeStyle(row)}>
                      {row.program}
                    </td>

                    <td style={cellStyle(row)}>
                      {number(row.channelTotal)}
                    </td>
                    <td style={cellStyle(row)}>
                      {number(row.insideTotal)}
                    </td>
                    <td style={cellStyle(row)}>
                      {number(row.totalLearners)}
                    </td>

                    <td style={cellStyle(row)}>
                      {percent(row.target)}
                    </td>

                    <td style={cellStyle(row)}>
                      {percent(row.channelFullPercent)}
                    </td>
                    <td style={cellStyle(row)}>
                      {percent(row.insideFullPercent)}
                    </td>
                    <td style={cellStyle(row)}>
                      {percent(row.overallFullPercent)}
                    </td>

                    <td style={cellStyle(row)}>
                      {percent(row.channelFullPartialPercent)}
                    </td>
                    <td style={cellStyle(row)}>
                      {percent(row.insideFullPartialPercent)}
                    </td>
                    <td style={cellStyle(row)}>
                      {percent(row.overallFullPartialPercent)}
                    </td>
                  </tr>
                ))}

                {grandTotal && (
                  <tr>
                    <td style={programmeStyle(grandTotal)}>
                      Grand Total
                    </td>

                    <td style={cellStyle(grandTotal)}>
                      {number(grandTotal.channelTotal)}
                    </td>
                    <td style={cellStyle(grandTotal)}>
                      {number(grandTotal.insideTotal)}
                    </td>
                    <td style={cellStyle(grandTotal)}>
                      {number(grandTotal.totalLearners)}
                    </td>

                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.target)}
                    </td>

                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.channelFullPercent)}
                    </td>
                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.insideFullPercent)}
                    </td>
                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.overallFullPercent)}
                    </td>

                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.channelFullPartialPercent)}
                    </td>
                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.insideFullPartialPercent)}
                    </td>
                    <td style={cellStyle(grandTotal)}>
                      {percent(grandTotal.overallFullPartialPercent)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.footer}>
            {generatedAt
              ? `Last data update: ${new Date(generatedAt).toLocaleString('en-IN')}`
              : 'Refresh the dashboard to retrieve the latest data.'}
          </div>
        </section>
      </div>
    </main>
  );
}
