
const STORAGE_KEY = "radar-leads";

export function getLeads() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveLeads(leads) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(leads)
  );
}

export function getSales(leads = getLeads()) {
  return leads.filter(
    (lead) => lead.status === "Fechado"
  );
}

export function getMetrics(leads = getLeads()) {
  const sales = getSales(leads);

  const revenue = sales.reduce(
    (total, sale) =>
      total + (Number(sale.value) || 0),
    0
  );

  const totalLeads = leads.length;
  const totalSales = sales.length;

  const conversionRate =
    totalLeads > 0
      ? (totalSales / totalLeads) * 100
      : 0;

  const averageTicket =
    totalSales > 0
      ? revenue / totalSales
      : 0;

  return {
    revenue,
    totalLeads,
    totalSales,
    conversionRate,
    averageTicket,
  };
}

export function getFunnelData(leads = getLeads()) {
  const statuses = [
    "Novo lead",
    "Qualificado",
    "Em negociação",
    "Fechado",
  ];

  return statuses.map((status) => ({
    name: status,
    value: leads.filter(
      (lead) => lead.status === status
    ).length,
  }));
}

export function getSellerPerformance(
  leads = getLeads()
) {
  const sellers = [
    ...new Set(leads.map((lead) => lead.seller)),
  ].filter(Boolean);

  return sellers.map((seller) => {
    const sellerLeads = leads.filter(
      (lead) => lead.seller === seller
    );

    return {
      name: seller,
      ...getMetrics(sellerLeads),
    };
  });
}

export function getSourcePerformance(
  leads = getLeads()
) {
  const sources = [
    ...new Set(leads.map((lead) => lead.source)),
  ].filter(Boolean);

  return sources.map((source) => {
    const sourceLeads = leads.filter(
      (lead) => lead.source === source
    );

    return {
      name: source,
      ...getMetrics(sourceLeads),
    };
  });
}

export function formatMoney(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// FILTRAR LEADS POR PERIODO

export function filterByPeriod(
  leads,
  startDate,
  endDate
) {
  return leads.filter((lead) => {
    if (!startDate && !endDate) return true;

    if (!lead.date) return false;

    const date = String(lead.date).slice(0, 10);

    if (startDate && date < startDate) {
      return false;
    }

    if (endDate && date > endDate) {
      return false;
    }

    return true;
  });
}

// CALCULAR FATURAMENTO MENSAL

export function getMonthlyRevenue(
  leads = getLeads(),
  year = new Date().getFullYear()
) {
  const months = [
    "Jan", "Fev", "Mar", "Abr",
    "Mai", "Jun", "Jul", "Ago",
    "Set", "Out", "Nov", "Dez",
  ];

  const monthlyData = months.map((month) => ({
    month,
    revenue: 0,
    sales: 0,
  }));

  const sales = getSales(leads);

  sales.forEach((sale) => {
    if (!sale.closedAt) return;

    const date = String(sale.closedAt);
    const saleYear = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7)) - 1;

    if (
      saleYear !== Number(year) ||
      !Number.isInteger(month) ||
      month < 0 ||
      month > 11
    ) {
      return;
    }

    monthlyData[month].revenue +=
      Number(sale.value) || 0;

    monthlyData[month].sales += 1;
  });

  return monthlyData;
}

// CALCULAR TAXA DE CONVERSAO POR CANAL

export function getChannelConversion(
  leads = getLeads()
) {
  return getSourcePerformance(leads)
    .sort(
      (a, b) =>
        b.conversionRate - a.conversionRate
    );
}

// CALCULAR VALOR DO PIPELINE

export function getPipelineValue(
  leads = getLeads()
) {
  return leads
    .filter((lead) =>
      [
        "Novo lead",
        "Qualificado",
        "Em negociação",
      ].includes(lead.status)
    )
    .reduce(
      (total, lead) =>
        total + (Number(lead.value) || 0),
      0
    );
}
