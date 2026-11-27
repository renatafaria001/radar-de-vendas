
function csvCell(value) {
  let text = String(value ?? "");

  // Proteção contra fórmulas maliciosas
  if (
    /^[\s]*[=+\-@]/.test(text) ||
    /^[\t\r\n]/.test(text)
  ) {
    text = "'" + text;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

function formatValue(value) {
  return (Number(value) || 0)
    .toFixed(2)
    .replace(".", ",");
}

export function downloadCSV(
  headers,
  rows,
  filename
) {
  const csv = [headers, ...rows]
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

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function exportLeadsCSV(leads) {
  const headers = [
    "ID",
    "Empresa",
    "Email",
    "Origem",
    "Vendedor",
    "Valor",
    "Status",
    "Data de cadastro",
    "Data de fechamento",
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.name,
    lead.email,
    lead.source,
    lead.seller,
    formatValue(lead.value),
    lead.status,
    lead.date || "",
    lead.closedAt || "",
  ]);

  downloadCSV(
    headers,
    rows,
    "technoverso-leads.csv"
  );
}

export function exportSalesCSV(sales) {
  const headers = [
    "Empresa",
    "Vendedor",
    "Origem",
    "Valor",
    "Status",
    "Data de cadastro",
    "Data de fechamento",
  ];

  const rows = sales.map((sale) => [
    sale.name,
    sale.seller,
    sale.source,
    formatValue(sale.value),
    sale.status,
    sale.date || "",
    sale.closedAt || "",
  ]);

  downloadCSV(
    headers,
    rows,
    "technoverso-vendas.csv"
  );
}

export function exportGoalsCSV(
  performance,
  month
) {
  const headers = [
    "Periodo",
    "Vendedor",
    "Meta",
    "Faturamento",
    "Atingimento (%)",
    "Valor restante",
    "Status",
  ];

  const rows = performance.map((item) => [
    month,
    item.seller,
    item.hasGoal
      ? formatValue(item.target)
      : "",
    formatValue(item.revenue),
    item.hasGoal
      ? item.percentage
          .toFixed(2)
          .replace(".", ",")
      : "",
    item.hasGoal
      ? formatValue(item.remaining)
      : "",
    !item.hasGoal
      ? "Sem meta"
      : item.percentage >= 100
        ? "Atingida"
        : "Em andamento",
  ]);

  downloadCSV(
    headers,
    rows,
    `technoverso-metas-${month}.csv`
  );
}
