export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function localizeName(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return game.i18n.has(str) ? game.i18n.localize(str) : str;
}

export function sortCurrencies(list) {
  return [...(list ?? [])].sort((a, b) => Number(b.value) - Number(a.value));
}

export function dollarsToCoins(amount, currencies) {
  const list = sortCurrencies(currencies);
  let remaining = round(Number(amount) || 0, 4);
  const parts = list.map((currency) => {
    const value = Number(currency.value) || 0;
    const count = value > 0 ? Math.floor(round(remaining / value, 6)) : 0;
    remaining = round(remaining - count * value, 4);
    return { id: currency.id, currency, count, value };
  });
  return { parts, remainder: remaining };
}

export function coinsToDollars(coins, currencies) {
  let total = 0;
  for (const currency of currencies ?? []) {
    const count = Number(coins?.[currency.id]) || 0;
    total += count * (Number(currency.value) || 0);
  }
  return round(total, 2);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeColor(value) {
  const str = String(value ?? "").trim();
  return /^[#a-zA-Z0-9(),.%\s-]+$/.test(str) ? str : "";
}

const DEFAULT_CURRENCY_COLORS = {
  gold: "#d4af37",
  silver: "#c0c0c0",
  copper: "#b87333"
};

export function resolveCurrencyColor(currency) {
  if (!currency) return "";
  return safeColor(currency.color) || DEFAULT_CURRENCY_COLORS[currency.id] || "";
}

export function formatCoins(parts, currencies, { emptyText = "0" } = {}) {
  const byId = new Map((currencies ?? []).map((c) => [c.id, c]));
  const numberFormat = new Intl.NumberFormat(game.i18n.lang, { maximumFractionDigits: 0 });
  const chunks = [];
  for (const part of parts ?? []) {
    const value = Number(part.count);
    if (!value) continue;
    const currency = byId.get(part.id) ?? part.currency;
    const abbr = escapeHtml(currency ? localizeName(currency.abbr) : part.id);
    const color = resolveCurrencyColor(currency);
    const count = numberFormat.format(value);
    chunks.push(color
      ? `${count}<span style="color:${color}">${abbr}</span>`
      : `${count}${abbr}`);
  }
  return chunks.length ? chunks.join(" ") : escapeHtml(emptyText);
}

export function formatCoinsFromDollars(amount, currencies, options) {
  const { parts, remainder } = dollarsToCoins(amount, currencies);
  const hasParts = (parts ?? []).some((part) => Number(part.count));
  let text = formatCoins(parts, currencies, options);
  if (remainder && Math.abs(remainder) > 0.0001) {
    const tail = formatDollars(remainder);
    text = hasParts ? `${text} + ${tail}` : tail;
  }
  return text;
}

export function findReactionTier(total, table) {
  const value = Number(total);
  return (table ?? []).find((row) => value >= Number(row.min) && value <= Number(row.max)) ?? null;
}

export function reactionMultiplier(tier, side) {
  if (!tier) return null;
  const percent = tier[side];
  if (percent === null || percent === undefined || percent === "") return null;
  return Number(percent) / 100;
}

export function applyMultiplier(base, multiplier) {
  if (multiplier === null || multiplier === undefined) return null;
  return round(Number(base) * multiplier, 2);
}

export function formatMultiplier(multiplier) {
  if (multiplier === null || multiplier === undefined) {
    return game.i18n.localize("GPH.Reaction.NoDeal");
  }
  const percent = round(multiplier * 100, 2);
  const number = new Intl.NumberFormat(game.i18n.lang, { maximumFractionDigits: 2 }).format(percent);
  return `${number}%`;
}

export function formatDollars(amount) {
  const value = round(Number(amount) || 0, 2);
  return `$${new Intl.NumberFormat(game.i18n.lang, { maximumFractionDigits: 2 }).format(value)}`;
}

export function reactionTierColor(tier, table) {
  const list = table ?? [];
  const n = list.length;
  let idx = tier ? list.indexOf(tier) : -1;
  if (idx < 0 && tier && tier.id !== undefined) idx = list.findIndex((r) => r.id === tier.id);
  if (idx < 0 && tier) {
    idx = list.findIndex((r) => Number(r.min) === Number(tier.min) && Number(r.max) === Number(tier.max));
  }
  if (idx < 0 || n <= 1) return "var(--color-text-hyperlink, #782e22)";
  const t = idx / (n - 1);
  const hue = 28 + t * (130 - 28);
  const sat = 58 + t * (14);
  const light = 42 + t * (36);
  return `hsl(${Math.round(hue)} ${Math.round(sat)}% ${Math.round(light)}%)`;
}

export function statusHeaderColor(status) {
  const s = Number(status) || 0;
  if (s === 0) return "#ffffff";
  if (s < 0) {
    const t = Math.min(Math.abs(s) / 2, 1);
    return `hsl(28 ${Math.round(t * 65)}% ${Math.round(100 - t * 55)}%)`;
  }
  const t = Math.min(s / 8, 1);
  const hue = 120 + t * 10;
  const sat = Math.round(30 + t * 55);
  const light = Math.round(90 - t * 35);
  return `hsl(${Math.round(hue)} ${sat}% ${light}%)`;
}

export function priceFor(monthly, category) {
  return round((Number(monthly) || 0) * (Number(category.percent) || 0) / 100, 2);
}
