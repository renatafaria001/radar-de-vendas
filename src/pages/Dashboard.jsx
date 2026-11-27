
import { useState } from "react";

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Search,
  Calendar,
  Layers,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

import {
  getLeads,
  getMetrics,
  getFunnelData,
  getSellerPerformance,
  getSourcePerformance,
  getMonthlyRevenue,
  getPipelineValue,
  filterByPeriod,
  formatMoney,
} from "../services/dataService.js";

import "../App.css";

const colors = [
  "#00e676",
  "#00a854",
  "#a3e635",
  "#355f46",
];

const currentYear = new Date().getFullYear();

export default function Dashboard() {
  const [leads] = useState(() => getLeads());

  const [seller, setSeller] = useState("Todos");
  const [source, setSource] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState("");

  const userName =
    localStorage.getItem("radar-name") || "";

  const sellers = [
    ...new Set(leads.map((lead) => lead.seller)),
  ].filter(Boolean);

  const sources = [
    ...new Set(leads.map((lead) => lead.source)),
  ].filter(Boolean);

  const invalidPeriod =
    startDate && endDate && startDate > endDate;

  const segmentedLeads = leads.filter((lead) => {
    const matchesSeller =
      seller === "Todos" || lead.seller === seller;

    const matchesSource =
      source === "Todos" || lead.source === source;

    return matchesSeller && matchesSource;
  });

  const selectedLeads = invalidPeriod
    ? []
    : filterByPeriod(
        segmentedLeads,
        startDate,
        endDate
      );

  const metrics = getMetrics(selectedLeads);

  const pipeline = getPipelineValue(selectedLeads);

  const funnelData = getFunnelData(selectedLeads);

  const sellerPerformance =
    getSellerPerformance(selectedLeads);

  const sourcePerformance =
    getSourcePerformance(selectedLeads);

  const monthlyRevenue =
    getMonthlyRevenue(selectedLeads, year);

  const bestSource = [...sourcePerformance]
    .filter((item) => item.totalSales > 0)
    .sort((a, b) => b.revenue - a.revenue)[0];

  const missingDates = selectedLeads.filter(
    (lead) =>
      lead.status === "Fechado" &&
      !lead.closedAt
  ).length;

  const filtered = selectedLeads.filter((lead) =>
    [
      lead.name,
      lead.email,
      lead.source,
      lead.seller,
      lead.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const availableYears = [
    ...new Set([
      currentYear,
      ...leads
        .filter((lead) => lead.closedAt)
        .map((lead) =>
          Number(
            String(lead.closedAt).slice(0, 4)
          )
        )
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value >= 1900 &&
            value <= currentYear
        ),
    ]),
  ].sort((a, b) => b - a);

  function clearFilters() {
    setSeller("Todos");
    setSource("Todos");
    setStartDate("");
    setEndDate("");
    setYear(currentYear);
    setSearch("");
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Visão geral de vendas</h1>

          <p>
            {userName
              ? `Olá, ${userName}! Acompanhe seus indicadores.`
              : "Inteligência comercial e análise de desempenho."}
          </p>
        </div>

        <div className="avatar">
          {userName
            ? userName.charAt(0).toUpperCase()
            : "U"}
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filtros de análise</h2>
            <p>
              Segmente os dados comerciais.
            </p>
          </div>

          <Calendar size={22} />
        </div>

        <div className="analytics-filters">
          <label>
            Cadastro inicial

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </label>

          <label>
            Cadastro final

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </label>

          <label>
            Vendedor

            <select
              value={seller}
              onChange={(event) =>
                setSeller(event.target.value)
              }
            >
              <option value="Todos">
                Todos
              </option>

              {sellers.map((name) => (
                <option key={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Canal de aquisição

            <select
              value={source}
              onChange={(event) =>
                setSource(event.target.value)
              }
            >
              <option value="Todos">
                Todos
              </option>

              {sources.map((name) => (
                <option key={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="secondary-button clear-filters"
          onClick={clearFilters}
        >
          <RotateCcw size={16} />
          Limpar filtros
        </button>

        {invalidPeriod && (
          <p className="lead-error">
            A data inicial não pode ser
            posterior à data final.
          </p>
        )}
      </section>

      <section className="stats-grid analytics-stats">
        <StatCard
          title="Faturamento realizado"
          value={formatMoney(metrics.revenue)}
          description="Vendas fechadas dos leads selecionados"
          icon={<DollarSign size={22} />}
        />

        <StatCard
          title="Total de leads"
          value={metrics.totalLeads}
          description="Oportunidades selecionadas"
          icon={<Users size={22} />}
        />

        <StatCard
          title="Taxa de conversão"
          value={
            metrics.conversionRate
              .toFixed(1)
              .replace(".", ",") + "%"
          }
          description="Leads convertidos em vendas"
          icon={<Target size={22} />}
        />

        <StatCard
          title="Ticket médio"
          value={formatMoney(metrics.averageTicket)}
          description="Valor médio por venda"
          icon={<TrendingUp size={22} />}
        />

        <StatCard
          title="Pipeline em aberto"
          value={formatMoney(pipeline)}
          description="Potencial de faturamento"
          icon={<Layers size={22} />}
        />

        <StatCard
          title="Vendas fechadas"
          value={metrics.totalSales}
          description="Negócios concluídos"
          icon={<CheckCircle size={22} />}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Evolução mensal do faturamento</h2>

            <p>
              Histórico por data de fechamento
              dos leads selecionados.
            </p>
          </div>

          <select
            className="year-select"
            aria-label="Ano do faturamento"
            value={year}
            onChange={(event) =>
              setYear(Number(event.target.value))
            }
          >
            {availableYears.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient
                id="revenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#00e676"
                  stopOpacity={0.35}
                />

                <stop
                  offset="100%"
                  stopColor="#00e676"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis dataKey="month" />

            <YAxis
              tickFormatter={(value) =>
                `R$ ${value / 1000}k`
              }
            />

            <Tooltip
              formatter={(value) => [
                formatMoney(value),
                "Faturamento",
              ]}
            />

            <Area
              type="linear"
              dataKey="revenue"
              stroke="#00c853"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {missingDates > 0 && (
          <p className="metric-description">
            Atenção: {missingDates} venda(s)
            sem data de fechamento não aparecem
            no histórico mensal.
          </p>
        )}
      </section>

      <section className="charts-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Desempenho por vendedor</h2>
              <p>Faturamento realizado</p>
            </div>
          </div>

          {sellerPerformance.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <BarChart data={sellerPerformance}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="name" />

                <YAxis
                  tickFormatter={(value) =>
                    `R$ ${value / 1000}k`
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatMoney(value),
                    "Faturamento",
                  ]}
                />

                <Bar
                  dataKey="revenue"
                  fill="#00c853"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">
              Nenhum dado disponível.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Funil de vendas</h2>
              <p>Distribuição dos leads</p>
            </div>
          </div>

          {funnelData.some(
            (item) => item.value > 0
          ) ? (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <PieChart>
                <Pie
                  data={funnelData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {funnelData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={colors[index]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">
              Nenhum lead encontrado.
            </p>
          )}

          <div className="legend">
            {funnelData.map((item, index) => (
              <div
                className="legend-item"
                key={item.name}
              >
                <span
                  className="legend-dot"
                  style={{
                    backgroundColor: colors[index],
                  }}
                />

                <span>{item.name}</span>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Canais de aquisição</h2>
            <p>Eficiência comercial por origem</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Leads</th>
                <th>Vendas</th>
                <th>Conversão</th>
                <th>Faturamento</th>
              </tr>
            </thead>

            <tbody>
              {sourcePerformance.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.totalLeads}</td>
                  <td>{item.totalSales}</td>

                  <td>
                    <div className="conversion-cell">
                      <div className="conversion-track">
                        <div
                          className="conversion-fill"
                          style={{
                            width:
                              `${item.conversionRate}%`,
                          }}
                        />
                      </div>

                      <span>
                        {item.conversionRate
                          .toFixed(1)
                          .replace(".", ",")}%
                      </span>
                    </div>
                  </td>

                  <td className="value-cell">
                    {formatMoney(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sourcePerformance.length === 0 && (
            <p className="empty">
              Nenhum canal encontrado.
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Oportunidades comerciais</h2>
            <p>
              {filtered.length} registros encontrados
            </p>
          </div>
        </div>

        <div className="filters">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar oportunidade..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Origem</th>
                <th>Vendedor</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.source}</td>
                  <td>{lead.seller}</td>

                  <td className="value-cell">
                    {formatMoney(lead.value)}
                  </td>

                  <td>
                    <Status status={lead.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="empty">
              Nenhuma oportunidade encontrada.
            </p>
          )}
        </div>
      </section>

      <section className="insight">
        <div className="insight-icon">
          <TrendingUp size={22} />
        </div>

        <div>
          <strong>
            Insight comercial automático
          </strong>

          <p>
            {bestSource
              ? `O canal ${bestSource.name} apresenta o maior faturamento entre os leads selecionados, com ${formatMoney(bestSource.revenue)} e uma taxa de conversão de ${bestSource.conversionRate.toFixed(1).replace(".", ",")}%.`
              : "Cadastre e conclua oportunidades para gerar insights comerciais."}
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>

        <div className="stat-icon green">
          {icon}
        </div>
      </div>

      <strong className="stat-value">
        {value}
      </strong>

      <p className="metric-description">
        {description}
      </p>
    </div>
  );
}

function Status({ status }) {
  const classes = {
    Fechado: "closed",
    "Em negociação": "negotiation",
    Qualificado: "qualified",
    "Novo lead": "new",
  };

  return (
    <span
      className={
        "status " + (classes[status] || "new")
      }
    >
      {status}
    </span>
  );
}
