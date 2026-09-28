import { useState, useEffect } from "react";
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
  TrendingUp,
  Users,
  BarChart2,
  DollarSign,
  FileText,
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
            pld.name?.toLowerCase().includes("asp"),
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

const formatLakhs = (val) =>
  val >= 100000
    ? `₹${(val / 100000).toFixed(1)}L`
    : `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
const formatCrores = (val) =>
  val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr` : formatLakhs(val);
const formatKG = (val) =>
  val !== undefined && val !== null
    ? `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val || 0)} KG`
    : "0 KG";

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

const KpiCard = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${accent}` }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
      }}
    >
      <span className="stat-label">{label}</span>
      {Icon && (
        <div
          style={{
            padding: 8,
            borderRadius: 10,
            background: `${accent}1A`,
            color: accent,
            display: "flex",
          }}
        >
          <Icon size={16} />
        </div>
      )}
    </div>
    <span className="stat-value" style={{ color: accent, display: "block" }}>
      {value}
    </span>
    {sub && (
      <span
        style={{
          fontSize: 12,
          color: "var(--text-dim)",
          marginTop: 4,
          display: "block",
        }}
      >
        {sub}
      </span>
    )}
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
                  {c.render ? c.render(r) : r[c.key]}
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
    top_sales_execs,
  } = data;

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

  const totalASP = totalQty > 0 ? totalPS / totalQty : 0;

  const valueTrend =
    monthly_trend?.map((m) => ({
      month: m.month,
      Value: m.value,
      ASP: m.asp || 0,
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
                Avg. ASP
              </span>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#3D6A8A",
                  marginTop: 2,
                }}
              >
                ₹
                {selectedRow?.qty > 0
                  ? Math.round(
                      selectedRow.value / selectedRow.qty,
                    ).toLocaleString("en-IN")
                  : 0}
                /KG
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
          sub={`${kpis?.months_count || 0} months of data`}
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
          label="Average ASP"
          value={`₹${Math.round(totalASP || 0).toLocaleString("en-IN")}/KG`}
          sub={`${kpis?.total_invoices || 0} invoices`}
          icon={TrendingUp}
          accent="#3D6A8A"
        />
        <KpiCard
          label="Active Customers"
          value={kpis?.customers_count || 0}
          sub={`${kpis?.products_count || 0} products sold across ${kpis?.divisions_count || 0} divisions`}
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
            title="Monthly Primary Sales (Value)"
            subtitle="Value in INR Lakhs + Average ASP"
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
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
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
                tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
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
                name="Avg ASP"
                dataKey="ASP"
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
            subtitle="Quantity (KGs) + Invoice count"
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
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
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
              <Line
                name="Invoices"
                dataKey="Invoices"
                type="monotone"
                stroke="#F59E0B"
                strokeWidth={2.2}
                dot={{ r: 3, fill: "#F59E0B" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Division pie + Top execs */}
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
            title="Division-wise Split"
            subtitle="Share of total primary sales value"
          />
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="82%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}  ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "var(--border)" }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    return (
                      <div
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          padding: "10px 14px",
                          borderRadius: 10,
                          boxShadow: "var(--shadow-lg)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 4,
                            color: "var(--text-dim)",
                          }}
                        >
                          {label || p.name}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: p.color,
                          }}
                        >
                          {formatCrores(p.value)}
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
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
              No division data.
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 22 }}>
          <SectionHeader
            title="Top Sales Executives"
            subtitle="Ranked by primary sales value (Top 15)"
          />
          <DataTable
            columns={[
              { key: "name", label: "Executive" },
              {
                key: "value",
                label: "Value",
                tdStyle: {
                  fontWeight: 700,
                  color: "#0B3B2C",
                  textAlign: "right",
                },
                thStyle: { textAlign: "right" },
                render: (r) => formatCrores(r.value),
              },
              {
                key: "qty",
                label: "Qty",
                tdStyle: { textAlign: "right" },
                thStyle: { textAlign: "right" },
                render: (r) => formatKG(r.qty),
              },
              {
                key: "invoices",
                label: "Invoices",
                tdStyle: { textAlign: "right" },
                thStyle: { textAlign: "right" },
              },
              {
                key: "asp",
                label: "ASP",
                tdStyle: {
                  fontWeight: 600,
                  textAlign: "right",
                  color: "#3D6A8A",
                },
                thStyle: { textAlign: "right" },
                render: (r) =>
                  `₹${Math.round(r.asp || 0).toLocaleString("en-IN")}`,
              },
            ]}
            rows={top_sales_execs || []}
          />
        </div>
      </div>

      {/* Top products table */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <SectionHeader
          title="Top Products — Primary Sales"
          subtitle="Ranked by billed value (Top 20)"
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
              key: "asp",
              label: "Avg ASP",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                color: "#3D6A8A",
                fontWeight: 600,
              },
              render: (r) =>
                `₹${r.qty > 0 ? Math.round(r.value / r.qty).toLocaleString("en-IN") : 0}/KG`,
            },
          ]}
          rows={(top_products || []).map((p, i) => ({
            ...p,
            _style: { cursor: "pointer" },
          }))}
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
      </div>

      {/* Top customers table */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <SectionHeader
          title="Top Customers — Primary Sales"
          subtitle="Ranked by billed value (Top 20)"
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
              key: "sold_to",
              label: "Sold To",
              tdStyle: { color: "var(--text-muted)", fontSize: 13 },
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
                color: "#0B3B2C",
              },
              render: (r) => formatCrores(r.value),
            },
            {
              key: "qty",
              label: "Qty",
              thStyle: { textAlign: "right" },
              tdStyle: { textAlign: "right" },
              render: (r) => formatKG(r.qty),
            },
          ]}
          rows={(top_customers || []).map((c, i) => ({
            ...c,
            _style: { cursor: "pointer" },
          }))}
          footer={
            <tfoot>
              <tr style={{ backgroundColor: "transparent" }}>
                <td
                  colSpan={4}
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
              </tr>
            </tfoot>
          }
        />
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

  const valueTrend =
    monthly_trend?.map((m) => ({
      month: m.month,
      Value: m.value,
      ASP: m.asp || 0,
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
          sub={`${kpis?.months_count || 0} months of data`}
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
          label="Average ASP"
          value={`₹${Math.round(kpis?.avg_asp || 0).toLocaleString("en-IN")}/KG`}
          sub={`${kpis?.total_records || 0} records`}
          icon={TrendingUp}
          accent="#3D6A8A"
        />
        <KpiCard
          label="Active Products"
          value={kpis?.products_count || 0}
          sub={`${kpis?.customers_count || 0} unique customers · ${formatKG(totalStock)} stock`}
          icon={ShoppingCart}
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
            subtitle="INR Lakhs + Average ASP"
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
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
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
                tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
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
                name="Avg ASP"
                dataKey="ASP"
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
            title="Monthly Secondary Sales (Volume)"
            subtitle="Quantity (KGs) + Record count"
          />
          <ResponsiveContainer width="100%" height="78%">
            <ComposedChart
              data={qtyTrend}
              margin={{ top: 6, right: 14, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="ssQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5BA28A" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#5BA28A" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--text-dim)" }}
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
                stroke="#5BA28A"
                fill="url(#ssQty)"
                strokeWidth={2}
              />
              <Line
                name="Records"
                dataKey="Records"
                type="monotone"
                stroke="#F59E0B"
                strokeWidth={2.2}
                dot={{ r: 3, fill: "#F59E0B" }}
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
              key: "asp",
              label: "Avg ASP",
              thStyle: { textAlign: "right" },
              tdStyle: {
                textAlign: "right",
                color: "#3D6A8A",
                fontWeight: 600,
              },
              render: (r) =>
                `₹${r.qty > 0 ? Math.round(r.value / r.qty).toLocaleString("en-IN") : 0}/KG`,
            },
          ]}
          rows={top_products || []}
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
   ROOT PAGE
   ============================================================ */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("primary");
  const [selectedDistributor, setSelectedDistributor] = useState("CHEMIELINK");
  const [primaryData, setPrimaryData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("");
  const [distFilter, setDistFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const productQ = productFilter.trim();
        const [pr, sr] = await Promise.all([
          API.get(
            `/dashboard/primary-sales/?distributor=${selectedDistributor}${
              productQ ? `&product=${encodeURIComponent(productQ)}` : ""
            }`,
          ),
          API.get(
            `/dashboard/secondary-sales/?distributor=${selectedDistributor}${
              productQ ? `&product=${encodeURIComponent(productQ)}` : ""
            }`,
          ),
        ]);
        setPrimaryData(pr.data);
        setSecondaryData(sr.data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDistributor, productFilter]);

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

  const hasActiveFilter = productFilter.trim() || distFilter.trim();

  return (
    <div>
      <div
        className="page-header"
        style={{
          borderBottom: "1px solid var(--border)",
          paddingBottom: 20,
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 420px" }}>
          <h1 className="page-title" style={{ marginBottom: 16 }}>
            Sales Analytics Dashboard
          </h1>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 18,
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
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}
            >
              <input
                type="text"
                placeholder="Search product (e.g. Ethyl Acetate)..."
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
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
              {productFilter && (
                <button
                  onClick={() => setProductFilter("")}
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
            </div>
            <div
              style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}
            >
              <input
                type="text"
                placeholder="Search distributor / customer (e.g. Mikhail)..."
                value={distFilter}
                onChange={(e) => setDistFilter(e.target.value)}
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
              {distFilter && (
                <button
                  onClick={() => setDistFilter("")}
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
                  title="Clear distributor filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          {hasActiveFilter && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
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
                    padding: "4px 10px",
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
              {distFilter.trim() && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    background: "rgba(47, 122, 96, 0.1)",
                    color: "#2F7A60",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Distributor ≈ “{distFilter.trim()}”
                  <button
                    onClick={() => setDistFilter("")}
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
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-dim)",
              }}
            >
              Distributor:
            </span>
            <select
              className="form-control"
              value={selectedDistributor}
              onChange={(e) => setSelectedDistributor(e.target.value)}
              style={{
                minWidth: 180,
                padding: "6px 12px",
                fontWeight: 700,
              }}
            >
              <option value="CHEMIELINK">CHEMIELINK</option>
            </select>
          </div>
          <div
            style={{
              color: "var(--text-dim)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
            }}
          >
            <RefreshCcw size={14} />
            Last synced freshly via endpoints
          </div>
        </div>
      </div>

      <div className="tab-content" style={{ animation: "fadeIn 0.3s" }}>
        {activeTab === "primary" ? (
          <PrimarySalesTab
            data={primaryData}
            productFilter={productFilter}
            distFilter={distFilter}
          />
        ) : (
          <SecondarySalesTab
            data={secondaryData}
            productFilter={productFilter}
            distFilter={distFilter}
          />
        )}
      </div>
    </div>
  );
}
