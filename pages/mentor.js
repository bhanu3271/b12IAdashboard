
import { useCallback, useEffect, useState } from "react";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  container: { maxWidth: "1500px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "22px",
  },
  heading: { margin: 0, fontSize: "25px", fontWeight: 700 },
  subtitle: { color: "#64748b", fontSize: "13px", marginTop: "6px" },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: 0,
    borderRadius: "7px",
    padding: "10px 17px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  filterPanel: {
    background: "#fff",
    borderRadius: "10px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
  },
  filterLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "7px",
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #dbe1ea",
    borderRadius: "6px",
    background: "#fff",
    fontSize: "13px",
    color: "#172033",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "14px",
    marginBottom: "14px",
  },
  kpiCard: {
    background: "#fff",
    padding: "17px",
    borderRadius: "10px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
  },
  kpiLabel: { color: "#64748b", fontSize: "12px", marginBottom: "9px" },
  kpiValue: { fontSize: "25px", fontWeight: 700, color: "#172033" },
  kpiActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "22px",
  },
  section: {
    background: "#fff",
    borderRadius: "10px",
    padding: "17px",
    marginBottom: "20px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
  },
  sectionTitle: { fontSize: "16px", fontWeight: 700, margin: "0 0 14px" },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px", whiteSpace: "nowrap" },
  th: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "11px 12px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 700,
  },
  td: { padding: "10px 12px", borderBottom: "1px solid #edf0f5", color: "#334155" },
  message: {
    background: "#fff",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    fontSize: "13px",
  },
};

function number(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, "").replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function getField(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function percentage(value, total) {
  return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

function TableSection({ title, rows = [], columns = [] }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.label} style={styles.th}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ ...styles.td, textAlign: "center", padding: "20px" }}>
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => {
                    const value = column.render
                      ? column.render(row)
                      : getField(row, ...(column.keys || []));
                    return (
                      <td key={column.label} style={styles.td}>
                        {value === "" || value === null || value === undefined ? "-" : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MentorDashboard() {
  const [data, setData] = useState(null);
  const [program, setProgram] = useState("");
  const [salesType, setSalesType] = useState("");
  const [mentor, setMentor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (program) params.set("program", program);
      if (salesType) params.set("salesType", salesType);
      if (mentor) params.set("mentor", mentor);

      params.set("_refresh", Date.now().toString());

      const response = await fetch(`/api/dashboard?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setData(result);
      setLastUpdated(new Date().toLocaleString("en-IN"));
    } catch (err) {
      console.error("Mentor dashboard error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [program, salesType, mentor]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const clearFilters = () => {
    setProgram("");
    setSalesType("");
    setMentor("");
  };

  const filters = data?.filters || {};
  const programs = Array.isArray(filters.programs) ? filters.programs : [];
  const salesTypes = Array.isArray(filters.salesTypes) ? filters.salesTypes : [];
  const mentors = Array.isArray(filters.mentors) ? filters.mentors : [];

  const kpis = data?.kpis || {};

  const totalLearners = number(getField(kpis, "totalLearners", "total"));
  const fullySubmitted = number(
    getField(kpis, "fullySubmitted", "fullSubmission", "full")
  );
  const partiallySubmitted = number(
    getField(kpis, "partiallySubmitted", "partialSubmission", "partial")
  );
  const nilSubmission = number(
    getField(kpis, "nilSubmission", "notSubmitted", "nil")
  );

  // Calculate full submission rate directly from the KPI values.
  const fullSubmissionRate =
    totalLearners > 0
      ? ((fullySubmitted / totalLearners) * 100).toFixed(1)
      : "0.0";

  const averageSubmission = getField(
    kpis,
    "averageSubmission",
    "averageSubmissionPercentage",
    "average"
  );

  // Download only the KPI data. Tables are not included.
  const downloadKpiCsv = () => {
    const csvRows = [
      ["KPI", "Value"],
      ["Total Learners", totalLearners],
      ["Fully Submitted Learners", fullySubmitted],
      ["Partially Submitted Learners", partiallySubmitted],
      ["Nil Submitted Learners", nilSubmission],
      ["Average Submission", String(averageSubmission || "0")],
      ["Full Submission Rate", `${fullSubmissionRate}%`],
    ];

    const csvContent = csvRows
      .map((row) =>
        row.map((value) => {
          const safeValue = String(value ?? "").replace(/"/g, '""');
          return `"${safeValue}"`;
        }).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Mentor_Dashboard_KPI_Summary.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusRows = (data?.statusSummary || []).map((row) => {
    const count = number(getField(row, "count", "totalLearners"));
    const suppliedPercentage = getField(row, "percentage", "percent", "submissionPercentage");

    return {
      ...row,
      displayCount: count,
      displayPercentage:
        suppliedPercentage !== ""
          ? `${number(suppliedPercentage)}%`
          : percentage(count, totalLearners),
    };
  });

  const mentorProgramRows = data?.mentorProgramSummary || [];
  const mentorSalesRows = data?.mentorSalesSummary || [];
  const mentorRows = data?.mentorSummary || [];

  const commonColumns = [
    {
      label: "Total Learners",
      render: (row) => formatNumber(getField(row, "totalLearners", "total", "count")),
    },
    {
      label: "Full",
      render: (row) => formatNumber(getField(row, "full", "fullySubmitted", "fullSubmission")),
    },
    {
      label: "Partial",
      render: (row) => formatNumber(getField(row, "partial", "partiallySubmitted", "partialSubmission")),
    },
    {
      label: "Nil",
      render: (row) => formatNumber(getField(row, "nil", "nilSubmission", "notSubmitted")),
    },
  ];

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Mentor Dashboard</h1>
            <div style={styles.subtitle}>IA Submission Performance</div>
          </div>

          <button style={styles.button} onClick={fetchDashboard} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        <div style={styles.filterPanel}>
          <div>
            <label style={styles.filterLabel}>Program</label>
            <select style={styles.select} value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="">All Programs</option>
              {programs.map((item, index) => <option key={index} value={item}>{item}</option>)}
            </select>
          </div>

          <div>
            <label style={styles.filterLabel}>Sales Type</label>
            <select style={styles.select} value={salesType} onChange={(e) => setSalesType(e.target.value)}>
              <option value="">All Sales Types</option>
              {salesTypes.map((item, index) => <option key={index} value={item}>{item}</option>)}
            </select>
          </div>

          <div>
            <label style={styles.filterLabel}>Mentor</label>
            <select style={styles.select} value={mentor} onChange={(e) => setMentor(e.target.value)}>
              <option value="">All Mentors</option>
              {mentors.map((item, index) => <option key={index} value={item}>{item}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "end" }}>
            <button
              style={{ ...styles.button, background: "#64748b", width: "100%" }}
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error && (
          <div style={{ ...styles.message, color: "#b91c1c", background: "#fef2f2" }}>
            {error}
          </div>
        )}

        {loading && !data && <div style={styles.message}>Loading dashboard data...</div>}

        {data && (
          <>
            <div style={styles.kpiGrid}>
              {[
                ["Total Learners", formatNumber(totalLearners)],
                ["Fully Submitted", formatNumber(fullySubmitted)],
                ["Partial Submission", formatNumber(partiallySubmitted)],
                ["Nil Submission", formatNumber(nilSubmission)],
                [
                  "Average Submission",
                  typeof averageSubmission === "string" && averageSubmission.includes("%")
                    ? averageSubmission
                    : `${number(averageSubmission).toFixed(1)}%`,
                ],
                ["Full Submission Rate", `${fullSubmissionRate}%`],
              ].map(([label, value]) => (
                <div key={label} style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>{label}</div>
                  <div style={styles.kpiValue}>{value}</div>
                </div>
              ))}
            </div>

            <div style={styles.kpiActions}>
              <button style={styles.button} onClick={downloadKpiCsv}>
                Download KPI CSV
              </button>
            </div>

            <TableSection
              title="Submission Status"
              rows={statusRows}
              columns={[
                { label: "Submission Status", keys: ["status", "submissionStatus", "name"] },
                { label: "Total Learners", render: (row) => formatNumber(row.displayCount) },
                { label: "Percentage", render: (row) => row.displayPercentage },
              ]}
            />

            <TableSection
              title="Mentor-wise Program Summary"
              rows={mentorProgramRows}
              columns={[
                { label: "Mentor", keys: ["mentor", "mentorName", "name"] },
                { label: "Program", keys: ["program", "programName", "academicProgram"] },
                ...commonColumns,
              ]}
            />

            <TableSection
              title="Mentor-wise Sales Type Summary"
              rows={mentorSalesRows}
              columns={[
                { label: "Mentor", keys: ["mentor", "mentorName", "name"] },
                { label: "Sales Type", keys: ["salesType", "sales_type", "Sales Type"] },
                ...commonColumns,
              ]}
            />

            <TableSection
              title="Mentor-wise Summary"
              rows={mentorRows}
              columns={[
                { label: "Mentor", keys: ["mentor", "mentorName", "name"] },
                ...commonColumns,
              ]}
            />

            <div style={{ textAlign: "right", color: "#64748b", fontSize: "11px", padding: "4px 2px 14px" }}>
              Last successful update: {lastUpdated}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
