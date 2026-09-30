import { useState, useEffect, useMemo, useRef } from "react";
import API from "../api";
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
  AreaChart,
  Area,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Package,
  Map,
  ShoppingCart,
  RefreshCcw,
  X,
  Search,
  Loader2,
  TrendingUp,
  Users,
  BarChart2,
  DollarSign,
  FileText,
  Layers,
  Filter,
  CheckCircle,
  ArrowRight,
  Barcode,
  Clock,
} from "lucide-react";

const CustomTooltip = ({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-chart-tooltip"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "12px 16px",
          borderRadius: "12px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {label && (
          <p
            style={{
              margin: "0 0 6px 0",
              fontSize: "11px",
              color: "var(--text-dim)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </p>
        )}
        {payload.map((pld, idx) => {
          const isPercentage = Boolean(
            pld.name?.includes("%") ||
            pld.name?.toLowerCase().includes("efficiency") ||
            pld.name?.toLowerCase().includes("sell-through") ||
            pld.name?.toLowerCase().includes("asp") ||
            pld.name?.toLowerCase().includes("selling price"),
          );
          const itemPrefix = isPercentage ? "" : prefix;
          const itemSuffix = isPercentage ? "%" : suffix;
          const formattedVal = new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: isPercentage ? 2 : 0,
          }).format(pld.value);
          return (
            <p
              key={idx}
              style={{
                margin: "4px 0 0 0",
                fontSize: "13.5px",
                fontWeight: 700,
                color: pld.color || "var(--primary)",
              }}
            >
              {pld.name}:{" "}
              <span style={{ color: "var(--text)" }}>
                {itemPrefix}
                {formattedVal}
                {itemSuffix}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const formatLakhs = (raw) => {
  const val = Number(raw) || 0;
  return val >= 100000
    ? `₹${(val / 100000).toFixed(1)}L`
    : `₹${Math.round(val).toLocaleString("en-IN")}`;
};
const formatCrores = (raw) => {
  const val = Number(raw) || 0;
  return val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr` : formatLakhs(val);
};
const formatKG = (raw) => {
  const val = Number(raw) || 0;
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val)} KG`;
};

const COLORS = [
  "#0B3B2C",
  "#2F7A60",
  "#5BA28A",
  "#3D6A8A",
  "#7B5E7B",
  "#A78BFA",
  "#F59E0B",
  "#EF4444",
];

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{title}</h3>
    {subtitle && (
      <p
        style={{
          color: "var(--text-dim)",
          fontSize: 12.5,
          margin: "4px 0 0 0",
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

const KpiCard = ({ label, value, icon: Icon, accent }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${accent}` }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 2,
      }}
    >
      <span className="stat-label">{label}</span>
      {Icon && (
        <div
          style={{
            padding: 5,
            borderRadius: 8,
            background: `${accent}1A`,
            color: accent,
            display: "flex",
          }}
        >
          <Icon size={14} />
        </div>
      )}
    </div>
    <span className="stat-value" style={{ color: accent, display: "block" }}>
      {value}
    </span>
  </div>
);

const DataTable = ({ columns, rows, footer }) => (
  <div className="table-wrapper">
    <table className="data-table" style={{ width: "100%", minWidth: 600 }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={c.thStyle || {}}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(rows || []).length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              style={{
                textAlign: "center",
                padding: "24px",
                color: "var(--text-dim)",
              }}
            >
              No data available.
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i} style={r._style || {}}>
              {columns.map((c) => (
                <td key={c.key} style={c.tdStyle || {}}>
                  {c.render ? c.render(r, i) : r[c.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
      {footer && footer}
    </table>
  </div>
);

/* ============================================================
   PRIMARY SALES ANALYSIS TAB
   ============================================================ */
const PrimarySalesTab = ({ data, productFilter = "", distFilter = "" }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowKind, setRowKind] = useState(null);
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  if (!data)
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
      >
        Loading Primary Sales data...
      </div>
    );

  const {
    kpis,
    monthly_trend,
    top_products,
    top_customers,
    divisions,
    regions,
    top_sales_execs,
  } = data;

  const REGION_NAMES = {
    MM: "Maharashtra (MM)",
    GJ: "Gujarat (GJ)",
    MP: "Madhya Pradesh (MP)",
    PB: "Punjab (PB)",
  };

  const regionPieData = (regions || [])
    .filter((r) => r.value > 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .map((r) => ({
      name: REGION_NAMES[r.name] || r.name,
      rawName: r.name,
      value: r.value,
      qty: r.qty,
      invoices: r.invoices,
    }));

  const productQ = productFilter.trim().toLowerCase();
  const distQ = distFilter.trim().toLowerCase();

  const filteredProducts = productQ
    ? (top_products || []).filter((p) =>
        (p.name || "").toLowerCase().includes(productQ),
      )
    : top_products || [];
  const filteredCustomers = distQ
    ? (top_customers || []).filter(
        (c) =>
          (c.name || "").toLowerCase().includes(distQ) ||
          (c.sold_to || "").toLowerCase().includes(distQ) ||
          (c.ship_to || "").toLowerCase().includes(distQ),
      )
    : top_customers || [];

  const productsTotalValue = filteredProducts.reduce(
    (s, p) => s + Number(p.value || 0),
    0,
  );
  const productsTotalQty = filteredProducts.reduce(
    (s, p) => s + Number(p.qty || 0),
    0,
  );
  const customersTotalValue = filteredCustomers.reduce(
    (s, c) => s + Number(c.value || 0),
    0,
  );
  const customersTotalQty = filteredCustomers.reduce(
    (s, c) => s + Number(c.qty || 0),
    0,
  );

  const totalPS = productQ
    ? productsTotalValue
    : distQ
      ? customersTotalValue
      : kpis?.total_value || 0;
  const totalQty = productQ
    ? productsTotalQty
    : distQ
      ? customersTotalQty
      : kpis?.total_qty || 0;

  const monthsCount = (monthly_trend && monthly_trend.length > 0) ? monthly_trend.length : (kpis?.months_count || 1);
  const avgMonthlyVolume = monthsCount > 0 ? totalQty / monthsCount : 0;

  const valueTrend =
    monthly_trend?.map((m) => ({
      month: m.month,
      Value: m.value,
      Qty: m.qty,
    })) || [];

  const qtyTrend =
    monthly_trend?.map((m) => ({
      month: m.month,
      Qty: m.qty,
      Invoices: m.invoices,
    })) || [];

  const pieData = productQ
    ? []
    : (divisions || [])
        .filter((d) => d.value > 0)
        .map((d) => ({ name: d.name, value: d.value }))
        .slice(0, 8);

  const renderCustomerModal = () => {
    if (rowKind !== "customer") return null;
    return (
      <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
        <div
          className="modal"
          style={{ maxWidth: 640 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 14,
              marginBottom: 20,
            }}
          >
            <h2 className="modal-title" style={{ margin: 0 }}>
              Customer — Primary Sales
            </h2>
            <button
              className="btn btn-outline"
              style={{ padding: "6px 8px", borderRadius: "50%" }}
              onClick={() => setSelectedRow(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Customer
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {selectedRow?.name || "-"}
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Value
              </span>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0B3B2C",
                  marginTop: 2,
                }}
              >
                {formatCrores(selectedRow?.value || 0)}
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Quantity
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {formatKG(selectedRow?.qty || 0)}
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Ship To
              </span>
              <div
                style={{ fontSize: 13, marginTop: 2, wordBreak: "break-all" }}
              >
                {selectedRow?.ship_to || "-"}
              </div>
            </div>
          </div>
          {selectedRow?.sold_to && (
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Sold To
              </span>
              <div style={{ fontSize: 13, marginTop: 2 }}>
                {selectedRow.sold_to}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProductModal = () => {
    if (rowKind !== "product") return null;
    return (
      <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
        <div
          className="modal"
          style={{ maxWidth: 640 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 14,
              marginBottom: 20,
            }}
          >
            <h2 className="modal-title" style={{ margin: 0 }}>
              Product — Primary Sales
            </h2>
            <button
              className="btn btn-outline"
              style={{ padding: "6px 8px", borderRadius: "50%" }}
              onClick={() => setSelectedRow(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Product
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {selectedRow?.name || "-"}
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Total Value
              </span>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0B3B2C",
                  marginTop: 2,
                }}
              >
                {formatCrores(selectedRow?.value || 0)}
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Total Quantity
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {formatKG(selectedRow?.qty || 0)}
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                }}
              >
                Avg Monthly Volume
              </span>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#3D6A8A",
                  marginTop: 2,
                }}
              >
                {formatKG((selectedRow?.qty || 0) / monthsCount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* KPIs */}
      <div className="stats-row">
        <KpiCard
          label="Total Primary Sales"
          value={formatCrores(totalPS)}
          sub={`${kpis?.months_count || 0} common months`}
          icon={DollarSign}
          accent="#0B3B2C"
        />
        <KpiCard
          label="Total Volume"
          value={formatKG(totalQty)}
          sub={`Total billed quantity`}
          icon={Package}
          accent="#2F7A60"
        />
        <KpiCard
          label="Average Monthly Volume"
          value={formatKG(avgMonthlyVolume)}
          sub={`Average volume across ${monthsCount} months`}
          icon={TrendingUp}
          accent="#3D6A8A"
        />
        <KpiCard
          label="Active Codes"
          value={kpis?.codes_count || 0}
          icon={Barcode}
          accent="#7B5E7B"
        />
      </div>

      {/* Monthly trend charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: 24,
          marginTop: 24,
        }}
      >
        <div className="card" style={{ padding: 22, height: 380 }}>
          <SectionHeader
            title="Monthly Primary Sales (Value)"
            subtitle="Value in INR Lakhs + Monthly Volume"
          />
          <ResponsiveContainer width="100%" height="78%">
            <ComposedChart
              data={valueTrend}
              margin={{ top: 6, right: 4, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="psVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B3B2C" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0B3B2C" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="month"
                interval={0}
                tick={{ fontSize: 10, fill: "var(--text-dim)", angle: -35, textAnchor: "end" }}
                height={45}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k KG`}
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                name="Sales Value"
                dataKey="Value"
                fill="url(#psVal)"
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
              />
              <Line
                yAxisId="right"
                name="Monthly Volume (KG)"
                dataKey="Qty"
                type="monotone"
                stroke="#3D6A8A"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3D6A8A" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 22, height: 380 }}>
          <SectionHeader
            title="Monthly Primary Sales (Volume)"
            subtitle="Quantity (KGs)"
          />
          <ResponsiveContainer width="100%" height="78%">
            <ComposedChart
              data={qtyTrend}
              margin={{ top: 6, right: 14, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="psQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F7A60" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2F7A60" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="month"
                interval={0}
                tick={{ fontSize: 10, fill: "var(--text-dim)", angle: -35, textAnchor: "end" }}
                height={45}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip suffix=" KG" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                name="Quantity (KG)"
                dataKey="Qty"
                stroke="#2F7A60"
                fill="url(#psQty)"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region-wise Sales Distribution Pie Chart */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <SectionHeader
          title="Region-wise Sales Distribution"
          subtitle="Primary sales value and volume share by delivery plant region"
        />
        {regionPieData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 30,
              color: "var(--text-muted)",
            }}
          >
            No region data available for the current filter.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div style={{ height: 320, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={3}
                    label={({ percent }) => {
                      const p = percent * 100;
                      return p >= 3 ? `${p.toFixed(1)}%` : null;
                    }}
                    labelLine={false}
                  >
                    {regionPieData.map((entry, index) => (
                      <Cell
                        key={`region-cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const total = regionPieData.reduce(
                          (s, r) => s + (r.value || 0),
                          0,
                        );
                        const pctNum =
                          total > 0 ? (item.value / total) * 100 : 0;
                        const pct =
                          pctNum < 0.1 && pctNum > 0
                            ? "< 0.1"
                            : pctNum.toFixed(1);
                        return (
                          <div
                            style={{
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              padding: "10px 14px",
                              borderRadius: "10px",
                              boxShadow: "var(--shadow-lg)",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {item.name}
                            </p>
                            <p
                              style={{
                                margin: "2px 0",
                                fontSize: 12,
                                color:
                                  item.payload?.fill || "var(--primary)",
                                fontWeight: 600,
                              }}
                            >
                              Value:{" "}
                              <span style={{ color: "var(--text)" }}>
                                {formatCrores(item.value)}
                              </span>{" "}
                              ({pct}%)
                            </p>
                            {item.payload?.qty > 0 && (
                              <p
                                style={{
                                  margin: "2px 0",
                                  fontSize: 12,
                                  color: "var(--text-dim)",
                                }}
                              >
                                Volume:{" "}
                                <span style={{ color: "var(--text)" }}>
                                  {formatKG(item.payload.qty)}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    payload={regionPieData.map((entry, index) => ({
                      id: entry.name,
                      type: "circle",
                      value: entry.name,
                      color: COLORS[index % COLORS.length],
                    }))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", margin: 0, minWidth: 420 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Region</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>Value</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>Share (%)</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {regionPieData.map((reg, idx) => {
                    const totalVal = regionPieData.reduce(
                      (s, r) => s + (r.value || 0),
                      0,
                    );
                    const pctNum =
                      totalVal > 0 ? (reg.value / totalVal) * 100 : 0;
                    const share =
                      pctNum < 0.1 && pctNum > 0
                        ? "< 0.1"
                        : pctNum.toFixed(1);
                    return (
                      <tr key={reg.rawName || idx}>
                        <td
                          style={{
                            padding: "14px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: COLORS[idx % COLORS.length],
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <span>{reg.name}</span>
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#0B3B2C",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatCrores(reg.value)}
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "var(--text-dim)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {share}%
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatKG(reg.qty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Top products table */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <SectionHeader
          title="Top Products — Primary Sales"
          subtitle={`Ranked by billed value · ${(top_products || []).length} products`}
        />
        <DataTable
          columns={[
            {
              key: "rank",
              label: "#",
              thStyle: { width: 46 },
              render: (_r, i) => (productPage - 1) * PRODUCTS_PER_PAGE + i + 1,
            },
            {
              key: "name",
              label: "Product",
              tdStyle: { fontWeight: 700, color: "var(--primary)" },
              render: (r) => r.name,
            },
            {
              key: "value",
              label: "Value (INR)",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                fontWeight: 700,
                color: "#0B3B2C",
              },
              render: (r) => formatCrores(r.value),
            },
            {
              key: "qty",
              label: "Quantity (KG)",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right" },
              render: (r) => formatKG(r.qty),
            },
            {
              key: "avg_monthly_volume",
              label: "Avg Monthly Volume",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                color: "#3D6A8A",
                fontWeight: 600,
              },
              render: (r) => formatKG((r.qty || 0) / monthsCount),
            },
          ]}
          rows={(top_products || [])
            .slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE)
            .map((p) => ({ ...p, _style: { cursor: "pointer" } }))}
          footer={
            <tfoot>
              <tr style={{ backgroundColor: "transparent" }}>
                <td
                  colSpan={2}
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  TOTAL PRIMARY SALES:
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#0B3B2C",
                    border: "none",
                    padding: "16px",
                    textAlign: "right",
                  }}
                >
                  {formatCrores(totalPS)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  {formatKG(totalQty)}
                </td>
                <td style={{ border: "none" }}></td>
              </tr>
            </tfoot>
          }
        />

        {/* Pagination controls */}
        {(top_products || []).length > PRODUCTS_PER_PAGE && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setProductPage(1)}
              disabled={productPage === 1}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === 1 ? "var(--bg)" : "var(--surface)",
                color: productPage === 1 ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === 1 ? "not-allowed" : "pointer",
              }}
            >«</button>
            <button
              onClick={() => setProductPage((p) => Math.max(1, p - 1))}
              disabled={productPage === 1}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === 1 ? "var(--bg)" : "var(--surface)",
                color: productPage === 1 ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === 1 ? "not-allowed" : "pointer",
              }}
            >‹ Prev</button>

            {Array.from(
              { length: Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) },
              (_, i) => i + 1,
            )
              .filter((p) => Math.abs(p - productPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setProductPage(p)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: p === productPage ? "var(--primary)" : "var(--surface)",
                    color: p === productPage ? "#fff" : "var(--text)",
                    cursor: "pointer",
                    fontWeight: p === productPage ? 700 : 400,
                  }}
                >{p}</button>
              ))}

            <button
              onClick={() => setProductPage((p) => Math.min(Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE), p + 1))}
              disabled={productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--bg)" : "var(--surface)",
                color: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "not-allowed" : "pointer",
              }}
            >Next ›</button>
            <button
              onClick={() => setProductPage(Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE))}
              disabled={productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--bg)" : "var(--surface)",
                color: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "not-allowed" : "pointer",
              }}
            >»</button>

            <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 8 }}>
              Page {productPage} of {Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE)} · {(top_products || []).length} products
            </span>
          </div>
        )}
      </div>

      {selectedRow && rowKind === "product" && renderProductModal()}
      {selectedRow && rowKind === "customer" && renderCustomerModal()}
    </div>
  );
};

/* ============================================================
   SECONDARY SALES ANALYSIS TAB
   ============================================================ */
const SecondarySalesTab = ({ data, productFilter = "", distFilter = "" }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowKind, setRowKind] = useState(null);
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  useEffect(() => {
    setProductPage(1);
  }, [productFilter, distFilter]);

  if (!data)
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
      >
        Loading Secondary Sales data...
      </div>
    );

  const { kpis, monthly_trend, top_products, top_customers } = data;

  const productQ = productFilter.trim().toLowerCase();
  const distQ = distFilter.trim().toLowerCase();

  const filteredProducts = productQ
    ? (top_products || []).filter((p) =>
        (p.name || "").toLowerCase().includes(productQ),
      )
    : top_products || [];
  const filteredCustomers = distQ
    ? (top_customers || []).filter(
        (c) =>
          (c.name || "").toLowerCase().includes(distQ) ||
          (c.ship_to || "").toLowerCase().includes(distQ),
      )
    : top_customers || [];

  const productsTotalValue = filteredProducts.reduce(
    (s, p) => s + Number(p.value || 0),
    0,
  );
  const productsTotalQty = filteredProducts.reduce(
    (s, p) => s + Number(p.qty || 0),
    0,
  );
  const customersTotalValue = filteredCustomers.reduce(
    (s, c) => s + Number(c.value || 0),
    0,
  );
  const customersTotalQty = filteredCustomers.reduce(
    (s, c) => s + Number(c.qty || 0),
    0,
  );

  const totalSS = productQ
    ? productsTotalValue
    : distQ
      ? customersTotalValue
      : kpis?.total_value || 0;
  const totalQty = productQ
    ? productsTotalQty
    : distQ
      ? customersTotalQty
      : kpis?.total_qty || 0;
  const totalStock = kpis?.total_stock || 0;

  const secMonthsCount = (monthly_trend && monthly_trend.length > 0) ? monthly_trend.length : (kpis?.months_count || 1);
  const avgSecMonthlyVolume = secMonthsCount > 0 ? totalQty / secMonthsCount : 0;

  const valueTrend =
    monthly_trend?.map((m) => ({
      month: m.month,
      Value: m.value,
      Qty: m.qty,
    })) || [];

  const qtyTrend =
    monthly_trend?.map((m) => ({
      month: m.month,
      Qty: m.qty,
      Records: m.records,
    })) || [];

  return (
    <div>
      {/* KPIs */}
      <div className="stats-row">
        <KpiCard
          label="Total Secondary Sales"
          value={formatCrores(totalSS)}
          sub={`${kpis?.months_count || 0} common months`}
          icon={DollarSign}
          accent="#2F7A60"
        />
        <KpiCard
          label="Total Volume"
          value={formatKG(totalQty)}
          sub="Monthly Sales + CSI Sales combined"
          icon={Package}
          accent="#5BA28A"
        />
        <KpiCard
          label="Average Monthly Volume"
          value={formatKG(avgSecMonthlyVolume)}
          sub={`Average volume across ${secMonthsCount} months`}
          icon={TrendingUp}
          accent="#3D6A8A"
        />
        <KpiCard
          label="Active Customers"
          value={kpis?.customers_count || 0}
          icon={Users}
          accent="#7B5E7B"
        />
      </div>

      {/* Monthly trend charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: 24,
          marginTop: 24,
        }}
      >
        <div className="card" style={{ padding: 22, height: 380 }}>
          <SectionHeader
            title="Monthly Secondary Sales (Value)"
            subtitle="INR Lakhs + Monthly Volume"
          />
          <ResponsiveContainer width="100%" height="78%">
            <ComposedChart
              data={valueTrend}
              margin={{ top: 6, right: 4, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="ssVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F7A60" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2F7A60" stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="month"
                interval={0}
                tick={{ fontSize: 10, fill: "var(--text-dim)", angle: -35, textAnchor: "end" }}
                height={45}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k KG`}
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                yAxisId="left"
                name="Sales Value"
                dataKey="Value"
                fill="url(#ssVal)"
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
              />
              <Line
                yAxisId="right"
                name="Monthly Volume (KG)"
                dataKey="Qty"
                type="monotone"
                stroke="#3D6A8A"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3D6A8A" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products bar + Customers bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: 24,
          marginTop: 24,
        }}
      >
        <div className="card" style={{ padding: 22, height: 420 }}>
          <SectionHeader
            title="Top 10 Products by Value"
            subtitle="Share of secondary sales"
          />
          {top_products && top_products.length > 0 ? (
            <ResponsiveContainer width="100%" height="82%">
              <BarChart
                layout="vertical"
                data={(top_products || []).slice(0, 10)}
                margin={{ top: 4, right: 12, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Bar
                  dataKey="value"
                  name="Value"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={18}
                >
                  {(top_products || []).slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "82%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-dim)",
              }}
            >
              No product data.
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 22, height: 420 }}>
          <SectionHeader
            title="Top 10 Customers by Value"
            subtitle="Share of secondary sales"
          />
          {top_customers && top_customers.length > 0 ? (
            <ResponsiveContainer width="100%" height="82%">
              <BarChart
                layout="vertical"
                data={(top_customers || []).slice(0, 10)}
                margin={{ top: 4, right: 12, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Bar
                  dataKey="value"
                  name="Value"
                  fill="#2F7A60"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={18}
                >
                  {(top_customers || []).slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "82%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-dim)",
              }}
            >
              No customer data.
            </div>
          )}
        </div>
      </div>

      {/* Top products table */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <SectionHeader
          title="Top Products — Secondary Sales"
          subtitle={`Ranked by value · ${(top_products || []).length} products`}
        />
        <DataTable
          columns={[
            {
              key: "rank",
              label: "#",
              thStyle: { width: 46 },
              render: (_r, i) => (productPage - 1) * PRODUCTS_PER_PAGE + i + 1,
            },
            {
              key: "name",
              label: "Product",
              tdStyle: { fontWeight: 700, color: "var(--primary)" },
            },
            {
              key: "value",
              label: "Value",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                fontWeight: 700,
                color: "#2F7A60",
              },
              render: (r) => formatCrores(r.value),
            },
            {
              key: "qty",
              label: "Qty (KG)",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right" },
              render: (r) => formatKG(r.qty),
            },
            {
              key: "avg_monthly_volume",
              label: "Avg Monthly Volume",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                color: "#3D6A8A",
                fontWeight: 600,
              },
              render: (r) => formatKG((r.qty || 0) / secMonthsCount),
            },
          ]}
          rows={(top_products || [])
            .slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE)
            .map((p) => ({ ...p, _style: { cursor: "pointer" } }))}
          footer={
            <tfoot>
              <tr style={{ backgroundColor: "transparent" }}>
                <td
                  colSpan={2}
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  TOTAL SECONDARY SALES:
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#2F7A60",
                    border: "none",
                    padding: "16px",
                    textAlign: "right",
                  }}
                >
                  {formatCrores(totalSS)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  {formatKG(totalQty)}
                </td>
                <td style={{ border: "none" }}></td>
              </tr>
            </tfoot>
          }
        />

        {/* Pagination controls */}
        {(top_products || []).length > PRODUCTS_PER_PAGE && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setProductPage(1)}
              disabled={productPage === 1}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === 1 ? "var(--bg)" : "var(--surface)",
                color: productPage === 1 ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === 1 ? "not-allowed" : "pointer",
              }}
            >«</button>
            <button
              onClick={() => setProductPage((p) => Math.max(1, p - 1))}
              disabled={productPage === 1}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === 1 ? "var(--bg)" : "var(--surface)",
                color: productPage === 1 ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === 1 ? "not-allowed" : "pointer",
              }}
            >‹ Prev</button>

            {Array.from(
              { length: Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) },
              (_, i) => i + 1,
            )
              .filter((p) => Math.abs(p - productPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setProductPage(p)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: p === productPage ? "var(--primary)" : "var(--surface)",
                    color: p === productPage ? "#fff" : "var(--text)",
                    cursor: "pointer",
                    fontWeight: p === productPage ? 700 : 400,
                  }}
                >{p}</button>
              ))}

            <button
              onClick={() => setProductPage((p) => Math.min(Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE), p + 1))}
              disabled={productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--bg)" : "var(--surface)",
                color: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "not-allowed" : "pointer",
              }}
            >Next ›</button>
            <button
              onClick={() => setProductPage(Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE))}
              disabled={productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE)}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--bg)" : "var(--surface)",
                color: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "var(--text-dim)" : "var(--text)",
                cursor: productPage === Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE) ? "not-allowed" : "pointer",
              }}
            >»</button>

            <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 8 }}>
              Page {productPage} of {Math.ceil((top_products || []).length / PRODUCTS_PER_PAGE)} · {(top_products || []).length} products
            </span>
          </div>
        )}
      </div>

      {/* Top customers table */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <SectionHeader
          title="Top Customers — Secondary Sales"
          subtitle="Ranked by value (Top 20)"
        />
        <DataTable
          columns={[
            {
              key: "rank",
              label: "#",
              thStyle: { width: 46 },
              render: (_r, i) => i + 1,
            },
            {
              key: "name",
              label: "Customer / Distributor",
              tdStyle: { fontWeight: 700, color: "var(--primary)" },
            },
            {
              key: "ship_to",
              label: "Ship To",
              tdStyle: { color: "var(--text-muted)", fontSize: 13 },
            },
            {
              key: "value",
              label: "Value",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                fontWeight: 700,
                color: "#2F7A60",
              },
              render: (r) => formatCrores(r.value),
            },
            {
              key: "qty",
              label: "Qty (KG)",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right" },
              render: (r) => formatKG(r.qty),
            },
          ]}
          rows={top_customers || []}
          footer={
            <tfoot>
              <tr style={{ backgroundColor: "transparent" }}>
                <td
                  colSpan={3}
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  TOTAL SECONDARY SALES:
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#2F7A60",
                    border: "none",
                    padding: "16px",
                    textAlign: "right",
                  }}
                >
                  {formatCrores(totalSS)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  {formatKG(totalQty)}
                </td>
              </tr>
            </tfoot>
          }
        />
      </div>
    </div>
  );
};

/* ============================================================
   PRIMARY VS SECONDARY ANALYSIS TAB
   ============================================================ */
const PsVsSsTab = ({ data }) => {
  if (!data)
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
      >
        Loading Primary vs Secondary analysis...
      </div>
    );

  const {
    kpis,
    raw_kpis,
    monthly_trend,
    product_group,
    distributor_performance,
    fast_movers,
    slow_movers,
  } = data;

  const fastMoversData = useMemo(() => {
    if (fast_movers && fast_movers.length > 0) {
      return fast_movers.map((p) => ({
        ...p,
        name: p.name.length > 22 ? p.name.slice(0, 20) + "..." : p.name,
        fullName: p.name,
      }));
    }
    const prodMap = {};
    (data?.monthly_comparison || []).forEach((m) => {
      (m.products || []).forEach((p) => {
        if (!prodMap[p.name]) prodMap[p.name] = { name: p.name, ps: 0, ss: 0 };
        prodMap[p.name].ps += p.ps || 0;
        prodMap[p.name].ss += p.ss || 0;
      });
    });
    return Object.values(prodMap)
      .filter((p) => p.ss > 0)
      .sort((a, b) => b.ss - a.ss)
      .slice(0, 8)
      .map((p) => ({
        name: p.name.length > 22 ? p.name.slice(0, 20) + "..." : p.name,
        fullName: p.name,
        "Primary Sales": Math.round(p.ps),
        "Secondary Sales": Math.round(p.ss),
        "Sell-Through Ratio %": p.ps > 0 ? Number(((p.ss / p.ps) * 100).toFixed(1)) : 100,
      }));
  }, [data, fast_movers]);

  const slowMoversData = useMemo(() => {
    if (slow_movers && slow_movers.length > 0) {
      return slow_movers.map((p) => ({
        ...p,
        name: p.name.length > 22 ? p.name.slice(0, 20) + "..." : p.name,
        fullName: p.name,
      }));
    }
    const prodMap = {};
    (data?.monthly_comparison || []).forEach((m) => {
      (m.products || []).forEach((p) => {
        if (!prodMap[p.name]) prodMap[p.name] = { name: p.name, ps: 0, ss: 0 };
        prodMap[p.name].ps += p.ps || 0;
        prodMap[p.name].ss += p.ss || 0;
      });
    });
    return Object.values(prodMap)
      .filter((p) => p.ps > 0)
      .sort((a, b) => {
        const ratioA = (a.ss / a.ps) * 100;
        const ratioB = (b.ss / b.ps) * 100;
        if (ratioA !== ratioB) return ratioA - ratioB;
        return (b.ps - b.ss) - (a.ps - a.ss);
      })
      .slice(0, 8)
      .map((p) => ({
        name: p.name.length > 22 ? p.name.slice(0, 20) + "..." : p.name,
        fullName: p.name,
        "Primary Sales": Math.round(p.ps),
        "Secondary Sales": Math.round(p.ss),
        "Sell-Through Ratio %": Number(((p.ss / p.ps) * 100).toFixed(1)),
      }));
  }, [data, slow_movers]);

  const top10ProductsData = useMemo(() => {
    if (
      product_group &&
      product_group.length > 0 &&
      product_group.some((p) => (p.name || p.group || "").includes(" "))
    ) {
      return product_group.slice(0, 10).map((p) => ({
        ...p,
        displayName:
          (p.name || p.group).length > 24
            ? (p.name || p.group).slice(0, 22) + "..."
            : p.name || p.group,
        fullName: p.name || p.group,
      }));
    }
    const prodMap = {};
    (data?.monthly_comparison || []).forEach((m) => {
      (m.products || []).forEach((p) => {
        if (!p.name || p.name === "Unknown Product") return;
        if (!prodMap[p.name]) {
          prodMap[p.name] = {
            name: p.name,
            group: p.name,
            "Primary Sales": 0,
            "Secondary Sales": 0,
          };
        }
        prodMap[p.name]["Primary Sales"] += p.ps || 0;
        prodMap[p.name]["Secondary Sales"] += p.ss || 0;
      });
    });
    return Object.values(prodMap)
      .sort(
        (a, b) =>
          b["Secondary Sales"] +
          b["Primary Sales"] -
          (a["Secondary Sales"] + a["Primary Sales"]),
      )
      .slice(0, 10)
      .map((p) => ({
        ...p,
        "Primary Sales": Math.round(p["Primary Sales"]),
        "Secondary Sales": Math.round(p["Secondary Sales"]),
        displayName:
          p.name.length > 24 ? p.name.slice(0, 22) + "..." : p.name,
        fullName: p.name,
      }));
  }, [product_group, data]);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* KPI ROW */}
      <div className="stats-row">
        <KpiCard
          label="Total Primary Sales"
          value={formatCrores(kpis?.total_primary || 0)}
          sub="Common months"
          icon={ShoppingCart}
          accent="#0B3B2C"
        />
        <KpiCard
          label="Total Secondary Sales"
          value={formatCrores(kpis?.total_secondary || 0)}
          sub="Common months"
          icon={Package}
          accent="#2F7A60"
        />
        <KpiCard
          label="Sell-Through Ratio"
          value={`${kpis?.channel_efficiency || 0}%`}
          sub="Secondary ÷ Primary (Common months)"
          icon={TrendingUp}
          accent="#3D6A8A"
        />
      </div>

      {/* MONTHLY TREND */}
      <div className="section-card">
        <SectionHeader
          title="Primary vs Secondary — Monthly Trend (Common Months)"
          subtitle="Months where both PS and SS distributors overlap are included"
        />
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <ComposedChart data={monthly_trend || []}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                stroke="var(--text-dim)"
                interval={0}
                tick={{ fontSize: 10, fill: "var(--text-dim)", angle: -35, textAnchor: "end" }}
                height={45}
              />
              <YAxis yAxisId="left" stroke="var(--text-dim)" />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--text-dim)"
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="Primary Sales"
                fill="#0B3B2C"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="Secondary Sales"
                fill="#2F7A60"
                radius={[6, 6, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Efficiency %"
                name="Sell-Through Ratio %"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ r: 4, fill: "#EF4444" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FAST MOVERS & SLOW MOVERS */}
      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
        }}
      >
        {/* FAST MOVERS */}
        <div className="section-card">
          <SectionHeader
            title="Fast Movers"
            subtitle="Top products by secondary sales velocity & sell-through"
          />
          <div style={{ width: "100%", height: 380 }}>
            {fastMoversData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--text-muted)",
                }}
              >
                No fast movers data available.
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart
                  data={fastMoversData}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    stroke="var(--text-dim)"
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--text-dim)"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Primary Sales"
                    fill="#0B3B2C"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="Secondary Sales"
                    fill="#2F7A60"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SLOW MOVERS */}
        <div className="section-card">
          <SectionHeader
            title="Slow Movers"
            subtitle="Products with high primary purchases but low secondary sales"
          />
          <div style={{ width: "100%", height: 380 }}>
            {slowMoversData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--text-muted)",
                }}
              >
                No slow movers data available.
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart
                  data={slowMoversData}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    stroke="var(--text-dim)"
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--text-dim)"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Primary Sales"
                    fill="#0B3B2C"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="Secondary Sales"
                    fill="#EF4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* TOP 10 INDIVIDUAL PRODUCTS */}
      <div className="section-card">
        <SectionHeader
          title="Top 10 Products — Primary vs Secondary"
          subtitle="Top 10 individual products ranked by sales"
        />
        <div style={{ width: "100%", height: 440 }}>
          <ResponsiveContainer>
            <BarChart
              data={top10ProductsData}
              layout="vertical"
              margin={{ left: 10, right: 25, top: 10, bottom: 10 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                stroke="var(--text-dim)"
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                stroke="var(--text-dim)"
                width={180}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="Primary Sales"
                fill="#0B3B2C"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="Secondary Sales"
                fill="#2F7A60"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ORDER REPLENISHMENT TAB
   ============================================================ */
const OrderReplenishmentTab = ({ data }) => {
  const [selectedMonth, setSelectedMonth] = useState("ALL");

  if (!data)
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
      >
        Loading order replenishment data...
      </div>
    );

  const monthly = data.monthly_comparison || [];
  const months = ["ALL", ...monthly.map((m) => m.month)];

  const aggregated = {};
  const pushRow = (p) => {
    const key = p.name || "Unknown";
    if (!aggregated[key]) {
      aggregated[key] = {
        name: key,
        ps: 0,
        ss: 0,
        ps_qty: 0,
        ss_qty: 0,
      };
    }
    aggregated[key].ps += p.ps || 0;
    aggregated[key].ss += p.ss || 0;
    aggregated[key].ps_qty += p.ps_qty || 0;
    aggregated[key].ss_qty += p.ss_qty || 0;
  };

  if (selectedMonth === "ALL") {
    monthly.forEach((m) => (m.products || []).forEach(pushRow));
  } else {
    const mo = monthly.find((m) => m.month === selectedMonth);
    (mo?.products || []).forEach(pushRow);
  }

  const rows = Object.values(aggregated)
    .map((r) => {
      const diff = r.ss - r.ps;
      const eff = r.ps > 0 ? (r.ss / r.ps) * 100 : 0;
      const qtyDiff = r.ss_qty - r.ps_qty;
      const qtyEff = r.ps_qty > 0 ? (r.ss_qty / r.ps_qty) * 100 : 0;
      const replenishmentVal = Math.max(0, diff);
      const replenishmentQty = Math.max(0, qtyDiff);
      const isUrgent = diff > 0;
      const isOptimal = eff >= 80 && eff <= 100;

      return {
        ...r,
        ps: Math.round(r.ps * 100) / 100,
        ss: Math.round(r.ss * 100) / 100,
        ps_qty: Math.round(r.ps_qty * 100) / 100,
        ss_qty: Math.round(r.ss_qty * 100) / 100,
        diff: Math.round(diff * 100) / 100,
        eff: Math.round(eff * 100) / 100,
        qtyDiff: Math.round(qtyDiff * 100) / 100,
        qtyEff: Math.round(qtyEff * 100) / 100,
        replenishmentVal: Math.round(replenishmentVal * 100) / 100,
        replenishmentQty: Math.round(replenishmentQty * 100) / 100,
        status: isUrgent
          ? "Replenish Needed"
          : isOptimal
            ? "Optimal"
            : "Adequate / Overstocked",
        _style: {
          background: isUrgent
            ? "rgba(239, 68, 68, 0.05)"
            : isOptimal
              ? "rgba(47, 122, 96, 0.05)"
              : "transparent",
        },
      };
    })
    .sort((a, b) => b.replenishmentVal - a.replenishmentVal || b.ss - a.ss);

  const totals = rows.reduce(
    (acc, r) => {
      acc.ps += r.ps;
      acc.ss += r.ss;
      acc.qty_ps += r.ps_qty;
      acc.qty_ss += r.ss_qty;
      acc.replenishmentVal += r.replenishmentVal;
      acc.replenishmentQty += r.replenishmentQty;
      if (r.replenishmentVal > 0) acc.replenishCount += 1;
      return acc;
    },
    {
      ps: 0,
      ss: 0,
      qty_ps: 0,
      qty_ss: 0,
      replenishmentVal: 0,
      replenishmentQty: 0,
      replenishCount: 0,
    },
  );

  const totalEff =
    totals.ps > 0 ? ((totals.ss / totals.ps) * 100).toFixed(2) : 0;
  const totalQtyEff =
    totals.qty_ps > 0 ? ((totals.qty_ss / totals.qty_ps) * 100).toFixed(2) : 0;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* FREQUENCY OF DATA CAPTURE BANNER */}
      <div
        className="section-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          background:
            "linear-gradient(135deg, rgba(47, 122, 96, 0.08) 0%, rgba(11, 59, 44, 0.03) 100%)",
          border: "1px solid rgba(47, 122, 96, 0.2)",
          padding: "16px 22px",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(47, 122, 96, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2F7A60",
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div
              style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}
            >
              Frequency of Data Capture
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-dim)",
                marginTop: 2,
              }}
            >
              Data ingestion cadences powering order replenishment & channel supply
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              padding: "8px 14px",
              background: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              minWidth: 160,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Primary Sales
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0B3B2C",
                marginTop: 2,
              }}
            >
              Daily / Continuous
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
              SAP ERP Billing (VBRK/VBRP)
            </div>
          </div>

          <div
            style={{
              padding: "8px 14px",
              background: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              minWidth: 160,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Secondary Sales
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#2F7A60",
                marginTop: 2,
              }}
            >
              Monthly
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
              Distributor CSI Statements
            </div>
          </div>

          <div
            style={{
              padding: "8px 14px",
              background: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              minWidth: 160,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Replenishment Review
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#3D6A8A",
                marginTop: 2,
              }}
            >
              Monthly Run-Rate
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
              Consumption vs Channel Inflow
            </div>
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="stats-row">
        <KpiCard
          label="Suggested Replenishment"
          value={formatCrores(totals.replenishmentVal)}
          sub={`${totals.replenishCount} products need replenishment`}
          icon={ShoppingCart}
          accent="#EF4444"
        />
        <KpiCard
          label="Replenishment Volume"
          value={formatKG(totals.replenishmentQty)}
          sub="Calculated on excess consumption"
          icon={Package}
          accent="#3D6A8A"
        />
        <KpiCard
          label="Secondary Consumption"
          value={formatCrores(totals.ss)}
          sub="Total secondary outflow"
          icon={BarChart2}
          accent="#2F7A60"
        />
        <KpiCard
          label="Channel Sell-Through"
          value={`${totalEff}%`}
          sub={`Volume ratio: ${totalQtyEff}%`}
          icon={TrendingUp}
          accent="#7B5E7B"
        />
      </div>

      {/* HEADER + MONTH SELECTOR */}
      <div
        className="section-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
            Product Order Replenishment Matrix
          </h3>
          <p
            style={{
              margin: "4px 0 0 0",
              color: "var(--text-dim)",
              fontSize: 12.5,
            }}
          >
            Suggested orders identify product stock depletion where customer consumption (SS) outpaces primary delivery (PS).
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-dim)",
            }}
          >
            Review Period:
          </span>
          <select
            className="form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ fontWeight: 700, minWidth: 160 }}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m === "ALL" ? "All Months (YTD Aggregate)" : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-card">
        <DataTable
          columns={[
            { key: "name", label: "Product" },
            {
              key: "ps",
              label: "Primary Supply ₹",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right" },
              render: (r) => formatCrores(r.ps),
            },
            {
              key: "ss",
              label: "Secondary Sales ₹",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right" },
              render: (r) => formatCrores(r.ss),
            },
            {
              key: "diff",
              label: "Net Consumption ₹",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                fontWeight: 700,
                color: (r) => (r.diff >= 0 ? "#2F7A60" : "#EF4444"),
              },
              render: (r) => (r.diff >= 0 ? "+" : "") + formatCrores(r.diff),
            },
            {
              key: "replenishmentVal",
              label: "Suggested Order ₹",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                fontWeight: 800,
                color: (r) =>
                  r.replenishmentVal > 0 ? "#EF4444" : "var(--text-dim)",
              },
              render: (r) =>
                r.replenishmentVal > 0 ? formatCrores(r.replenishmentVal) : "-",
            },
            {
              key: "replenishmentQty",
              label: "Suggested Qty",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                fontWeight: 700,
                color: (r) =>
                  r.replenishmentQty > 0 ? "#EF4444" : "var(--text-dim)",
              },
              render: (r) =>
                r.replenishmentQty > 0 ? formatKG(r.replenishmentQty) : "-",
            },
            {
              key: "eff",
              label: "Sell-Through %",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right", fontWeight: 700 },
              render: (r) => `${r.eff}%`,
            },
            {
              key: "status",
              label: "Status",
              thStyle: { textAlign: "center" },
              tdStyle: { textAlign: "center" },
              render: (r) => (
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background:
                      r.diff > 0
                        ? "rgba(239, 68, 68, 0.12)"
                        : r.eff >= 80 && r.eff <= 100
                          ? "rgba(47, 122, 96, 0.12)"
                          : "rgba(61, 106, 138, 0.12)",
                    color:
                      r.diff > 0
                        ? "#EF4444"
                        : r.eff >= 80 && r.eff <= 100
                          ? "#2F7A60"
                          : "#3D6A8A",
                  }}
                >
                  {r.status}
                </span>
              ),
            },
          ]}
          rows={rows}
          footer={
            <tfoot>
              <tr style={{ backgroundColor: "transparent" }}>
                <td
                  style={{
                    fontWeight: 800,
                    padding: "16px",
                    border: "none",
                  }}
                >
                  TOTAL REPLENISHMENT PLAN
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  {formatCrores(totals.ps)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  {formatCrores(totals.ss)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                    color: totals.ss - totals.ps >= 0 ? "#2F7A60" : "#EF4444",
                  }}
                >
                  {(totals.ss - totals.ps >= 0 ? "+" : "") +
                    formatCrores(totals.ss - totals.ps)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                    color: "#EF4444",
                    fontSize: 14,
                  }}
                >
                  {formatCrores(totals.replenishmentVal)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                    color: "#EF4444",
                  }}
                >
                  {formatKG(totals.replenishmentQty)}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    textAlign: "right",
                    padding: "16px",
                    border: "none",
                  }}
                >
                  {totalEff}%
                </td>
                <td style={{ border: "none" }}></td>
              </tr>
            </tfoot>
          }
        />
      </div>
    </div>
  );
};

const VarianceTableTab = OrderReplenishmentTab;

/* ============================================================
   OVERVIEW TAB
   ============================================================ */
const OverviewTab = ({ data }) => {
  if (!data)
    return (
      <div
        style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}
      >
        Loading overview...
      </div>
    );

  const { top_products, top_customers, monthly_progression, stock_levels } =
    data;

  const totalVol = (top_products || []).reduce(
    (s, p) => s + (p.volume || 0),
    0,
  );
  const totalCustVol = (top_customers || []).reduce(
    (s, c) => s + (c.volume || 0),
    0,
  );
  const totalStock = (stock_levels || []).reduce(
    (s, sl) => s + (sl.stock || 0),
    0,
  );

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="stats-row">
        <KpiCard
          label="Top 5 Products Volume"
          value={formatKG(totalVol)}
          sub="Highest volume secondary products"
          icon={Package}
          accent="#0B3B2C"
        />
        <KpiCard
          label="Top 5 Customers Volume"
          value={formatKG(totalCustVol)}
          sub="Highest volume secondary customers"
          icon={Users}
          accent="#2F7A60"
        />
        <KpiCard
          label="Top 5 Stock Value (KG)"
          value={formatKG(totalStock)}
          sub="Month-end inventory from StockLevel"
          icon={Map}
          accent="#3D6A8A"
        />
        <KpiCard
          label="Data Points"
          value={`${(monthly_progression || []).length} months`}
          sub="Secondary sales time coverage"
          icon={FileText}
          accent="#7B5E7B"
        />
      </div>

      {/* MONTHLY PROGRESSION */}
      <div className="section-card">
        <SectionHeader
          title="Monthly Secondary Volume Progression"
          subtitle="Total KG sold per month"
        />
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={monthly_progression || []}>
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F7A60" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#2F7A60" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="var(--text-dim)"
                interval={0}
                tick={{ fontSize: 10, fill: "var(--text-dim)", angle: -35, textAnchor: "end" }}
                height={45}
              />
              <YAxis stroke="var(--text-dim)" />
              <Tooltip content={<CustomTooltip suffix=" KG" />} />
              <Area
                type="monotone"
                dataKey="volume"
                name="Volume KG"
                stroke="#0B3B2C"
                strokeWidth={3}
                fill="url(#progGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {/* TOP 5 PRODUCTS */}
        <div className="section-card">
          <SectionHeader
            title="Top 5 Products (Volume)"
            subtitle="Highest volume secondary sales"
          />
          <DataTable
            columns={[
              { key: "name", label: "Product" },
              {
                key: "volume",
                label: "Volume",
                thStyle: { textAlign: "right" },
                tdStyle: { textAlign: "right", fontWeight: 700 },
                render: (r) => formatKG(r.volume),
              },
            ]}
            rows={top_products || []}
          />
        </div>

        {/* TOP 5 CUSTOMERS */}
        <div className="section-card">
          <SectionHeader
            title="Top 5 Customers (Volume)"
            subtitle="Highest volume end customers"
          />
          <DataTable
            columns={[
              { key: "name", label: "Customer" },
              {
                key: "volume",
                label: "Volume",
                thStyle: { textAlign: "right" },
                tdStyle: { textAlign: "right", fontWeight: 700 },
                render: (r) => formatKG(r.volume),
              },
            ]}
            rows={top_customers || []}
          />
        </div>

        {/* TOP 5 STOCK LEVELS */}
        <div className="section-card">
          <SectionHeader
            title="Top 5 Stock Levels"
            subtitle="By month-end inventory (KG)"
          />
          <DataTable
            columns={[
              { key: "name", label: "Product" },
              {
                key: "stock",
                label: "Stock",
                thStyle: { textAlign: "right" },
                tdStyle: { textAlign: "right", fontWeight: 700 },
                render: (r) => formatKG(r.stock),
              },
            ]}
            rows={stock_levels || []}
          />
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ROOT PAGE
   ============================================================ */
const DISTRIBUTOR_CODES = {
  CHEMIELINK: [
    { code: "438498", name: "Chemielink" },
    { code: "441522", name: "Chemie Link" },
  ],
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("primary");
  const [selectedDistributor, setSelectedDistributor] = useState("CHEMIELINK");
  const [selectedDistCode, setSelectedDistCode] = useState("");
  const [primaryData, setPrimaryData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const [psssData, setPsssData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [productFilter, setProductFilter] = useState("");
  const [debouncedProductFilter, setDebouncedProductFilter] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    API.get("/products/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setAllProducts(data);
      })
      .catch((err) => console.error("Error loading products master:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productOptions = useMemo(() => {
    const namesSet = new Set();
    (allProducts || []).forEach((p) => {
      const name = typeof p === "string" ? p : (p.product_name || p.name);
      if (name) namesSet.add(name);
    });
    (primaryData?.top_products || []).forEach((p) => p.name && namesSet.add(p.name));
    (secondaryData?.top_products || []).forEach((p) => p.name && namesSet.add(p.name));

    const list = Array.from(namesSet);
    if (!productFilter.trim()) return list.slice(0, 30);

    const q = productFilter.trim().toLowerCase();
    return list.filter((name) => name.toLowerCase().includes(q)).slice(0, 30);
  }, [allProducts, primaryData, secondaryData, productFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductFilter(productFilter);
    }, 350);
    return () => clearTimeout(handler);
  }, [productFilter]);

  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      if (!primaryData) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }
      try {
        const productQ = debouncedProductFilter.trim();
        const qs = (extra) =>
          `?distributor=${selectedDistributor}${
            selectedDistCode ? `&distributor_code=${encodeURIComponent(selectedDistCode)}` : ""
          }${
            productQ ? `&product=${encodeURIComponent(productQ)}` : ""
          }${
            fromDate ? `&from_date=${encodeURIComponent(fromDate)}` : ""
          }${
            toDate ? `&to_date=${encodeURIComponent(toDate)}` : ""
          }${extra ? extra : ""}`;
        const [pr, sr, psss, ov] = await Promise.all([
          API.get(`/dashboard/primary-sales/${qs()}`),
          API.get(`/dashboard/secondary-sales/${qs()}`),
          API.get(`/dashboard/analytics-ps-ss/${qs()}`),
          API.get(`/dashboard/metrics/${qs()}`),
        ]);
        if (!isCancelled) {
          setPrimaryData(pr.data);
          setSecondaryData(sr.data);
          setPsssData(psss.data);
          setOverviewData(ov.data);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    };
    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [selectedDistributor, selectedDistCode, debouncedProductFilter, fromDate, toDate]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          flexDirection: "column",
        }}
      >
        <span
          className="spinner"
          style={{ width: 40, height: 40, marginBottom: 16 }}
        />
        <p style={{ color: "var(--text-muted)" }}>
          Aggregating sales analytics...
        </p>
      </div>
    );
  }

  const hasActiveFilter =
    productFilter.trim() ||
    distFilter.trim() ||
    selectedDistCode ||
    fromDate ||
    toDate;

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 16 }}>
        Sales Analytics Dashboard
      </h1>

      {/* STICKY TOP CONTROLS: TABS, SEARCH & ALL FILTERS */}
      <div
        className="dashboard-sticky-controls"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 85,
          background: "rgba(248, 247, 247, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          margin: "0 -48px 24px -48px",
          padding: "16px 48px",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* ROW 1: TABS & SYNC STATUS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              className={`btn ${activeTab === "primary" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("primary")}
            >
              Primary Sales Analysis
            </button>
            <button
              className={`btn ${activeTab === "secondary" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("secondary")}
            >
              Secondary Sales Analysis
            </button>
            <button
              className={`btn ${activeTab === "psss" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("psss")}
            >
              Primary vs Secondary
            </button>
            <button
              className={`btn ${activeTab === "replenishment" || activeTab === "variance" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("replenishment")}
            >
              Order Replenishment
            </button>
          </div>
          <div
            style={{
              color: "var(--text-dim)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
            }}
          >
            <RefreshCcw size={13} />
            Auto-synced
          </div>
        </div>

        {/* ROW 2: SEARCH PRODUCT + DISTRIBUTOR + DIST CODE + FROM DATE + TO DATE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* SEARCH PRODUCT */}
          <div
            ref={searchContainerRef}
            style={{ position: "relative", minWidth: 220, flex: "1 1 220px" }}
          >
            <input
              type="text"
              placeholder="Search product (e.g. Ethyl Acetate)..."
              value={productFilter}
              onFocus={() => setShowProductDropdown(true)}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setShowProductDropdown(true);
              }}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                outline: "none",
                fontWeight: 600,
              }}
            />
            {isFetching ? (
              <Loader2
                size={14}
                className="animate-spin"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--primary)",
                }}
              />
            ) : (
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)",
                }}
              />
            )}
            {productFilter && (
              <button
                onClick={() => {
                  setProductFilter("");
                  setShowProductDropdown(false);
                }}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                }}
                title="Clear product filter"
              >
                <X size={14} />
              </button>
            )}

            {showProductDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  maxHeight: 250,
                  overflowY: "auto",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
                  zIndex: 1000,
                  padding: "4px 0",
                }}
              >
                {productOptions.length > 0 ? (
                  productOptions.map((prodName, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setProductFilter(prodName);
                        setShowProductDropdown(false);
                      }}
                      style={{
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text)",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>{prodName}</span>
                      <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Product</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
                    No matching products found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DISTRIBUTOR */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Dist:
            </span>
            <select
              className="form-control"
              value={selectedDistributor}
              onChange={(e) => {
                setSelectedDistributor(e.target.value);
                setSelectedDistCode("");
              }}
              style={{
                minWidth: 140,
                padding: "6px 10px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <option value="CHEMIELINK">CHEMIELINK</option>
            </select>
          </div>

          {/* DISTRIBUTOR CODE */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Code:
            </span>
            <select
              className="form-control"
              value={selectedDistCode}
              onChange={(e) => setSelectedDistCode(e.target.value)}
              style={{
                minWidth: 160,
                padding: "6px 10px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <option value="">All Codes</option>
              {(DISTRIBUTOR_CODES[selectedDistributor] || []).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE FROM */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              From:
            </span>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            />
          </div>

          {/* DATE TO */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              To:
            </span>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            />
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Clear date filter"
            >
              <X size={12} /> Clear Dates
            </button>
          )}
        </div>

        {/* ROW 3: ACTIVE FILTERS */}
        {hasActiveFilter && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              paddingTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--primary)",
              }}
            >
              Active filters:
            </span>
            {productFilter.trim() && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  background: "rgba(11, 59, 44, 0.08)",
                  color: "#0B3B2C",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Product ≈ “{productFilter.trim()}”
                <button
                  onClick={() => setProductFilter("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    color: "#0B3B2C",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedDistCode && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  background: "rgba(47, 122, 96, 0.1)",
                  color: "#2F7A60",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Code: {selectedDistCode} ({(DISTRIBUTOR_CODES[selectedDistributor] || []).find((c) => c.code === selectedDistCode)?.name || ""})
                <button
                  onClick={() => setSelectedDistCode("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    color: "#2F7A60",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {fromDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  background: "rgba(11, 59, 44, 0.08)",
                  color: "#0B3B2C",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                From: {fromDate}
                <button
                  onClick={() => setFromDate("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    color: "#0B3B2C",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {toDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  background: "rgba(11, 59, 44, 0.08)",
                  color: "#0B3B2C",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                To: {toDate}
                <button
                  onClick={() => setToDate("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    color: "#0B3B2C",
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="tab-content" style={{ animation: "fadeIn 0.3s" }}>
        {activeTab === "primary" ? (
          <PrimarySalesTab
            data={primaryData}
            productFilter={productFilter}
            distFilter={distFilter}
          />
        ) : activeTab === "secondary" ? (
          <SecondarySalesTab
            data={secondaryData}
            productFilter={productFilter}
            distFilter={distFilter}
          />
        ) : activeTab === "psss" ? (
          <PsVsSsTab data={psssData} />
        ) : activeTab === "replenishment" || activeTab === "variance" ? (
          <OrderReplenishmentTab data={psssData} />
        ) : null}
      </div>
    </div>
  );
}
