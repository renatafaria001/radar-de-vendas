
import Papa from "papaparse";

const statuses = [
  "Novo lead",
  "Qualificado",
  "Em negociação",
  "Fechado",
];

const requiredColumns = [
  "empresa",
  "email",
  "origem",
  "vendedor",
  "valor",
  "status",
  "data de cadastro",
  "data de fechamento",
];

function normalize(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseMoney(value) {
  let text = String(value ?? "")
    .replace(/R\$/gi, "")
    .replace(/\s/g, "");

  if (text.includes(",")) {
    if (!/^\d+(?:\.\d{3})*,\d{1,2}$/.test(text)) {
      return NaN;
    }

    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    return NaN;
  }

  return Number(text);
}

function parseDate(value) {
  let text = String(value ?? "").trim();

  if (!text) return "";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");
    text = `${year}-${month}-${day}`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(text + "T00:00:00Z");

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    return null;
  }

  return text;
}

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function duplicateKey(lead) {
  return JSON.stringify([
    normalize(lead.name),
    normalize(lead.email),
    normalize(lead.seller),
    normalize(lead.source),
    Number(lead.value),
    normalize(lead.status),
    lead.date || "",
    lead.closedAt || "",
  ]);
}

export function importLeadsCSV(file, existingLeads = []) {
  return new Promise((resolve, reject) => {
    if (!file || !file.name.toLowerCase().endsWith(".csv")) {
      reject(new Error("Selecione um arquivo CSV."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("O arquivo deve ter até 5 MB."));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      encoding: "UTF-8",

      transformHeader: normalize,

      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error("O CSV possui erros de estrutura.");
          }

          const columns = results.meta.fields || [];

          const missing = requiredColumns.filter(
            (column) => !columns.includes(column)
          );

          if (missing.length > 0) {
            throw new Error(
              "Colunas ausentes: " + missing.join(", ")
            );
          }

          const valid = [];
          const errors = [];
          const duplicates = [];

          const keys = new Set(
            existingLeads.map(duplicateKey)
          );

          const ids = new Set(
            existingLeads.map((lead) => String(lead.id))
          );

          results.data.forEach((row, index) => {
            const lead = {
              id: String(row.id || "").trim() || crypto.randomUUID(),
              name: String(row.empresa || "").trim(),
              email: String(row.email || "").trim(),
              source: String(row.origem || "").trim(),
              seller: String(row.vendedor || "").trim(),
              value: parseMoney(row.valor),
              status: statuses.find(
                (status) => normalize(status) === normalize(row.status)
              ),
              date: parseDate(row["data de cadastro"]),
              closedAt: parseDate(row["data de fechamento"]),
            };

            const reasons = [];

            if (!lead.name) {
              reasons.push("Empresa não informada");
            }

            if (
              lead.email &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)
            ) {
              reasons.push("E-mail inválido");
            }

            if (!lead.seller || !lead.source) {
              reasons.push("Vendedor ou origem não informado");
            }

            if (!Number.isFinite(lead.value) || lead.value < 0) {
              reasons.push("Valor inválido");
            }

            if (!lead.status) {
              reasons.push("Status inválido");
            }

            if (!lead.date || lead.date > today()) {
              reasons.push("Data de cadastro inválida");
            }

            if (
              lead.closedAt === null ||
              (lead.closedAt && lead.closedAt > today())
            ) {
              reasons.push("Data de fechamento inválida");
            }

            if (lead.status === "Fechado" && !lead.closedAt) {
              reasons.push("Fechamento não informado");
            }

            if (lead.status !== "Fechado" && lead.closedAt) {
              reasons.push("Lead aberto com data de fechamento");
            }

            if (
              lead.closedAt &&
              lead.date &&
              lead.closedAt < lead.date
            ) {
              reasons.push("Fechamento anterior ao cadastro");
            }

            if (reasons.length > 0) {
              errors.push({
                record: index + 1,
                name: lead.name,
                reason: reasons.join("; "),
              });

              return;
            }

            const key = duplicateKey(lead);

            if (keys.has(key) || ids.has(lead.id)) {
              duplicates.push({
                record: index + 1,
                name: lead.name,
                reason: "Registro duplicado",
              });

              return;
            }

            keys.add(key);
            ids.add(lead.id);
            valid.push(lead);
          });

          resolve({
            total: results.data.length,
            valid,
            errors,
            duplicates,
          });
        } catch (error) {
          reject(error);
        }
      },

      error: reject,
    });
  });
}
