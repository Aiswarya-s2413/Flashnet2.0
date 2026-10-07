import { useState, useEffect, useMemo } from "react";
import API from "../api";
import StatLoader from "../components/StatLoader";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  Users,
  Award,
  TrendingUp,
  Package,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  Filter,
  DollarSign,
  Briefcase,
  Loader2,
  FileSpreadsheet,
  Layers,
  Building,
} from "lucide-react";
import { useSortableData, SortHeader } from "../components/SortableTable";
import Pagination from "../components/Pagination";

const ROWS_PER_PAGE = 20;

// Clean Custom Tooltip
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "12px 16px",
          borderRadius: "12px",
          boxShadow: "var(--shadow-lg)",
          minWidth: 160,
        }}
      >
        {label && (
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "12px",
              color: "var(--text-dim)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </p>
        )}
        {payload.map((pld, idx) => {
          const isAsp =
            pld.name === "ASP" || pld.name?.toLowerCase().includes("asp") || pld.name?.toLowerCase().includes("selling price");
          const isVol =
            pld.name === "Volume" || pld.name?.toLowerCase().includes("volume");
          let formatted = "";
          let prefix = "₹";
          let suffix = "";

          if (isVol) {
            prefix = "";
            suffix = " KG";
            formatted = new Intl.NumberFormat("en-IN", {
              maximumFractionDigits: 0,
            }).format(pld.value);
          } else if (isAsp) {
            suffix = " / KG";
            formatted = new Intl.NumberFormat("en-IN", {
              maximumFractionDigits: 2,
            }).format(pld.value);
          } else {
            if (pld.value >= 10000000) {
              formatted = `${(pld.value / 10000000).toFixed(2)} Cr`;
            } else if (pld.value >= 100000) {
              formatted = `${(pld.value / 100000).toFixed(2)} L`;
            } else {
              formatted = new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 0,
              }).format(pld.value);
            }
          }

          return (
            <p
              key={idx}
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                fontWeight: 700,
                color: pld.color || "var(--primary)",
              }}
            >
              {pld.name}:{" "}
              <span style={{ color: "var(--text)" }}>
                {prefix}
                {formatted}
                {suffix}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function SalesExecAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mappings"); // "mappings", "reps", "managers", "leaders"
  const [selectedLeader, setSelectedLeader] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [selectedRep, setSelectedRep] = useState("all");
  const [selectedClassification, setSelectedClassification] = useState("all");
  const [selectedDistDirect, setSelectedDistDirect] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedDistributor, setSelectedDistributor] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExec, setSelectedExec] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMonth && selectedMonth !== "all")
        params.month = selectedMonth;
      if (selectedDivision && selectedDivision !== "all")
        params.division = selectedDivision;
      if (selectedDistributor && selectedDistributor !== "all") {
        params.distributor = selectedDistributor;
      } else {
        params.distributor = "ALL";
      }
      const res = await API.get("/analytics/sales-exec/", { params });
      setData(res.data);
      if (selectedExec && res.data?.executives) {
        const updated = res.data.executives.find(
          (e) => e.name === selectedExec.name,
        );
        if (updated) setSelectedExec(updated);
      }
    } catch (e) {
      console.error("Failed to fetch sales exec analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedDivision, selectedDistributor]);

  const formatLakhs = (val) => {
    if (!val) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  const formatQty = (val) => {
    if (!val) return "0 KG";
    if (val >= 1000) return `${(val / 1000).toFixed(1)} MT`;
    return `${Math.round(val).toLocaleString("en-IN")} KG`;
  };

  // Filtered Mappings (All 307 Accounts from File)
  const filteredMappings = useMemo(() => {
    if (!data?.mappings) return [];
    let list = data.mappings;
    if (selectedLeader !== "all") {
      list = list.filter((m) => m.sales_leader === selectedLeader);
    }
    if (selectedManager !== "all") {
      list = list.filter((m) => m.regional_manager === selectedManager);
    }
    if (selectedRep !== "all") {
      list = list.filter((m) => m.sales_rep === selectedRep);
    }
    if (selectedClassification !== "all") {
      list = list.filter((m) => m.classification === selectedClassification);
    }
    if (selectedDistDirect !== "all") {
      list = list.filter((m) => m.dist_direct === selectedDistDirect);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.sales_leader?.toLowerCase().includes(q) ||
          m.regional_manager?.toLowerCase().includes(q) ||
          m.sales_rep?.toLowerCase().includes(q) ||
          m.ship_to_party?.toLowerCase().includes(q) ||
          m.ship_to?.toLowerCase().includes(q) ||
          m.group_name?.toLowerCase().includes(q) ||
          m.key_account?.toLowerCase().includes(q) ||
          m.classification?.toLowerCase().includes(q) ||
          m.dist_direct?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [
    data?.mappings,
    selectedLeader,
    selectedManager,
    selectedRep,
    selectedClassification,
    selectedDistDirect,
    searchQuery,
  ]);

  // Filtered Representatives
  const filteredReps = useMemo(() => {
    if (!data?.by_sales_rep) return [];
    let list = data.by_sales_rep;
    if (selectedLeader !== "all") {
      list = list.filter((r) => r.sales_leader === selectedLeader);
    }
    if (selectedManager !== "all") {
      list = list.filter((r) => r.regional_manager === selectedManager);
    }
    if (selectedRep !== "all") {
      list = list.filter((r) => r.name === selectedRep);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.sales_leader?.toLowerCase().includes(q) ||
          r.regional_manager?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data?.by_sales_rep, selectedLeader, selectedManager, selectedRep, searchQuery]);

  // Filtered Managers
  const filteredManagers = useMemo(() => {
    if (!data?.by_regional_manager) return [];
    let list = data.by_regional_manager;
    if (selectedLeader !== "all") {
      list = list.filter((m) => m.sales_leader === selectedLeader);
    }
    if (selectedManager !== "all") {
      list = list.filter((m) => m.name === selectedManager);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.sales_leader?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data?.by_regional_manager, selectedLeader, selectedManager, searchQuery]);

  // Filtered Leaders
  const filteredLeaders = useMemo(() => {
    if (!data?.by_sales_leader) return [];
    let list = data.by_sales_leader;
    if (selectedLeader !== "all") {
      list = list.filter((l) => l.name === selectedLeader);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((l) => l.name?.toLowerCase().includes(q));
    }
    return list;
  }, [data?.by_sales_leader, selectedLeader, searchQuery]);

  // Active dataset for current tab
  const activeList = useMemo(() => {
    if (activeTab === "mappings") return filteredMappings;
    if (activeTab === "reps") return filteredReps;
    if (activeTab === "managers") return filteredManagers;
    if (activeTab === "leaders") return filteredLeaders;
    return [];
  }, [activeTab, filteredMappings, filteredReps, filteredManagers, filteredLeaders]);

  const { sorted, sortKey, sortDir, requestSort } = useSortableData(
    activeList,
    { key: "revenue", direction: "desc" },
  );

  const kpis = data?.kpis || {};

  // Chart data according to active tab
  const chartData = useMemo(() => {
    if (activeTab === "leaders") {
      return (data?.by_sales_leader || []).slice(0, 15).map((d) => ({
        name: d.name,
        Revenue: d.revenue,
      }));
    }
    if (activeTab === "managers") {
      return (data?.by_regional_manager || []).slice(0, 15).map((d) => ({
        name: d.name,
        Revenue: d.revenue,
      }));
    }
    return (data?.by_sales_rep || []).slice(0, 15).map((d) => ({
      name: d.name,
      Revenue: d.revenue,
    }));
  }, [activeTab, data]);

  const chartTitle =
    activeTab === "leaders"
      ? "Top Sales Leaders by Revenue"
      : activeTab === "managers"
      ? "Top Regional Managers by Revenue"
      : "Top Sales Representatives by Revenue";

  return (
    <div style={{ paddingBottom: 40, width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
      {/* Page Title & Refresh */}
      <div
        className="page-header"
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            className="page-title"
            style={{ margin: 0, fontSize: 24, fontWeight: 800 }}
          >
            Sales Executive Performance Analysis
          </h1>
          <p
            style={{
              color: "var(--text-dim)",
              margin: "4px 0 0 0",
              fontSize: 13.5,
            }}
          >
            Representative revenue benchmarking, volume trends, average selling
            prices, and territory accounts.
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchData}
          disabled={loading}
          style={{
            fontSize: 13,
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing…" : "Refresh Data"}
        </button>
      </div>

      {/* Structured Top KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 24,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Card 1: Total Revenue */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid #2F7A60",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-dim)",
              }}
            >
              Total Primary Revenue
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: "rgba(47, 122, 96, 0.1)",
                color: "#2F7A60",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#2F7A60",
                lineHeight: 1.1,
                marginBottom: 6,
              }}
            >
              {loading ? <StatLoader color="#2F7A60" /> : formatLakhs(kpis.total_revenue || 0)}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
              {loading
                ? <StatLoader sub />
                : `${(kpis.total_transactions || 0).toLocaleString("en-IN")} billing records`}
            </div>
          </div>
        </div>

        {/* Card 2: Total Volume */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid #3D6A8A",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-dim)",
              }}
            >
              Total Volume Sold
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: "rgba(61, 106, 138, 0.1)",
                color: "#3D6A8A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={18} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#3D6A8A",
                lineHeight: 1.1,
              }}
            >
              {loading ? <StatLoader color="#3D6A8A" /> : formatQty(kpis.total_volume || 0)}
            </div>
          </div>
        </div>

        {/* Card 3: Team Hierarchy */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid #C07D38",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-dim)",
              }}
            >
              Team Hierarchy
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: "rgba(192, 125, 56, 0.1)",
                color: "#C07D38",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: "#C07D38",
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              {loading ? <StatLoader color="#C07D38" /> : `${kpis.total_leaders || 13} Leaders • ${kpis.total_managers || 22} Managers`}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
              {loading ? <StatLoader sub /> : `${kpis.total_representatives || 38} Sales Representatives`}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Chart according to Active Tab */}
      <div
        className="card"
        style={{
          padding: "24px 28px",
          height: 420,
          marginBottom: 28,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 800,
                color: "var(--text)",
              }}
            >
              {chartTitle}
            </h3>
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: 13,
                margin: "4px 0 0 0",
              }}
            >
              Primary Sales Revenue comparison across top performers
            </p>
          </div>
          <span
            className="badge badge-accent"
            style={{ fontSize: 12, padding: "4px 10px" }}
          >
            Top 15 Ranking
          </span>
        </div>

        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="82%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 45, left: 10 }}
            >
              <defs>
                <linearGradient
                  id="execRevenueGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0B3B2C" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0B3B2C" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-dim)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={55}
              />
              <YAxis
                tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                tick={{ fill: "var(--text-dim)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomChartTooltip />}
                cursor={{ fill: "var(--bg)", opacity: 0.5 }}
              />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
              <Bar
                name="Revenue"
                dataKey="Revenue"
                fill="url(#execRevenueGrad)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "var(--text-dim)",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: "var(--primary)" }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Loading Chart…
                </span>
              </div>
            ) : (
              "No performance data found for current filters."
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 8,
          overflowX: "auto",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <button
          className={`btn ${activeTab === "mappings" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setActiveTab("mappings");
            setCurrentPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <FileSpreadsheet size={15} />
          All Accounts Mapping ({filteredMappings.length})
        </button>
        <button
          className={`btn ${activeTab === "reps" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setActiveTab("reps");
            setCurrentPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Users size={15} />
          By Sales Representative ({filteredReps.length})
        </button>
        <button
          className={`btn ${activeTab === "managers" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setActiveTab("managers");
            setCurrentPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Building size={15} />
          By Regional Manager ({filteredManagers.length})
        </button>
        <button
          className={`btn ${activeTab === "leaders" ? "btn-primary" : "btn-outline"}`}
          onClick={() => {
            setActiveTab("leaders");
            setCurrentPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Layers size={15} />
          By Sales Leader ({filteredLeaders.length})
        </button>
      </div>

      {/* Clean Filters Toolbar (Sticky above Table) */}
      <div
        className="card"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          padding: "16px 22px",
          marginBottom: 20,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.06)",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {/* Row 1: Search Field + Reset Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            width: "100%",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
              }}
            />
            <input
              type="text"
              placeholder="Search account, code, rep, manager, leader..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                paddingLeft: 38,
                paddingRight: 14,
                paddingTop: 8,
                paddingBottom: 8,
                width: "100%",
                height: 38,
                fontSize: 13,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            />
          </div>
          {(selectedLeader !== "all" ||
            selectedManager !== "all" ||
            selectedRep !== "all" ||
            selectedClassification !== "all" ||
            selectedDistDirect !== "all" ||
            selectedMonth !== "all" ||
            searchQuery) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedLeader("all");
                setSelectedManager("all");
                setSelectedRep("all");
                setSelectedClassification("all");
                setSelectedDistDirect("all");
                setSelectedMonth("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              style={{
                height: 38,
                padding: "0 16px",
                fontSize: 12.5,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Row 2: Dropdowns Grid / Flex */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          {/* Sales Leader */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px", minWidth: 130 }}>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Leader
            </label>
            <select
              value={selectedLeader}
              onChange={(e) => {
                setSelectedLeader(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 10px",
                height: 36,
                fontSize: 12.5,
                lineHeight: "1.4",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All Leaders ({data?.available_leaders?.length || 0})</option>
              {(data?.available_leaders || []).map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Regional Manager */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px", minWidth: 130 }}>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Manager
            </label>
            <select
              value={selectedManager}
              onChange={(e) => {
                setSelectedManager(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 10px",
                height: 36,
                fontSize: 12.5,
                lineHeight: "1.4",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All Managers ({data?.available_managers?.length || 0})</option>
              {(data?.available_managers || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Rep */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px", minWidth: 130 }}>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Sales Rep
            </label>
            <select
              value={selectedRep}
              onChange={(e) => {
                setSelectedRep(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 10px",
                height: 36,
                fontSize: 12.5,
                lineHeight: "1.4",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All Reps ({data?.available_reps?.length || 0})</option>
              {(data?.available_reps || []).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Classification */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 130px", minWidth: 110 }}>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Classification
            </label>
            <select
              value={selectedClassification}
              onChange={(e) => {
                setSelectedClassification(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 10px",
                height: 36,
                fontSize: 12.5,
                lineHeight: "1.4",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All Classes</option>
              {(data?.available_classifications || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Dist / Direct */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 130px", minWidth: 110 }}>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Channel
            </label>
            <select
              value={selectedDistDirect}
              onChange={(e) => {
                setSelectedDistDirect(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 10px",
                height: 36,
                fontSize: 12.5,
                lineHeight: "1.4",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All Channels</option>
              {(data?.available_dist_direct || ["Direct", "Distributor"]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 120px", minWidth: 110 }}>
            <label
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "6px 10px",
                height: 36,
                fontSize: 12.5,
                lineHeight: "1.4",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All Months</option>
              {(data?.available_months || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          marginBottom: 32,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
              {activeTab === "mappings" && `Account Master Mapping Data (${filteredMappings.length})`}
              {activeTab === "reps" && `Sales Representatives Performance (${filteredReps.length})`}
              {activeTab === "managers" && `Regional Managers Performance (${filteredManagers.length})`}
              {activeTab === "leaders" && `Sales Leaders Performance (${filteredLeaders.length})`}
            </h3>
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: 13,
                margin: "4px 0 0 0",
              }}
            >
              {activeTab === "mappings" && "Complete 10-column mapping from shared master file with live primary sales revenue, volume, ASP and invoices."}
              {activeTab === "reps" && "Performance aggregated by New Sales Representative with mapped accounts and hierarchy."}
              {activeTab === "managers" && "Performance aggregated by New Regional Manager with team size and mapped accounts."}
              {activeTab === "leaders" && "Performance aggregated by New Sales Leader across regional managers and territories."}
            </p>
          </div>
          <span
            style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 600 }}
          >
            Page {currentPage} of{" "}
            {Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE))}
          </span>
        </div>

        <div
          className="table-wrapper"
          style={{
            width: "100%",
            maxWidth: "100%",
            overflowX: "auto",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          {/* TAB 1: ALL ACCOUNTS MAPPING (Complete 10 columns from Excel file + Sales Metrics) */}
          {activeTab === "mappings" && (
            <table className="data-table" style={{ width: "100%", minWidth: 980, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: "center" }}>#</th>
                  <SortHeader label="Ship-To" sortKey="ship_to" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Ship to Party" sortKey="ship_to_party" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="New Sales Leader" sortKey="sales_leader" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="New Regional Manager" sortKey="regional_manager" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="New Sales Rep." sortKey="sales_rep" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Classification" sortKey="classification" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Dist / Direct" sortKey="dist_direct" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Group Name" sortKey="group_name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Key Account" sortKey="key_account" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Status" sortKey="active_status" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Primary Revenue" sortKey="revenue" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Volume" sortKey="volume" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="ASP (₹/KG)" sortKey="asp" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Invoices" sortKey="invoices" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Loading Mapping Data…</span>
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ textAlign: "center", padding: 50, color: "var(--text-dim)" }}>
                      No account mappings match the selected filters.
                    </td>
                  </tr>
                ) : (
                  sorted
                    .slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
                    .map((item, idx) => (
                      <tr key={item.id || idx} style={{ transition: "background 0.15s ease" }}>
                        <td style={{ textAlign: "center", color: "var(--text-dim)", fontSize: 12 }}>
                          {(currentPage - 1) * ROWS_PER_PAGE + idx + 1}
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>
                          {item.ship_to || "—"}
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--text)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.ship_to_party}>
                          {item.ship_to_party}
                        </td>
                        <td style={{ color: "var(--text)", fontWeight: 600 }}>
                          {item.sales_leader || "—"}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {item.regional_manager || "—"}
                        </td>
                        <td style={{ color: "var(--primary)", fontWeight: 600 }}>
                          {item.sales_rep || "—"}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.classification === "Core" ? "rgba(47, 122, 96, 0.1)" : "var(--bg)",
                              color: item.classification === "Core" ? "#2F7A60" : "var(--text)",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            {item.classification || "General"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.dist_direct === "Direct" ? "rgba(61, 106, 138, 0.1)" : "rgba(192, 125, 56, 0.1)",
                              color: item.dist_direct === "Direct" ? "#3D6A8A" : "#C07D38",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            {item.dist_direct || "Distributor"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-dim)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.group_name}>
                          {item.group_name || "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          {item.key_account || "—"}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.active_status === "Active" ? "rgba(47, 122, 96, 0.15)" : "rgba(0,0,0,0.06)",
                              color: item.active_status === "Active" ? "#2F7A60" : "var(--text-dim)",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            {item.active_status || "Active"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: item.revenue > 0 ? "var(--primary)" : "var(--text-dim)" }}>
                          {formatLakhs(item.revenue)}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {formatQty(item.volume)}
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                          {item.asp > 0 ? `₹${item.asp.toFixed(2)}` : "—"}
                        </td>
                        <td style={{ color: "var(--text-muted)", textAlign: "center" }}>
                          {item.invoices ? item.invoices.toLocaleString("en-IN") : 0}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: BY SALES REPRESENTATIVE */}
          {activeTab === "reps" && (
            <table className="data-table" style={{ width: "100%", minWidth: 800, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 65, textAlign: "center" }}>Rank</th>
                  <SortHeader label="Sales Representative" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Regional Manager" sortKey="regional_manager" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Sales Leader" sortKey="sales_leader" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Mapped Accounts" sortKey="accounts_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Primary Revenue" sortKey="revenue" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Total Volume" sortKey="volume" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="ASP (₹/KG)" sortKey="asp" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Invoices" sortKey="invoices" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <th style={{ width: 110, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Loading Representatives…</span>
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 50, color: "var(--text-dim)" }}>
                      No sales representatives match your search.
                    </td>
                  </tr>
                ) : (
                  sorted
                    .slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
                    .map((rep, idx) => {
                      const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                      const execDetails = data?.executives?.find((e) => e.name === rep.name);
                      return (
                        <tr
                          key={rep.name}
                          onClick={() => {
                            if (execDetails) setSelectedExec(execDetails);
                          }}
                          style={{
                            cursor: execDetails ? "pointer" : "default",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`badge ${rank === 1 ? "badge-gold" : rank === 2 ? "badge-silver" : rank === 3 ? "badge-bronze" : ""}`}
                              style={{ fontWeight: 800 }}
                            >
                              {rank}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  backgroundColor: "var(--accent-soft)",
                                  color: "var(--primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                {rep.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <span style={{ fontWeight: 700, color: "var(--text)" }}>
                                {rep.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {rep.regional_manager || "—"}
                          </td>
                          <td style={{ color: "var(--text)" }}>
                            {rep.sales_leader || "—"}
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: "var(--bg)", color: "var(--text)", fontWeight: 700 }}>
                              {rep.accounts_count} accounts
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--primary)" }}>
                            {formatLakhs(rep.revenue)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatQty(rep.volume)}
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                            ₹{rep.asp.toFixed(2)}
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {rep.invoices.toLocaleString("en-IN")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {execDetails && (
                              <button
                                className="btn btn-outline"
                                style={{ padding: "4px 10px", fontSize: 12 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExec(execDetails);
                                }}
                              >
                                Details <ChevronRight size={13} style={{ marginLeft: 2 }} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: BY REGIONAL MANAGER */}
          {activeTab === "managers" && (
            <table className="data-table" style={{ width: "100%", minWidth: 720, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 65, textAlign: "center" }}>Rank</th>
                  <SortHeader label="Regional Manager" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Sales Leader" sortKey="sales_leader" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Sales Reps" sortKey="reps_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Mapped Accounts" sortKey="accounts_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Primary Revenue" sortKey="revenue" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Total Volume" sortKey="volume" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="ASP (₹/KG)" sortKey="asp" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Invoices" sortKey="invoices" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Loading Regional Managers…</span>
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 50, color: "var(--text-dim)" }}>
                      No regional managers match your search.
                    </td>
                  </tr>
                ) : (
                  sorted
                    .slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
                    .map((mgr, idx) => {
                      const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                      return (
                        <tr key={mgr.name} style={{ transition: "background 0.15s ease" }}>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`badge ${rank === 1 ? "badge-gold" : rank === 2 ? "badge-silver" : rank === 3 ? "badge-bronze" : ""}`}
                              style={{ fontWeight: 800 }}
                            >
                              {rank}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: "var(--text)" }}>
                            {mgr.name}
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {mgr.sales_leader || "—"}
                          </td>
                          <td>
                            <span className="badge badge-accent" style={{ fontWeight: 700 }}>
                              {mgr.reps_count} Reps
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: "var(--bg)", color: "var(--text)", fontWeight: 700 }}>
                              {mgr.accounts_count} accounts
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--primary)" }}>
                            {formatLakhs(mgr.revenue)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatQty(mgr.volume)}
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                            ₹{mgr.asp.toFixed(2)}
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {mgr.invoices.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}

          {/* TAB 4: BY SALES LEADER */}
          {activeTab === "leaders" && (
            <table className="data-table" style={{ width: "100%", minWidth: 720, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 65, textAlign: "center" }}>Rank</th>
                  <SortHeader label="Sales Leader" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Regional Managers" sortKey="managers_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Sales Reps" sortKey="reps_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Mapped Accounts" sortKey="accounts_count" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Primary Revenue" sortKey="revenue" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Total Volume" sortKey="volume" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="ASP (₹/KG)" sortKey="asp" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                  <SortHeader label="Invoices" sortKey="invoices" currentSortKey={sortKey} currentSortDir={sortDir} onSort={requestSort} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Loading Sales Leaders…</span>
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 50, color: "var(--text-dim)" }}>
                      No sales leaders match your search.
                    </td>
                  </tr>
                ) : (
                  sorted
                    .slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
                    .map((leader, idx) => {
                      const rank = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                      return (
                        <tr key={leader.name} style={{ transition: "background 0.15s ease" }}>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`badge ${rank === 1 ? "badge-gold" : rank === 2 ? "badge-silver" : rank === 3 ? "badge-bronze" : ""}`}
                              style={{ fontWeight: 800 }}
                            >
                              {rank}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                            {leader.name}
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: "rgba(61, 106, 138, 0.1)", color: "#3D6A8A", fontWeight: 700 }}>
                              {leader.managers_count} Managers
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-accent" style={{ fontWeight: 700 }}>
                              {leader.reps_count} Reps
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: "var(--bg)", color: "var(--text)", fontWeight: 700 }}>
                              {leader.accounts_count} accounts
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--primary)" }}>
                            {formatLakhs(leader.revenue)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatQty(leader.volume)}
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                            ₹{leader.asp.toFixed(2)}
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {leader.invoices.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE))}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Selected Executive Deep-Dive Modal */}
      {selectedExec && (
        <div className="modal-overlay" onClick={() => setSelectedExec(null)}>
          <div
            className="modal"
            style={{
              maxWidth: "860px",
              width: "92%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-soft)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {selectedExec.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <h2
                      className="modal-title"
                      style={{ margin: 0, fontSize: 20 }}
                    >
                      {selectedExec.name}
                    </h2>
                    <span className="badge badge-accent">
                      Rank {selectedExec.rank}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: 13,
                      color: "var(--text-dim)",
                    }}
                  >
                    Primary Segment: {selectedExec.primary_division}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-outline"
                style={{ padding: "6px 8px", borderRadius: "50%" }}
                onClick={() => setSelectedExec(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Top Cards in Modal */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  padding: 14,
                  backgroundColor: "var(--bg)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Total Revenue
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--primary)",
                  }}
                >
                  {formatLakhs(selectedExec.total_revenue)}
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  backgroundColor: "var(--bg)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Total Volume
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {formatQty(selectedExec.total_volume)}
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  backgroundColor: "var(--bg)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Average Selling Price
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#C07D38",
                  }}
                >
                  ₹{selectedExec.asp.toFixed(2)}/KG
                </p>
              </div>
              <div
                style={{
                  padding: 14,
                  backgroundColor: "var(--bg)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Unique Accounts
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {selectedExec.unique_customers_count}
                </p>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            {selectedExec.monthly_trend &&
              selectedExec.monthly_trend.length > 0 && (
                <div
                  style={{
                    marginBottom: 28,
                    backgroundColor: "var(--bg)",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Month-on-Month Revenue & Volume Progression
                  </h4>
                  <div style={{ height: 220, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={selectedExec.monthly_trend}
                        margin={{ top: 5, right: 5, bottom: 5, left: -10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "var(--text-dim)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(val) =>
                            `₹${(val / 100000).toFixed(0)}L`
                          }
                          tick={{ fill: "var(--text-dim)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}T`}
                          tick={{ fill: "var(--text-dim)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar
                          yAxisId="left"
                          name="Revenue"
                          dataKey="revenue"
                          fill="#0B3B2C"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={24}
                        />
                        <Line
                          yAxisId="right"
                          name="Volume"
                          type="monotone"
                          dataKey="volume"
                          stroke="#2F7A60"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            {/* Top Products & Top Customers Breakdown */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 20,
              }}
            >
              {/* Top Products */}
              <div
                style={{
                  backgroundColor: "var(--bg)",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: 14,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Package size={16} color="var(--primary)" /> Top 10 Products
                  by Revenue
                </h4>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12 }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border)",
                          color: "var(--text-dim)",
                        }}
                      >
                        <th style={{ textAlign: "left", paddingBottom: 6 }}>
                          Product
                        </th>
                        <th style={{ textAlign: "right", paddingBottom: 6 }}>
                          Qty
                        </th>
                        <th style={{ textAlign: "right", paddingBottom: 6 }}>
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedExec.top_products || []).map((p, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                        >
                          <td
                            style={{
                              padding: "6px 0",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                            }}
                            title={p.name}
                          >
                            {p.name}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              color: "var(--text-dim)",
                            }}
                          >
                            {formatQty(p.volume)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "var(--primary)",
                            }}
                          >
                            {formatLakhs(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Customers */}
              <div
                style={{
                  backgroundColor: "var(--bg)",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: 14,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Users size={16} color="var(--green)" /> Top 10 Accounts by
                  Revenue
                </h4>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12 }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border)",
                          color: "var(--text-dim)",
                        }}
                      >
                        <th style={{ textAlign: "left", paddingBottom: 6 }}>
                          Account / Customer
                        </th>
                        <th style={{ textAlign: "right", paddingBottom: 6 }}>
                          Qty
                        </th>
                        <th style={{ textAlign: "right", paddingBottom: 6 }}>
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedExec.top_customers || []).map((c, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                        >
                          <td
                            style={{
                              padding: "6px 0",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                            }}
                            title={c.name}
                          >
                            {c.name}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              color: "var(--text-dim)",
                            }}
                          >
                            {formatQty(c.volume)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "var(--green)",
                            }}
                          >
                            {formatLakhs(c.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
