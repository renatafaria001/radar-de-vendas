
import { useState } from "react";
import { exportSalesCSV } from "../services/csvService.js";

import {
  BarChart,
  Bar,
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
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Download,
  Trophy,
  Calendar,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  getLeads,
  getSales,
  getMetrics,
  getSellerPerformance,
  getSourcePerformance,
  formatMoney,
} from "../services/dataService.js";

import "../App.css";

const colors = [
  "#00e676",
  "#00a854",
  "#a3e635",
  "#355f46",
  "#14b8a6",
];

function formatDate(value) {
  if (!value) return "Não registrada";

  const parts = String(value)
    .slice(0, 10)
    .split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function Vendas() {
  const [leads] = useState(() => getLeads());

  const [seller, setSeller] = useState("Todos");
  const [source, setSource] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const allSales = getSales(leads);

  const sellers = [
    ...new Set(
      allSales.map((sale) => sale.seller)
    ),
  ].filter(Boolean);

  const sources = [
    ...new Set(
      allSales.map((sale) => sale.source)
    ),
  ].filter(Boolean);

  const invalidPeriod =
    startDate &&
    endDate &&
    startDate > endDate;

  const sales = allSales
    .filter((sale) => {
      if (invalidPeriod) return false;

      if (
        seller !== "Todos" &&
        sale.seller !== seller
      ) {
        return false;
      }

      if (
        source !== "Todos" &&
        sale.source !== source
      ) {
        return false;
      }

      const date = String(
        sale.closedAt || ""
      ).slice(0, 10);

      if (
        (startDate || endDate) &&
        !date
      ) {
        return false;
      }

      if (startDate && date < startDate) {
        return false;
      }

      if (endDate && date > endDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) =>
      String(b.closedAt || "").localeCompare(
        String(a.closedAt || "")
      )
    );

  const metrics = getMetrics(sales);

  const sellerData = getSellerPerformance(
    sales
  ).sort((a, b) => b.revenue - a.revenue);

  const sourceData = getSourcePerformance(
    sales
  ).sort((a, b) => b.revenue - a.revenue);

  const bestSeller = sellerData[0];

  const maxRevenue =
    bestSeller?.revenue || 0;

  const missingDates = allSales.filter(
    (sale) => !sale.closedAt
  ).length;

  const filtered = sales.filter((sale) =>
    [
      sale.name,
      sale.seller,
      sale.source,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function clearFilters() {
    setSeller("Todos");
    setSource("Todos");
    setStartDate("");
    setEndDate("");
    setSearch("");
  }

  function exportCSV() {
  exportSalesCSV(filtered);
} {
    function csvCell(value) {
      let text = String(value ?? "");

      if (
        /^[\s]*[=+\-@]/.test(text) ||
        /^[\t\r\n]/.test(text)
      ) {
        text = "'" + text;
      }

      return (
        '"' +
        text.replace(/"/g, '""') +
        '"'
      );
    }

    const rows = [
      [
        "Empresa",
        "Vendedor",
        "Origem",
        "Valor",
        "Status",
        "Data de cadastro",
        "Data de fechamento",
      ],

      ...filtered.map((sale) => [
        sale.name,
        sale.seller,
        sale.source,
        (Number(sale.value) || 0)
          .toFixed(2)
          .replace(".", ","),
        sale.status,
        sale.date || "",
        sale.closedAt || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map(csvCell).join(";")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "technoverso-relatorio-vendas.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Análise de Vendas</h1>

          <p>
            Acompanhe o faturamento e
            o desempenho comercial.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={exportCSV}
          disabled={filtered.length === 0}
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filtros de vendas</h2>

            <p>
              Analise as vendas por
              data de fechamento.
            </p>
          </div>

          <Calendar size={22} />
        </div>

        <div className="analytics-filters">
          <label>
            Fechamento inicial

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </label>

          <label>
            Fechamento final

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

        {missingDates > 0 && (
          <p className="metric-description">
            Existem {missingDates} vendas
            na base sem data de fechamento.
            Elas são excluídas quando um
            período é selecionado.
          </p>
        )}
      </section>

      <section className="stats-grid">
        <SalesCard
          title="Faturamento total"
          value={formatMoney(metrics.revenue)}
          icon={<DollarSign size={22} />}
        />

        <SalesCard
          title="Vendas realizadas"
          value={metrics.totalSales}
          icon={<ShoppingBag size={22} />}
        />

        <SalesCard
          title="Ticket médio"
          value={formatMoney(
            metrics.averageTicket
          )}
          icon={<TrendingUp size={22} />}
        />

        <SalesCard
          title="Destaque comercial"
          value={bestSeller?.name || "—"}
          icon={<Trophy size={22} />}
        />
      </section>

      <section className="charts-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Faturamento por vendedor</h2>

              <p>
                Desempenho da equipe comercial
              </p>
            </div>
          </div>

          {sellerData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart data={sellerData}>
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
              Nenhuma venda encontrada.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Receita por canal</h2>

              <p>
                Origem das vendas realizadas
              </p>
            </div>
          </div>

          {metrics.revenue > 0 ? (
            <>
              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {sourceData.map(
                      (item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            colors[
                              index % colors.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatMoney(value)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="legend">
                {sourceData.map(
                  (item, index) => (
                    <div
                      className="legend-item"
                      key={item.name}
                    >
                      <span
                        className="legend-dot"
                        style={{
                          backgroundColor:
                            colors[
                              index % colors.length
                            ],
                        }}
                      />

                      <span>{item.name}</span>

                      <strong>
                        {formatMoney(item.revenue)}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <p className="empty">
              Nenhuma receita registrada.
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Ranking de vendedores</h2>

            <p>
              Classificação por faturamento
            </p>
          </div>

          <Trophy
            size={24}
            color="#00c853"
          />
        </div>

        <div className="sales-ranking">
          {sellerData.map((item, index) => (
            <div
              className="ranking-item"
              key={item.name}
            >
              <div className="ranking-header">
                <div className="ranking-position">
                  {index + 1}º
                </div>

                <div className="ranking-name">
                  <strong>{item.name}</strong>

                  <p>
                    {item.totalSales} venda(s)
                  </p>
                </div>

                <strong className="value-cell">
                  {formatMoney(item.revenue)}
                </strong>
              </div>

              <div className="ranking-track">
                <div
                  className="ranking-fill"
                  style={{
                    width: `${
                      maxRevenue > 0
                        ? (item.revenue /
                            maxRevenue) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}

          {sellerData.length === 0 && (
            <p className="empty">
              Nenhum vendedor classificado.
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Histórico de vendas</h2>

            <p>
              {filtered.length} vendas encontradas
            </p>
          </div>
        </div>

        <div className="filters">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar venda..."
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
                <th>Vendedor</th>
                <th>Canal de aquisição</th>
                <th>Valor da venda</th>
                <th>Fechamento</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.name}</td>
                  <td>{sale.seller}</td>
                  <td>{sale.source}</td>

                  <td className="value-cell">
                    {formatMoney(
                      Number(sale.value) || 0
                    )}
                  </td>

                  <td>
                    {formatDate(sale.closedAt)}
                  </td>

                  <td>
                    <span className="status closed">
                      Fechado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="empty">
              Nenhuma venda encontrada.
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
            {bestSeller
              ? `${bestSeller.name} lidera o faturamento das vendas selecionadas, com ${formatMoney(bestSeller.revenue)} em ${bestSeller.totalSales} venda(s). O ticket médio geral é de ${formatMoney(metrics.averageTicket)}.`
              : "Registre vendas para gerar insights comerciais."}
          </p>
        </div>
      </section>
    </div>
  );
}

function SalesCard({
  title,
  value,
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
    </div>
  );
}
