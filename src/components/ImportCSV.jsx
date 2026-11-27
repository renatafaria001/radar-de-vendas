
import { useState } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

import { importLeadsCSV } from "../services/importService.js";
import { downloadCSV } from "../services/csvService.js";
import { formatMoney } from "../services/dataService.js";

export default function ImportCSV({
  leads,
  onImport,
  onClose,
}) {
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const data = await importLeadsCSV(file, leads);
      setResult(data);
    } catch (err) {
      setError(err.message || "Erro ao ler o arquivo.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function downloadTemplate() {
    downloadCSV(
      [
        "Empresa",
        "Email",
        "Origem",
        "Vendedor",
        "Valor",
        "Status",
        "Data de cadastro",
        "Data de fechamento",
      ],
      [
        [
          "Empresa Exemplo",
          "contato@example.com",
          "Google",
          "Ana",
          "15000,00",
          "Novo lead",
          "2026-01-01",
          "",
        ],
      ],
      "technoverso-modelo-importacao.csv"
    );
  }

  async function confirmImport() {
    if (!result?.valid.length || loading) return;

    setLoading(true);
    setError("");

    try {
      await onImport(result.valid);
      onClose();
    } catch {
      setError("Não foi possível salvar os registros.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel import-panel">
      <div className="panel-header">
        <div>
          <h2>Importar base de dados</h2>
          <p>Adicione leads através de um arquivo CSV.</p>
        </div>

        <button
          className="secondary-button"
          onClick={onClose}
          disabled={loading}
          aria-label="Fechar importação"
        >
          <X size={18} />
        </button>
      </div>

      <button
        className="secondary-button"
        onClick={downloadTemplate}
      >
        <Download size={18} />
        Baixar modelo CSV
      </button>

      <label className="upload-area">
        <Upload size={36} />

        <strong>
          {loading
            ? "Processando..."
            : "Selecionar arquivo CSV"}
        </strong>

        <span>Formato CSV - Até 5 MB</span>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {fileName && (
        <div className="import-file">
          <FileSpreadsheet size={20} />
          {fileName}
        </div>
      )}

      {error && (
        <p className="lead-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <>
          <div className="import-stats">
            <ImportStat
              title="Total de registros"
              value={result.total}
            />

            <ImportStat
              title="Registros válidos"
              value={result.valid.length}
              color="import-valid"
            />

            <ImportStat
              title="Duplicados"
              value={result.duplicates.length}
              color="import-warning"
            />

            <ImportStat
              title="Registros inválidos"
              value={result.errors.length}
              color="import-invalid"
            />
          </div>

          {result.valid.length > 0 && (
            <div>
              <h3>Pré-visualização</h3>

              <p className="metric-description">
                Primeiros 10 registros válidos.
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Vendedor</th>
                      <th>Origem</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.valid.slice(0, 10).map((lead) => (
                      <tr key={lead.id}>
                        <td>{lead.name}</td>
                        <td>{lead.seller}</td>
                        <td>{lead.source}</td>
                        <td>{formatMoney(lead.value)}</td>
                        <td>{lead.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.errors.length +
            result.duplicates.length > 0 && (
            <div className="import-issues">
              <h3>
                <AlertTriangle size={18} />
                Registros ignorados
              </h3>

              <p>
                Estes registros não serão importados.
              </p>

              {[
                ...result.errors,
                ...result.duplicates,
              ].slice(0, 20).map((item) => (
                <p key={item.record}>
                  Registro {item.record}:{" "}
                  {item.name || "Sem nome"} - {item.reason}
                </p>
              ))}

              {result.errors.length +
                result.duplicates.length > 20 && (
                <p>Apenas os primeiros 20 avisos são exibidos.</p>
              )}
            </div>
          )}

          <div className="report-actions">
            <button
              className="primary-button"
              disabled={result.valid.length === 0 || loading}
              onClick={confirmImport}
            >
              <CheckCircle size={18} />
              Importar {result.valid.length} registros
            </button>

            <button
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ImportStat({ title, value, color }) {
  return (
    <div className="import-stat">
      <span>{title}</span>
      <strong className={color || ""}>
        {value}
      </strong>
    </div>
  );
}
