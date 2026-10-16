export const MODULE_ID = "gurps-price-helper";

export const CURRENCIES = "currencies";
export const CATEGORIES = "categories";
export const STATUSES = "statuses";
export const REACTION = "reaction";
export const ALLOW_PLAYERS = "allowPlayers";

export const DEFAULT_CURRENCIES = [
  { id: "gold", name: "GPH.Currency.Gold", abbr: "GPH.Currency.GoldAbbr", value: 80, color: "#d4af37" },
  { id: "silver", name: "GPH.Currency.Silver", abbr: "GPH.Currency.SilverAbbr", value: 4, color: "#c0c0c0" },
  { id: "copper", name: "GPH.Currency.Copper", abbr: "GPH.Currency.CopperAbbr", value: 1, color: "#b87333" }
];

export const DEFAULT_CATEGORIES = [
  { id: "lodging", name: "GPH.Category.Lodging", percent: 20 },
  { id: "breakfast", name: "GPH.Category.Breakfast", percent: 1 },
  { id: "dinner", name: "GPH.Category.Dinner", percent: 2 },
  { id: "spirits", name: "GPH.Category.Spirits", percent: 1 },
  { id: "rations", name: "GPH.Category.Rations", percent: 5 }
];

export const DEFAULT_STATUSES = [
  { id: "s8", status: 8, name: "GPH.Status.s8", monthly: 600000000 },
  { id: "s7", status: 7, name: "GPH.Status.s7", monthly: 60000000 },
  { id: "s6", status: 6, name: "GPH.Status.s6", monthly: 6000000 },
  { id: "s5", status: 5, name: "GPH.Status.s5", monthly: 600000 },
  { id: "s4", status: 4, name: "GPH.Status.s4", monthly: 60000 },
  { id: "s3", status: 3, name: "GPH.Status.s3", monthly: 12000 },
  { id: "s2", status: 2, name: "GPH.Status.s2", monthly: 3000 },
  { id: "s1", status: 1, name: "GPH.Status.s1", monthly: 1200 },
  { id: "s0", status: 0, name: "GPH.Status.s0", monthly: 600 },
  { id: "sm1", status: -1, name: "GPH.Status.sm1", monthly: 300 },
  { id: "sm2", status: -2, name: "GPH.Status.sm2", monthly: 100 }
];

export const DEFAULT_REACTION = [
  { id: "disastrous", min: -999, max: 0, name: "GPH.Reaction.Disastrous", buy: null, sell: null },
  { id: "verybad", min: 1, max: 3, name: "GPH.Reaction.VeryBad", buy: 300, sell: 33.33 },
  { id: "bad", min: 4, max: 6, name: "GPH.Reaction.Bad", buy: 200, sell: 50 },
  { id: "poor", min: 7, max: 9, name: "GPH.Reaction.Poor", buy: 120, sell: 75 },
  { id: "neutral", min: 10, max: 12, name: "GPH.Reaction.Neutral", buy: 100, sell: 100 },
  { id: "good", min: 13, max: 15, name: "GPH.Reaction.Good", buy: 100, sell: 100 },
  { id: "verygood", min: 16, max: 18, name: "GPH.Reaction.VeryGood", buy: 80, sell: 150 },
  { id: "excellent", min: 19, max: 999, name: "GPH.Reaction.Excellent", buy: 50, sell: 200 }
];

export const DEFAULTS = {
  [CURRENCIES]: DEFAULT_CURRENCIES,
  [CATEGORIES]: DEFAULT_CATEGORIES,
  [STATUSES]: DEFAULT_STATUSES,
  [REACTION]: DEFAULT_REACTION
};

export const clone = (value) => foundry.utils.deepClone(value);
