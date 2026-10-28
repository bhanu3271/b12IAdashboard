import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

const fmt = (v) => Number(v || 0).toLocaleString('en-IN');
const pct = (v) => `${Number(v || 0).toFixed(1).replace(/\.0$/, '')}%`;
const COLORS = ['#23856d', '#e6a23c', '#d95d5d'];

function Kpi({ title, value, note, tone = '' }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );
}

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryTable({ columns, rows }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.label}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              {columns.map((c) => (
                <td key={c.label}>
                  {c.format ? c.format(row[c.key]) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={columns.length}>No data available.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState('');
  const [salesType, setSalesType] = useState('');
  const [mentor, setMentor] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams();

      if (program) query.set('program', program);
      if (salesType) query.set('salesType', salesType);
      if (mentor) query.set('mentor', mentor);

      const response = await fetch(`/api/dashboard?${query.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Could not load dashboard.');
      }

      setData(json);
    } catch (e) {
      setError(e.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    load();
  }, [load]);

  const k = data?.kpis || {};

  const programChart = useMemo(
    () => (data?.programSummary || []).slice(0, 12).map((x) => ({
      ...x,
      shortName: x.name.length > 22
        ? `${x.name.slice(0, 20)}…`
        : x.name
    })),
    [data]
  );

  return (
    <>
      <Head>
        <title>IA Submission Dashboard</title>
        <meta name="description" content="IA submission progress dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="page-shell">
        <header className="hero">
          <div className="brand-mark">IA</div>

          <div className="hero-copy">
            <div className="eyebrow">ACADEMIC OPERATIONS</div>
            <h1>IA Submission Dashboard</h1>
            <p>Internal Assessment submission progress at a glance</p>
          </div>

          <button
            className="refresh-btn"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : '↻ Refresh data'}
          </button>
        </header>

        <section className="filter-bar">
          <div className="filter-title">
            <span className="filter-icon">☷</span>
            <div>
              <strong>Dashboard filters</strong>
              <small>Choose a view for your data</small>
            </div>
          </div>

          <label>
            Program
            <select value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="">All programs</option>
              {(data?.filters?.programs || []).map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>

          <label>
            Sales Type
            <select value={salesType} onChange={(e) => setSalesType(e.target.value)}>
              <option value="">All sales types</option>
              {(data?.filters?.salesTypes || []).map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>

          <label>
            Primary Mentor
            <select value={mentor} onChange={(e) => setMentor(e.target.value)}>
              <option value="">All mentors</option>
              {(data?.filters?.mentors || []).map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>

          <button
            className="clear-btn"
            onClick={() => {
              setProgram('');
              setSalesType('');
              setMentor('');
            }}
          >
            Clear
          </button>
        </section>

        {error && (
          <div className="error-box">
            <strong>Dashboard could not load</strong>
            <p>{error}</p>
            <small>
              Check the Google Sheet permissions and Vercel environment variables.
            </small>
          </div>
        )}

        {loading && !data && (
          <div className="loading-box">Loading dashboard data…</div>
        )}

        {data && (
          <>
            <div className="section-label">
              <span>OVERVIEW</span>
              <span className="updated">
                Last checked: {new Date(data.updatedAt).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="kpi-grid">
              <Kpi title="Total learners" value={fmt(k.totalLearners)}
                note="Learners in selected view" />
              <Kpi title="Fully submitted" value={fmt(k.fullySubmitted)}
                note={`${pct(k.fullySubmittedRate)} of learners`} tone="success" />
              <Kpi title="Partially submitted" value={fmt(k.partiallySubmitted)}
                note="At least one subject submitted" tone="warning" />
              <Kpi title="Not submitted" value={fmt(k.notSubmitted)}
                note="No submission recorded" tone="danger" />
              <Kpi title="Average submission" value={pct(k.averageSubmission)}
                note="Average across learners" tone="blue" />
            </div>

            <div className="two-col">
              <Panel title="Submission status"
                subtitle="Learners grouped by submission progress">

                <div className="chart-wrap pie-wrap">
                  {data.statusSummary?.some((x) => x.value > 0) ? (
                    <>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={data.statusSummary}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={94}
                            paddingAngle={3}
                          >
                            {data.statusSummary.map((entry, i) => (
                              <Cell key={entry.name} fill={COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="legend-list">
                        {data.statusSummary.map((x, i) => (
                          <div key={x.name}>
                            <span className="legend-dot"
                              style={{ background: COLORS[i] }} />
                            <span>{x.name}</span>
                            <strong>{fmt(x.value)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">No learners match these filters.</div>
                  )}
                </div>
              </Panel>

              <Panel title="Subject submission totals"
                subtitle="Expected, submitted and pending subject counts">

                <div className="subject-metrics">
                  <div>
                    <span>Expected subjects</span>
                    <strong>{fmt(k.expectedSubjects)}</strong>
                  </div>
                  <div>
                    <span>Submitted subjects</span>
                    <strong className="green-text">{fmt(k.submittedSubjects)}</strong>
                  </div>
                  <div>
                    <span>Pending subjects</span>
                    <strong className="red-text">{fmt(k.pendingSubjects)}</strong>
                  </div>
                </div>

                <div className="progress-label">
                  <span>Submitted subjects</span>
                  <strong>
                    {pct(k.expectedSubjects
                      ? k.submittedSubjects / k.expectedSubjects * 100
                      : 0)}
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.max(0, Math.min(
                        100,
                        k.expectedSubjects
                          ? k.submittedSubjects / k.expectedSubjects * 100
                          : 0
                      ))}%`
                    }}
                  />
                </div>

                <p className="small-note">
                  Subject totals are based on the IA Data sheet.
                </p>
              </Panel>
            </div>

            <Panel title="Program-wise submission overview"
              subtitle="Programs with the highest learner counts"
              className="wide-panel">

              {programChart.length ? (
                <div className="chart-wrap">
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, programChart.length * 42)}
                  >
                    <BarChart
                      data={programChart}
                      layout="vertical"
                      margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="shortName"
                        width={145} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(v, name) => [fmt(v), name]}
                        labelFormatter={(label) =>
                          programChart.find((x) => x.shortName === label)?.name || label
                        }
                      />
                      <Bar dataKey="fullySubmitted" name="Fully submitted"
                        stackId="a" fill="#23856d" />
                      <Bar dataKey="partiallySubmitted" name="Partially submitted"
                        stackId="a" fill="#e6a23c" />
                      <Bar dataKey="notSubmitted" name="Not submitted"
                        stackId="a" fill="#d95d5d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="chart-legend">
                    <span><i className="dot green" />Fully submitted</span>
                    <span><i className="dot amber" />Partially submitted</span>
                    <span><i className="dot red" />Not submitted</span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">No program data available.</div>
              )}
            </Panel>

            <div className="two-col lower-grid">
              <Panel title="Program summary" subtitle="Aggregated figures only">
                <SummaryTable
                  columns={[
                    { label: 'Program', key: 'name' },
                    { label: 'Learners', key: 'learners', format: fmt },
                    { label: 'Fully submitted', key: 'fullySubmitted', format: fmt },
                    { label: 'Avg. submission', key: 'averageSubmission', format: pct }
                  ]}
                  rows={data.programSummary || []}
                />
              </Panel>

              <Panel title="Sales type summary"
                subtitle="Compare submission status by sales type">
                <SummaryTable
                  columns={[
                    { label: 'Sales type', key: 'name' },
                    { label: 'Learners', key: 'learners', format: fmt },
                    { label: 'Fully submitted', key: 'fullySubmitted', format: fmt },
                    { label: 'Not submitted', key: 'notSubmitted', format: fmt }
                  ]}
                  rows={data.salesSummary || []}
                />
              </Panel>
            </div>

            {data.mentorSummary?.length > 0 && (
              <Panel title="Mentor summary"
                subtitle="Aggregated results; individual learner records are not displayed">
                <SummaryTable
                  columns={[
                    { label: 'Primary mentor', key: 'name' },
                    { label: 'Learners', key: 'learners', format: fmt },
                    { label: 'Fully submitted', key: 'fullySubmitted', format: fmt },
                    { label: 'Partially submitted', key: 'partiallySubmitted', format: fmt },
                    { label: 'Not submitted', key: 'notSubmitted', format: fmt },
                    { label: 'Avg. submission', key: 'averageSubmission', format: pct }
                  ]}
                  rows={data.mentorSummary || []}
                />
              </Panel>
            )}
          </>
        )}

        <footer className="footer">
          <span>IA Submission Dashboard</span>
          <span>Aggregated reporting · No learner-level personal data is displayed</span>
        </footer>
      </main>
    </>
  );
}
