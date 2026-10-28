
import { useCallback, useEffect, useState } from 'react';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#172033',
    padding: '28px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  subtitle: {
    color: '#64748b',
    marginTop: '8px',
    fontSize: '14px',
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px',
    padding: '18px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '12px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    flex: '1 1 180px',
  },
  label: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 700,
  },
  select: {
    width: '100%',
    minHeight: '40px',
    padding: '8px',
    border: '1px solid #dbe2ec',
    borderRadius: '7px',
    background: '#fff',
    color: '#172033',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    padding: '20px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    minWidth: 0,
  },
  metricLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '12px',
  },
  metricValue: {
    fontSize: '30px',
    fontWeight: 700,
    overflowWrap: 'anywhere',
  },
  sectionTitle: {
    fontSize: '18px',
    margin: '0 0 18px',
  },
  section: {
    padding: '22px',
    marginBottom: '24px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '12px',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
  },
  th: {
    padding: '12px 10px',
    background: '#f8fafc',
    color: '#64748b',
    borderBottom: '1px solid #e5eaf2',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '13px 10px',
    borderBottom: '1px solid #edf0f5',
  },
  button: {
    padding: '10px 15px',
    border: '1px solid #dbe2ec',
    borderRadius: '7px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
  },
};

function number(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function percentage(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function MetricCard({ label, value, note }) {
  return (
    <div style={styles.card}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      {note ? (
        <div style={{ marginTop: '9px', color: '#64748b', fontSize: '12px' }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}

function SummaryTable({ title, rows, showName = true }) {
  if (!rows || rows.length === 0) {
    return (
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={{ color: '#64748b' }}>No summary data available.</p>
      </section>
    );
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            {showName ? <th style={styles.th}>Category</th> : null}
            <th style={styles.th}>Learners</th>
            <th style={styles.th}>Fully Submitted</th>
            <th style={styles.th}>Partially Submitted</th>
            <th style={styles.th}>Not Submitted</th>
            <th style={styles.th}>Expected Subjects</th>
            <th style={styles.th}>Submitted Subjects</th>
            <th style={styles.th}>Pending Subjects</th>
            <th style={styles.th}>Avg. Submission</th>
            <th style={styles.th}>Completion Rate</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.name || 'category'}-${index}`}>
              {showName ? (
                <td style={styles.td}>
                  <strong>{row.name || 'Not specified'}</strong>
                </td>
              ) : null}
              <td style={styles.td}>{number(row.learners)}</td>
              <td style={styles.td}>{number(row.fullySubmitted)}</td>
              <td style={styles.td}>{number(row.partiallySubmitted)}</td>
              <td style={styles.td}>{number(row.notSubmitted)}</td>
              <td style={styles.td}>{number(row.expectedSubjects)}</td>
              <td style={styles.td}>{number(row.submittedSubjects)}</td>
              <td style={styles.td}>{number(row.pendingSubjects)}</td>
              <td style={styles.td}>{percentage(row.averageSubmission)}</td>
              <td style={styles.td}>{percentage(row.completionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [program, setProgram] = useState('');
  const [salesType, setSalesType] = useState('');
  const [mentor, setMentor] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (program) params.set('program', program);
      if (salesType) params.set('salesType', salesType);
      if (mentor) params.set('mentor', mentor);

      const query = params.toString();
      const endpoint = query
        ? `/api/dashboard?${query}`
        : '/api/dashboard';

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setData(json);
    } catch (e) {
      setError(
        'Unable to load dashboard data. ' +
          (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const filters = data?.filters || {};
  const kpis = data?.kpis || {};

  const selectStyle = styles.select;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px' }}>
              IA Submission Dashboard
            </h1>
            <p style={styles.subtitle}>
              Internal Assessment submission overview
            </p>
          </div>

          <button
            type="button"
            style={styles.button}
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        <section style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.label} htmlFor="program-filter">
              PROGRAM
            </label>
            <select
              id="program-filter"
              style={selectStyle}
              value={program}
              onChange={(e) => setProgram(e.target.value)}
            >
              <option value="">All Programs</option>
              {(filters.programs || []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label} htmlFor="sales-filter">
              SALES TYPE
            </label>
            <select
              id="sales-filter"
              style={selectStyle}
              value={salesType}
              onChange={(e) => setSalesType(e.target.value)}
            >
              <option value="">All Sales Types</option>
              {(filters.salesTypes || []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label} htmlFor="mentor-filter">
              PRIMARY MENTOR
            </label>
            <select
              id="mentor-filter"
              style={selectStyle}
              value={mentor}
              onChange={(e) => setMentor(e.target.value)}
            >
              <option value="">All Mentors</option>
              {(filters.mentors || []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'end',
              paddingBottom: '1px',
            }}
          >
            <button
              type="button"
              style={styles.button}
              onClick={() => {
                setProgram('');
                setSalesType('');
                setMentor('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </section>

        {error ? (
          <section
            role="alert"
            style={{
              ...styles.section,
              color: '#b91c1c',
              borderColor: '#fecaca',
              background: '#fff7f7',
            }}
          >
            <strong>Dashboard data could not be loaded.</strong>
            <p>{error}</p>
            <p>
              Check that the Apps Script web app is deployed and that
              <code> pages/api/dashboard.js </code>
              contains the correct Apps Script URL.
            </p>
            <button type="button" style={styles.button} onClick={load}>
              Try Again
            </button>
          </section>
        ) : null}

        {loading && !data ? (
          <section style={styles.section}>
            Loading dashboard data...
          </section>
        ) : null}

        {!loading && !error && data ? (
          <>
            <section style={styles.grid}>
              <MetricCard
                label="Total Learners"
                value={number(kpis.totalLearners)}
              />
              <MetricCard
                label="Fully Submitted"
                value={number(kpis.fullySubmitted)}
                note={percentage(kpis.fullySubmittedRate)}
              />
              <MetricCard
                label="Partially Submitted"
                value={number(kpis.partiallySubmitted)}
              />
              <MetricCard
                label="Not Submitted"
                value={number(kpis.notSubmitted)}
              />
              <MetricCard
                label="Average Submission"
                value={percentage(kpis.averageSubmission)}
              />
              <MetricCard
                label="Expected Subjects"
                value={number(kpis.expectedSubjects)}
              />
              <MetricCard
                label="Submitted Subjects"
                value={number(kpis.submittedSubjects)}
              />
              <MetricCard
                label="Pending Subjects"
                value={number(kpis.pendingSubjects)}
              />
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Submission Status</h2>

              {(data.statusSummary || []).map((item) => {
                const total = Number(kpis.totalLearners || 0);
                const rate = total
                  ? (Number(item.value || 0) / total) * 100
                  : 0;

                return (
                  <div key={item.name} style={{ marginBottom: '18px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '7px',
                        fontSize: '13px',
                      }}
                    >
                      <span>{item.name}</span>
                      <strong>
                        {number(item.value)} ({percentage(rate)})
                      </strong>
                    </div>

                    <div
                      style={{
                        height: '10px',
                        background: '#edf1f7',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, rate)}%`,
                          background: '#4969d8',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>

            <SummaryTable
              title="Program-wise Summary"
              rows={data.programSummary}
            />

            <SummaryTable
              title="Sales Type Summary"
              rows={data.salesSummary}
            />

            <SummaryTable
              title="Mentor-wise Summary"
              rows={data.mentorSummary}
            />

            <p
              style={{
                color: '#64748b',
                fontSize: '12px',
                textAlign: 'right',
                marginTop: '16px',
              }}
            >
              Last updated:{' '}
              {data.updatedAt
                ? new Date(data.updatedAt).toLocaleString('en-IN')
                : 'Not available'}
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
