
import { useState, useEffect } from "react";

import {
  Plus,
  Upload,
  Download,
  Search,
  Pencil,
  Trash2,
  Users,
  Target,
  DollarSign,
  CheckCircle,
} from "lucide-react";

import {
  getLeads,
  saveLeads,
  getPipelineValue,
  formatMoney,
} from "../services/dataService.js";

import ImportCSV from "../components/ImportCSV.jsx";
import { exportLeadsCSV } from "../services/csvService.js";
import "../App.css";

const statuses = [
  "Novo lead",
  "Qualificado",
  "Em negociação",
  "Fechado",
];

const emptyForm = {
  name: "",
  email: "",
  source: "Google",
  seller: "Ana",
  value: "",
  status: "Novo lead",
  date: "",
  closedAt: "",
};

function today() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "Não registrada";

  const parts = String(value)
    .slice(0, 10)
    .split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function Leads() {
  const [leads, setLeads] = useState(
    () => getLeads()
  );

  const [showImport, setShowImport] = useState(false);

  function handleImport(records) {
    const next = [...leads, ...records];
    saveLeads(next);
    setLeads(next);
    setSearch("");
    setStatusFilter("Todos");
    setError("");
    setMessage(`${records.length} leads importados com sucesso!`);
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("Todos");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      saveLeads(leads);
    } catch {
      setError(
        "Não foi possível salvar os dados no navegador."
      );
    }
  }, [leads]);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function openForm() {
    setShowImport(false);
    setForm({
      ...emptyForm,
      date: today(),
    });

    setEditingId(null);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function saveLead(event) {
    event.preventDefault();

    const value = Number(form.value);

    if (
      !form.name.trim() ||
      form.value === "" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      setError(
        "Preencha os campos corretamente."
      );

      return;
    }

    const previous = leads.find(
      (item) => item.id === editingId
    );

    const date =
      form.date ||
      previous?.date ||
      "";

    let closedAt = "";

    if (form.status === "Fechado") {
      closedAt =
        form.closedAt ||
        previous?.closedAt ||
        "";
    }

    if (date && date > today()) {
      setError(
        "A data de cadastro não pode ser futura."
      );
      return;
    }

    if (closedAt && closedAt > today()) {
      setError(
        "A data de fechamento não pode ser futura."
      );
      return;
    }

    if (
      closedAt &&
      date &&
      closedAt < date
    ) {
      setError(
        "O fechamento não pode ocorrer antes do cadastro."
      );
      return;
    }

    const lead = {
      ...previous,
      ...form,
      id:
        editingId === null
          ? crypto.randomUUID()
          : editingId,
      name: form.name.trim(),
      email: form.email.trim(),
      value,
      date,
      closedAt,
    };

    if (editingId !== null) {
      setLeads((current) =>
        current.map((item) =>
          item.id === editingId
            ? lead
            : item
        )
      );

      setMessage(
        "Lead atualizado com sucesso!"
      );
    } else {
      setLeads((current) => [
        ...current,
        lead,
      ]);

      setMessage(
        "Lead cadastrado com sucesso!"
      );
    }

    closeForm();
  }

  function editLead(lead) {
    setShowImport(false);
    setForm({
      ...emptyForm,
      ...lead,
      date: lead.date || "",
      closedAt: lead.closedAt || "",
    });

    setEditingId(lead.id);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function deleteLead(id) {
    if (
      window.confirm(
        "Deseja excluir este lead?"
      )
    ) {
      setLeads((current) =>
        current.filter(
          (lead) => lead.id !== id
        )
      );

      if (editingId === id) {
        closeForm();
      }

      setMessage(
        "Lead excluído com sucesso!"
      );
    }
  }

  function changeStatus(event) {
    const status = event.target.value;

    setForm((previous) => ({
      ...previous,
      status,
      closedAt:
        status === "Fechado"
          ? previous.closedAt ||
            (previous.status !== "Fechado"
              ? today()
              : "")
          : "",
    }));

    setError("");
  }

  const filtered = leads.filter((lead) => {
    const text = [
      lead.name,
      lead.email,
      lead.source,
      lead.seller,
      lead.status,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(
      search.toLowerCase()
    );

    const matchesStatus =
      statusFilter === "Todos" ||
      lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalClosed = leads.filter(
    (lead) => lead.status === "Fechado"
  ).length;

  const totalNegotiation = leads.filter(
    (lead) =>
      lead.status === "Em negociação"
  ).length;

  const pipelineValue =
    getPipelineValue(leads);

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>Gerenciamento de Leads</h1>
          <p>
            Cadastre e acompanhe suas
            oportunidades comerciais.
          </p>
        </div>

        <div className="report-actions">
          <button className="secondary-button" onClick={() => {
            closeForm();
            setMessage("");
            setShowImport(true);
          }}>
            <Upload size={18} /> Importar CSV
          </button>
          <button className="secondary-button" disabled={!filtered.length} onClick={() => exportLeadsCSV(filtered)}>
            <Download size={18} /> Exportar CSV
          </button>
          <button className="primary-button" onClick={openForm}>
            <Plus size={18} /> Novo lead
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <LeadCard
          title="Total de leads"
          value={leads.length}
          icon={<Users size={22} />}
        />

        <LeadCard
          title="Em negociação"
          value={totalNegotiation}
          icon={<Target size={22} />}
        />

        <LeadCard
          title="Vendas fechadas"
          value={totalClosed}
          icon={<CheckCircle size={22} />}
        />

        <LeadCard
          title="Pipeline em aberto"
          value={formatMoney(pipelineValue)}
          icon={<DollarSign size={22} />}
        />
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

      {showImport && (
        <ImportCSV leads={leads} onImport={handleImport} onClose={() => setShowImport(false)} />
      )}

      {showForm && (
        <section className="panel lead-form-panel">
          <h2>
            {editingId !== null
              ? "Editar lead"
              : "Cadastrar novo lead"}
          </h2>

          <form
            className="lead-form"
            onSubmit={saveLead}
          >
            <label>
              Nome da empresa

              <input
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="Ex.: Alpha Tech"
                required
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateForm}
                placeholder="contato@empresa.com"
              />
            </label>

            <label>
              Origem

              <select
                name="source"
                value={form.source}
                onChange={updateForm}
              >
                {[...new Set(["Google", "Instagram", "LinkedIn", "Indicação", "Outros", ...leads.map(l => l.source), form.source])].filter(Boolean).map(source => <option key={source}>{source}</option>)}
              </select>
            </label>

            <label>
              Vendedor

              <select
                name="seller"
                value={form.seller}
                onChange={updateForm}
              >
                {[...new Set(["Ana", "Carlos", "Mariana", ...leads.map(l => l.seller), form.seller])].filter(Boolean).map(seller => <option key={seller}>{seller}</option>)}
              </select>
            </label>

            <label>
              Valor da oportunidade (R$)

              <input
                type="number"
                name="value"
                min="0"
                step="0.01"
                value={form.value}
                onChange={updateForm}
                required
              />
            </label>

            <label>
              Status

              <select
                name="status"
                value={form.status}
                onChange={changeStatus}
              >
                {statuses.map((status) => (
                  <option key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Data de cadastro

              <input
                type="date"
                name="date"
                value={form.date}
                max={today()}
                onChange={updateForm}
                required={editingId === null}
              />
            </label>

            {form.status === "Fechado" && (
              <label>
                Data de fechamento

                <input
                  type="date"
                  name="closedAt"
                  value={form.closedAt}
                  min={form.date || undefined}
                  max={today()}
                  onChange={updateForm}
                />
              </label>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
              >
                Salvar lead
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Base de leads</h2>

            <p>
              {filtered.length} registros
              encontrados
            </p>
          </div>
        </div>

        <div className="filters">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar lead..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            aria-label="Filtrar por status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="Todos">
              Todos os status
            </option>

            {statuses.map((status) => (
              <option key={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>E-mail</th>
                <th>Origem</th>
                <th>Vendedor</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Fechamento</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.source}</td>
                  <td>{lead.seller}</td>

                  <td className="value-cell">
                    {formatMoney(
                      Number(lead.value) || 0
                    )}
                  </td>

                  <td>
                    <LeadStatus
                      status={lead.status}
                    />
                  </td>

                  <td>
                    {formatDate(lead.date)}
                  </td>

                  <td>
                    {lead.status === "Fechado"
                      ? formatDate(
                          lead.closedAt
                        )
                      : "—"}
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="edit-button"
                        aria-label="Editar lead"
                        onClick={() =>
                          editLead(lead)
                        }
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-button"
                        aria-label="Excluir lead"
                        onClick={() =>
                          deleteLead(lead.id)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="empty">
              Nenhum lead encontrado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function LeadCard({
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

function LeadStatus({ status }) {
  const classes = {
    "Novo lead": "new",
    Qualificado: "qualified",
    "Em negociação": "negotiation",
    Fechado: "closed",
  };

  return (
    <span
      className={
        "status " +
        (classes[status] || "new")
      }
    >
      {status}
    </span>
  );
}
