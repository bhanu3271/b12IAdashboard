
import { useCallback, useEffect, useState } from 'react';

const initialKpis = {
  totalLearners: 0,
  fullySubmitted: 0,
  partiallySubmitted: 0,
  nilSubmission: 0,
  fullPercent: 0,
  fullPartialPercent: 0,
  pendingSubjectCount: 0
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
  groupedTh: {
    padding: '10px',
    background: '#1e3a5f',
    border: '1px solid #dbe2ea',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 700
  },
  subTh: {
    padding: '9px 10px',
    background: '#eaf0f8',
    border: '1px solid #dbe2ea',
    textAlign: 'center',
    color: '#334155',
    fontWeight: 700
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid #edf0f4',
    textAlign: 'left'
  },
  numericTd: {
    padding: '8px 10px',
    borderBottom: '1px solid #edf0f4',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums'
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
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0';
}

function percent(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : '—';
}

function changePercent(value) {
  if (value === null || value === undefined || value === '') {
    return 'No baseline';
  }
  const n = Number(value);
  return `${n > 0 ? '+' : ''}${n.toFixed(1)} pp`;
}

function textValue(value) {
  return value === null || value === undefined || String(value).trim() === ''
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

function prepareMentorProgramSummary(rows) {
  return (rows || []).slice().sort((a, b) => {
    const mentorCompare = String(a.mentor || '').localeCompare(
      String(b.mentor || '')
    );
    if (mentorCompare !== 0) return mentorCompare;
    return String(a.program || '').localeCompare(String(b.program || ''));
  });
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
            {columns.map(column => (
              <th key={column.key} style={styles.th}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.name || row.mentor || row.salesType || 'row'}-${index}`}>
              <td style={styles.td}>
                {textValue(row.name || row.mentor || row.salesType)}
              </td>
              {columns.map(column => (
                <td key={column.key} style={styles.td}>
                  {column.format
                    ? column.format(row[column.key], row)
                    : column.type === 'text'
                      ? textValue(row[column.key])
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
  if (!rows || rows.length === 0) {
    alert('No pending-subject records available to download.');
    return;
  }

  const headers = [
    'Roll No.',
    'Program',
    'Mentor',
    'Pending Subject Count',
    'Pending Course Codes'
  ];

  const csvCell = value =>
    `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;

  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map(row => {
      const codes = getPendingSubjectCodes(row);
      const codeList = codes
        ? codes.split(/[,;\n|]+/).map(code => code.trim()).filter(Boolean)
        : [];

      const count =
        row.pendingSubjectCount !== null &&
        row.pendingSubjectCount !== undefined
          ? Number(row.pendingSubjectCount)
          : new Set(codeList).size;

      return [
        row.rollNo,
        row.program,
        row.mentor,
        count,
        codes
      ].map(csvCell).join(',');
    })
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

function ProgrammeSubmissionTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <p style={styles.muted}>
        No programme submission data returned. Verify the Apps Script deployment.
      </p>
    );
  }

  const regularRows = rows.filter(row => row.program !== 'Grand Total');
  const grandTotal = rows.find(row => row.program === 'Grand Total');

  function renderRow(row) {
    const isTotal = row.program === 'Grand Total';
    const td = isTotal
      ? { ...styles.numericTd, fontWeight: 700, background: '#edf3fb' }
      : styles.numericTd;
    const nameTd = isTotal
      ? { ...styles.td, fontWeight: 700, background: '#edf3fb' }
      : { ...styles.td, fontWeight: 600 };

    return (
      <tr key={row.program}>
        <td style={nameTd}>{row.program}</td>
        <td style={td}>{number(row.channelTotal)}</td>
        <td style={td}>{number(row.insideTotal)}</td>
        <td style={td}>{number(row.totalLearners)}</td>
        <td style={td}>{percent(row.target)}</td>
        <td style={td}>{percent(row.channelFullPercent)}</td>
        <td style={td}>{percent(row.insideFullPercent)}</td>
        <td style={td}>{percent(row.overallFullPercent)}</td>
        <td style={td}>{percent(row.channelFullPartialPercent)}</td>
        <td style={td}>{percent(row.insideFullPartialPercent)}</td>
        <td style={td}>{percent(row.overallFullPartialPercent)}</td>
      </tr>
    );
  }

  return (
    <div style={styles.tableWrap}>
      <table style={{ ...styles.table, minWidth: '1350px' }}>
        <thead>
          <tr>
            <th style={styles.groupedTh} rowSpan={2}>Programme Name</th>
            <th style={styles.groupedTh} colSpan={3}>B11 Learner Count</th>
            <th style={styles.groupedTh} rowSpan={2}>Target %</th>
            <th style={styles.groupedTh} colSpan={3}>Full Submission</th>
            <th style={styles.groupedTh} colSpan={3}>Full + Partial Submission</th>
          </tr>
          <tr>
            <th style={styles.subTh}>Channel</th>
            <th style={styles.subTh}>Inside</th>
            <th style={styles.subTh}>Total Learners</th>
            <th style={styles.subTh}>Channel %</th>
            <th style={styles.subTh}>Inside %</th>
            <th style={styles.subTh}>Overall Full %</th>
            <th style={styles.subTh}>Channel %</th>
            <th style={styles.subTh}>Inside %</th>
            <th style={styles.subTh}>Overall Full + Partial %</th>
          </tr>
        </thead>
        <tbody>
          {regularRows.map(renderRow)}
          {grandTotal && renderRow(grandTotal)}
        </tbody>
      </table>
    </div>
  );
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

  const kpis = data?.kpis || initialKpis;
  const pendingLearners = data?.pendingLearners || [];
  const mentorProgramSummary = prepareMentorProgramSummary(
    data?.mentorProgramSummary || []
  );
  const mentorSalesSummary = data?.mentorSalesSummary || [];
  const programmeSummary = data?.programSummary || [];
  const statusItems = data?.statusSummary || [];
  const programmeSubmissionTable = data?.programmeSubmissionTable || [];

  const comparisonMap = {};
  (data?.yesterdayComparison?.byProgram || []).forEach(row => {
    comparisonMap[`${row.program}||${row.salesType}`] = row;
  });

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
            <div style={{ marginTop: 9 }}>
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
              gap: 12,
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
                {(data?.filters?.programs || []).map(value => (
                  <option key={value} value={value}>{value}</option>
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
                {(data?.filters?.salesTypes || []).map(value => (
                  <option key={value} value={value}>{value}</option>
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
                {(data?.filters?.mentors || []).map(value => (
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

        <section style={styles.grid}>
          {[
            ['Total Learners', number(kpis.totalLearners)],
            ['Fully Submitted', number(kpis.fullySubmitted)],
            ['Partial Submission', number(kpis.partiallySubmitted)],
            ['Nil Submission', number(kpis.nilSubmission)],
            ['Full Submission Rate', percent(kpis.fullPercent)],
            ['Full + Partial Rate', percent(kpis.fullPartialPercent)],
            ['Pending Subjects', number(kpis.pendingSubjectCount)]
          ].map(([label, value]) => (
            <div key={label} style={styles.kpi}>
              <div style={styles.kpiLabel}>{label}</div>
              <div style={styles.kpiValue}>{loading ? '—' : value}</div>
            </div>
          ))}
        </section>

        {/* NEW TABLE: added without replacing the existing dashboard tables. */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            Programme-wise IA Submission Summary — B11
          </h2>
          <p style={styles.muted}>
            Channel and Inside learner counts, programme targets, Full
            submission rates, and Full + Partial submission rates.
          </p>
          <ProgrammeSubmissionTable rows={programmeSubmissionTable} />
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Programme-wise Submission Summary</h2>
          <p style={styles.muted}>
            Full % = fully submitted learners divided by total learners.
            Full + Partial % = learners who submitted at least one subject
            divided by total learners. Daily changes are shown in percentage
            points.
          </p>

          {!programmeSummary.length ? (
            <p style={styles.muted}>No programme summary available.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'Programme', 'Sales Type', 'Total Learners', 'Target',
                      'Full', 'Partial', 'Nil', 'Full %', 'Full + Partial %',
                      'Change in Full %', 'Change in Full + Partial %'
                    ].map(heading => (
                      <th key={heading} style={styles.th}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {programmeSummary.map((row, index) => {
                    const comparison =
                      comparisonMap[`${row.program}||${row.salesType}`];

                    return (
                      <tr key={`${row.program}-${row.salesType}-${index}`}>
                        <td style={styles.td}>{row.program}</td>
                        <td style={styles.td}>{row.salesType}</td>
                        <td style={styles.td}>{number(row.totalLearners)}</td>
                        <td style={styles.td}>
                          {row.target == null
                            ? 'Not set'
                            : percent(row.target)}
                        </td>
                        <td style={styles.td}>{number(row.full)}</td>
                        <td style={styles.td}>{number(row.partial)}</td>
                        <td style={styles.td}>{number(row.nil)}</td>
                        <td style={styles.td}>{percent(row.fullPercent)}</td>
                        <td style={styles.td}>{percent(row.fullPartialPercent)}</td>
                        <td style={styles.td}>
                          {changePercent(comparison?.fullPercentChange)}
                        </td>
                        <td style={styles.td}>
                          {changePercent(comparison?.fullPartialPercentChange)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ ...styles.muted, marginTop: 10 }}>
            Snapshot status: {data?.snapshotInfo?.message || 'Status unavailable'}.
            The first snapshot establishes the baseline. Comparisons become
            available after a later day&apos;s snapshot is saved.
          </p>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Submission Status</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {statusItems.map(item => {
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
                    <strong>
                      {number(item.count)} ({percent(item.percentage)})
                    </strong>
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
            Every programme returned for each mentor is shown in a separate row.
          </p>

          {!mentorProgramSummary.length ? (
            <p style={styles.muted}>No mentor-program data available.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'Mentor', 'Program', 'Total Learners',
                      'Full', 'Partial', 'Nil', 'Full %', 'Full + Partial %'
                    ].map(heading => (
                      <th key={heading} style={styles.th}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mentorProgramSummary.map((row, index) => (
                    <tr key={`${row.mentor}-${row.program}-${index}`}>
                      <td style={styles.td}>{textValue(row.mentor)}</td>
                      <td style={styles.td}>{textValue(row.program)}</td>
                      <td style={styles.td}>{number(row.totalLearners)}</td>
                      <td style={styles.td}>{number(row.full)}</td>
                      <td style={styles.td}>{number(row.partial)}</td>
                      <td style={styles.td}>{number(row.nil)}</td>
                      <td style={styles.td}>{percent(row.fullPercent)}</td>
                      <td style={styles.td}>{percent(row.fullPartialPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Sales Type Summary</h2>
          <p style={styles.muted}>One row per mentor and sales type.</p>

          {!mentorSalesSummary.length ? (
            <p style={styles.muted}>No data available.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'Mentor', 'Sales Type', 'Total Learners',
                      'Full', 'Partial', 'Nil', 'Full %', 'Full + Partial %'
                    ].map(heading => (
                      <th key={heading} style={styles.th}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mentorSalesSummary.map((row, index) => (
                    <tr key={`${row.mentor}-${row.salesType}-${index}`}>
                      <td style={styles.td}>{textValue(row.mentor)}</td>
                      <td style={styles.td}>{textValue(row.salesType)}</td>
                      <td style={styles.td}>{number(row.totalLearners)}</td>
                      <td style={styles.td}>{number(row.full)}</td>
                      <td style={styles.td}>{number(row.partial)}</td>
                      <td style={styles.td}>{number(row.nil)}</td>
                      <td style={styles.td}>{percent(row.fullPercent)}</td>
                      <td style={styles.td}>{percent(row.fullPartialPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
              Learners with Pending Subjects
            </h2>
            <button
              style={styles.primaryButton}
              disabled={!pendingLearners.length || loading}
              onClick={() => downloadCsv(pendingLearners)}
            >
              Download Pending Subjects (CSV)
            </button>
          </div>

          <p style={{ ...styles.muted, marginTop: 10 }}>
            The CSV contains roll number, programme, mentor, pending subject
            count and pending course codes.
          </p>
          {pendingLearners.length > 0 && (
            <p style={styles.muted}>
              Learners with pending subjects: {number(pendingLearners.length)}
            </p>
          )}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Program-wise Summary</h2>
          <SummaryTable
            rows={(data?.programSummary || []).map(row => ({
              ...row,
              name: row.program
            }))}
            firstColumn="Program"
            columns={[
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'full', label: 'Full' },
              { key: 'partial', label: 'Partial' },
              { key: 'nil', label: 'Nil' },
              { key: 'fullPercent', label: 'Full %', format: percent },
              {
                key: 'fullPartialPercent',
                label: 'Full + Partial %',
                format: percent
              }
            ]}
          />
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Sales Type Summary</h2>
          <SummaryTable
            rows={(data?.salesSummary || []).map(row => ({
              ...row,
              name: row.name
            }))}
            firstColumn="Sales Type"
            columns={[
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'full', label: 'Full' },
              { key: 'partial', label: 'Partial' },
              { key: 'nil', label: 'Nil' }
            ]}
          />
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Mentor-wise Summary</h2>
          <SummaryTable
            rows={(data?.mentorSummary || []).map(row => ({
              ...row,
              name: row.name
            }))}
            firstColumn="Mentor"
            columns={[
              { key: 'totalLearners', label: 'Total Learners' },
              { key: 'full', label: 'Full' },
              { key: 'partial', label: 'Partial' },
              { key: 'nil', label: 'Nil' }
            ]}
          />
        </section>

        <footer style={{ ...styles.muted, textAlign: 'center', padding: 5 }}>
          IA Submission Dashboard
        </footer>
      </div>
    </main>
  );
}
