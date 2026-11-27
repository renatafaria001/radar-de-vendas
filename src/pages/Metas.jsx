
import { useState } from "react";
import { Download } from "lucide-react";
import { exportGoalsCSV } from "../services/csvService.js";

import {
  Target,
  Trophy,
  TrendingUp,
  DollarSign,
  Pencil,
  Save,
  Calendar,
  CheckCircle,
} from "lucide-react";

import {
  getLeads,
  getSales,
  formatMoney,
} from "../services/dataService.js";

import "../App.css";

const STORAGE_KEY = "radar-monthly-goals";

const defaultGoals = {
  Ana: 50000,
  Carlos: 45000,
  Mariana: 55000,
};

function currentMonth() {
  const date = new Date();

  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1)
      .padStart(2, "0")
  );
}

function loadGoals() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}"
    );

    if (
      saved &&
      typeof saved === "object" &&
      !Array.isArray(saved)
    ) {
      return saved;
    }

    return {};
  } catch {
    return {};
  }
}

function percentage(value) {
  return value
    .toFixed(1)
    .replace(".", ",") + "%";
}

export default function Metas() {
  const [leads] = useState(() => getLeads());

  const [savedGoals, setSavedGoals] =
    useState(loadGoals);

  const [month, setMonth] =
    useState(currentMonth);

  const [editing, setEditing] =
    useState(false);

  const [draft, setDraft] =
    useState({});

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const sellers = [
    ...new Set([
      ...Object.keys(defaultGoals),
      ...leads.map((lead) => lead.seller),
      ...Object.keys(savedGoals[month] || {}),
    ]),
  ].filter(Boolean);

  const goals =
    savedGoals[month] || {};

  const allSales = getSales(leads);

  const sales = allSales.filter(
    (sale) =>
      String(sale.closedAt || "")
        .slice(0, 7) === month
  );

  const missingDates = allSales.filter(
    (sale) => !sale.closedAt
  ).length;

  const performance = sellers.map(
    (seller) => {
      const target =
        Number(goals[seller]) || 0;

      const sellerSales = sales.filter(
        (sale) => sale.seller === seller
      );

      const revenue = sellerSales.reduce(
        (total, sale) =>
          total + (Number(sale.value) || 0),
        0
      );

      return {
        seller,
        target,
        revenue,
        sales: sellerSales.length,

        percentage:
          target > 0
            ? (revenue / target) * 100
            : 0,

        remaining:
          Math.max(target - revenue, 0),

        hasGoal: target > 0,
      };
    }
  );

  const configured = performance.filter(
    (item) => item.hasGoal
  );

  const ranking = [...configured].sort(
    (a, b) =>
      b.percentage - a.percentage
  );

  const totalTarget = configured.reduce(
    (total, item) =>
      total + item.target,
    0
  );

  const totalRevenue = performance.reduce(
    (total, item) =>
      total + item.revenue,
    0
  );

  const goalRevenue = configured.reduce(
    (total, item) =>
      total + item.revenue,
    0
  );

  const totalPercentage =
    totalTarget > 0
      ? (goalRevenue / totalTarget) * 100
      : 0;

  const remaining = Math.max(
    totalTarget - goalRevenue,
    0
  );

  const achieved = configured.filter(
    (item) => item.percentage >= 100
  ).length;

  function changeMonth(event) {
    if (!event.target.value) return;

    setMonth(event.target.value);
    setEditing(false);
    setMessage("");
    setError("");
  }

  function openEditor() {
    const values = {};

    sellers.forEach((seller) => {
      values[seller] =
        goals[seller] ?? "";
    });

    setDraft(values);
    setEditing(true);
    setMessage("");
    setError("");
  }

  function useSuggestedGoals() {
    setDraft((previous) => ({
      ...previous,
      ...defaultGoals,
    }));
  }

  function saveGoals(event) {
    event.preventDefault();

    const updatedGoals = {};

    for (const seller of sellers) {
      const value = draft[seller];

      if (
        value === "" ||
        value === undefined
      ) {
        continue;
      }

      const target = Number(value);

      if (
        !Number.isFinite(target) ||
        target < 0
      ) {
        setError(
          "Informe valores válidos para as metas."
        );

        return;
      }

      if (target > 0) {
        updatedGoals[seller] = target;
      }
    }

    const updated = {
      ...savedGoals,
      [month]: updatedGoals,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setSavedGoals(updated);
      setEditing(false);
      setError("");

      setMessage(
        "Metas comerciais salvas com sucesso!"
      );
    } catch {
      setError(
        "Não foi possível salvar as metas."
      );
    }
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Metas Comerciais</h1>

          <p>
            Acompanhe os objetivos e o
            desempenho da equipe de vendas.
          </p>
        </div>

        <div className="report-actions">
  <button
    className="secondary-button"
    onClick={() =>
      exportGoalsCSV(performance, month)
    }
    disabled={performance.length === 0}
  >
    <Download size={18} />
    Exportar CSV
  </button>

  <button
    className="primary-button"
    onClick={openEditor}
  >
    <Pencil size={18} />
    Configurar metas
  </button>
</div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Período de acompanhamento</h2>

            <p>
              Selecione o mês de análise.
            </p>
          </div>

          <Calendar size={22} />
        </div>

        <div className="goal-period">
          <label>
            Mês de referência

            <input
              type="month"
              value={month}
              onChange={changeMonth}
            />
          </label>
        </div>

        {missingDates > 0 && (
          <p className="metric-description">
            Existem {missingDates} venda(s)
            sem data de fechamento.
            Esses registros não entram
            nas metas mensais.
          </p>
        )}
      </section>

      {message && (
        <div
          className="lead-success"
          role="status"
        >
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {error && (
        <div
          className="lead-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {editing && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Configurar metas individuais</h2>

              <p>
                Defina os objetivos mensais
                de cada vendedor.
              </p>
            </div>
          </div>

          <form onSubmit={saveGoals}>
            <div className="goal-editor">
              {sellers.map((seller) => (
                <label key={seller}>
                  Meta de {seller} (R$)

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Sem meta"
                    value={draft[seller] ?? ""}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        [seller]:
                          event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <p className="metric-description">
              Deixe o campo vazio ou informe
              zero para remover uma meta.
            </p>

            <div className="goal-editor-actions">
              <button
                type="submit"
                className="primary-button"
              >
                <Save size={18} />
                Salvar metas
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={useSuggestedGoals}
              >
                Usar metas de exemplo
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="stats-grid">
        <GoalCard
          title="Meta da equipe"
          value={formatMoney(totalTarget)}
          icon={<Target size={22} />}
        />

        <GoalCard
          title="Faturamento realizado"
          value={formatMoney(totalRevenue)}
          icon={<DollarSign size={22} />}
        />

        <GoalCard
          title="Atingimento geral"
          value={
            totalTarget > 0
              ? percentage(totalPercentage)
              : "—"
          }
          icon={<TrendingUp size={22} />}
        />

        <GoalCard
          title="Metas atingidas"
          value={
            achieved +
            " de " +
            configured.length
          }
          icon={<Trophy size={22} />}
        />
      </section>

      <section className="panel goal-overview">
        <div className="panel-header">
          <div>
            <h2>Progresso da equipe</h2>

            <p>
              Resultado dos vendedores
              com metas configuradas
            </p>
          </div>

          <strong>
            {totalTarget > 0
              ? percentage(totalPercentage)
              : "Sem meta"}
          </strong>
        </div>

        <ProgressBar
          value={totalPercentage}
        />

        <div className="goal-summary">
          <span>
            Realizado: {formatMoney(goalRevenue)}
          </span>

          <span>
            Meta: {formatMoney(totalTarget)}
          </span>
        </div>

        <p className="goal-remaining">
          {totalTarget === 0
            ? "Configure as metas para acompanhar o desempenho."
            : remaining === 0
              ? "Parabéns! Meta geral atingida."
              : `Faltam ${formatMoney(remaining)} para atingir a meta da equipe.`}
        </p>
      </section>

      <section className="panel goal-overview">
        <div className="panel-header">
          <div>
            <h2>Desempenho individual</h2>

            <p>
              Resultados mensais por vendedor
            </p>
          </div>
        </div>

        <div className="seller-goals">
          {performance.map((item) => (
            <div
              className="seller-goal-card"
              key={item.seller}
            >
              <div className="seller-goal-header">
                <div className="seller-avatar">
                  {item.seller
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>{item.seller}</strong>

                  <p>
                    {item.sales} venda(s)
                    realizada(s)
                  </p>
                </div>

                <span className="goal-percentage">
                  {item.hasGoal
                    ? percentage(item.percentage)
                    : "—"}
                </span>
              </div>

              <ProgressBar
                value={item.percentage}
              />

              <div className="goal-summary">
                <span>
                  {formatMoney(item.revenue)}
                </span>

                <span>
                  {item.hasGoal
                    ? formatMoney(item.target)
                    : "Sem meta"}
                </span>
              </div>

              <p className="goal-remaining">
                {!item.hasGoal
                  ? "Meta não configurada."
                  : item.percentage >= 100
                    ? "Meta atingida!"
                    : "Faltam " +
                      formatMoney(item.remaining)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Ranking de vendedores</h2>

            <p>
              Classificação por atingimento
              da meta individual
            </p>
          </div>

          <Trophy
            size={24}
            color="#00c853"
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Vendedor</th>
                <th>Meta</th>
                <th>Realizado</th>
                <th>Atingimento</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {ranking.map((item, index) => {
                const position =
                  ranking.findIndex(
                    (seller) =>
                      seller.percentage ===
                      item.percentage
                  ) + 1;

                return (
                  <tr key={item.seller}>
                    <td>
                      <span
                        className={
                          "rank-badge rank-" +
                          position
                        }
                      >
                        {position}º
                      </span>
                    </td>

                    <td>{item.seller}</td>

                    <td>
                      {formatMoney(item.target)}
                    </td>

                    <td className="value-cell">
                      {formatMoney(item.revenue)}
                    </td>

                    <td>
                      {percentage(item.percentage)}
                    </td>

                    <td>
                      <span
                        className={
                          "status " +
                          (item.percentage >= 100
                            ? "closed"
                            : "negotiation")
                        }
                      >
                        {item.percentage >= 100
                          ? "Atingida"
                          : "Em andamento"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {ranking.length === 0 && (
            <p className="empty">
              Configure as metas para
              visualizar o ranking.
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
            Insight de desempenho
          </strong>

          <p>
            {ranking.length === 0
              ? "Configure os objetivos mensais para gerar insights."
              : goalRevenue === 0
                ? "Ainda não existem vendas contabilizadas para os vendedores com metas neste período."
                : `${ranking
                    .filter(
                      (item) =>
                        item.percentage ===
                        ranking[0].percentage
                    )
                    .map((item) => item.seller)
                    .join(" e ")} lidera(m) o ranking com ${percentage(ranking[0].percentage)} de atingimento da meta.`}
          </p>
        </div>
      </section>
    </div>
  );
}

function GoalCard({
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

function ProgressBar({ value }) {
  return (
    <div
      className="goal-progress"
      role="progressbar"
      aria-label="Atingimento da meta"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={
        Math.max(0, Math.min(value, 100))
      }
      aria-valuetext={percentage(value)}
    >
      <div
        className="goal-progress-fill"
        style={{
          width:
            Math.max(
              0,
              Math.min(value, 100)
            ) + "%",

          backgroundColor:
            value >= 100
              ? "#00e676"
              : "#00a854",
        }}
      />
    </div>
  );
}
