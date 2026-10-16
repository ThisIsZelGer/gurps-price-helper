import { MODULE_ID, CURRENCIES, CATEGORIES, STATUSES, REACTION } from "../constants.mjs";
import { getTable } from "../settings.mjs";
import {
  sortCurrencies,
  localizeName,
  coinsToDollars,
  formatCoinsFromDollars,
  findReactionTier,
  reactionMultiplier,
  applyMultiplier,
  formatMultiplier,
  formatDollars,
  priceFor,
  reactionTierColor,
  statusHeaderColor,
  resolveCurrencyColor
} from "../logic.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

let instance = null;

export class PriceHelperApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gurps-price-helper-app",
    tag: "div",
    classes: ["gurps-price-helper", "gph-app"],
    window: {
      title: "GPH.App.Title",
      icon: "fa-solid fa-coins",
      resizable: true
    },
    position: { width: 780, height: "auto" },
    actions: {
      resetConverter: PriceHelperApp.onResetConverter,
      openConfig: PriceHelperApp.onOpenConfig
    }
  };

  static PARTS = {
    converter: { template: `modules/${MODULE_ID}/templates/converter.hbs` },
    reaction: { template: `modules/${MODULE_ID}/templates/reaction.hbs` },
    prices: { template: `modules/${MODULE_ID}/templates/prices.hbs` }
  };

  constructor(options = {}) {
    super(options);
    this.gphState = {
      dollars: 0,
      coins: {},
      roll: 10,
      modifier: 0,
      statusId: null,
      matrixOpen: false
    };
  }

  get title() {
    return game.i18n.localize(this.options.window.title);
  }

  static open() {
    instance ??= new PriceHelperApp();
    const statuses = getTable(STATUSES);
    const preferred = statuses.find((s) => Number(s.status) === 0) ?? statuses[0];
    instance.gphState.statusId = preferred?.id ?? null;
    instance.render({ force: true });
    return instance;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.isGM = game.user.isGM;
    context.matrixOpen = this.gphState.matrixOpen;
    const currencies = sortCurrencies(getTable(CURRENCIES));
    const categories = getTable(CATEGORIES);
    const statuses = getTable(STATUSES);
    const reactionTable = getTable(REACTION);

    const status = statuses.find((s) => s.id === this.gphState.statusId)
      ?? statuses.find((s) => Number(s.status) === 0)
      ?? statuses[0]
      ?? null;
    const total = Number(this.gphState.roll || 0) + Number(this.gphState.modifier || 0);
    const tier = findReactionTier(total, reactionTable);
    const buyMult = reactionMultiplier(tier, "buy");
    const sellMult = reactionMultiplier(tier, "sell");
    const buyText = formatMultiplier(buyMult);
    const sellText = formatMultiplier(sellMult);

    context.currencies = currencies.map((c) => ({
      id: c.id,
      name: localizeName(c.name),
      abbr: localizeName(c.abbr),
      color: resolveCurrencyColor(c),
      value: Number(c.value) || 0,
      count: Number(this.gphState.coins[c.id]) || 0
    }));

    context.dollars = Number(this.gphState.dollars) || 0;
    context.coinsResult = formatCoinsFromDollars(this.gphState.dollars, currencies);
    context.dollarsResult = formatDollars(coinsToDollars(this.gphState.coins, currencies));
    context.coinsAdjusted = this.#adjustedLine(
      Number(this.gphState.dollars) || 0,
      currencies,
      true,
      buyMult,
      sellMult
    );
    context.dollarsAdjusted = this.#adjustedLine(
      coinsToDollars(this.gphState.coins, currencies),
      currencies,
      false,
      buyMult,
      sellMult
    );

    context.roll = Number(this.gphState.roll) || 0;
    context.modifier = Number(this.gphState.modifier) || 0;
    context.reactionTotal = total;
    context.tierLabel = tier ? localizeName(tier.name) : game.i18n.localize("GPH.Reaction.NoMatch");
    context.tierColor = reactionTierColor(tier, reactionTable);
    context.buyText = buyText;
    context.sellText = sellText;

    const statusesSorted = [...statuses].sort((a, b) => Number(a.status) - Number(b.status));
    context.statusOptions = statusesSorted.map((s) => ({
      id: s.id,
      label: `${s.status >= 0 ? "+" : ""}${s.status} — ${localizeName(s.name)}`,
      selected: s.id === status?.id
    }));

    context.rows = categories.map((category) => {
      const base = priceFor(status?.monthly ?? 0, category);
      const buy = applyMultiplier(base, buyMult);
      const sell = applyMultiplier(base, sellMult);
      return {
        label: localizeName(category.name),
        percent: Number(category.percent) || 0,
        base: formatDollars(base),
        baseCoins: formatCoinsFromDollars(base, currencies),
        buy: buy === null ? "—" : formatDollars(buy),
        buyCoins: buy === null ? "" : formatCoinsFromDollars(buy, currencies),
        sell: sell === null ? "—" : formatDollars(sell),
        sellCoins: sell === null ? "" : formatCoinsFromDollars(sell, currencies)
      };
    });

    context.matrix = {
      statuses: statusesSorted.map((s) => ({
        id: s.id,
        label: `${s.status >= 0 ? "+" : ""}${s.status}`,
        name: localizeName(s.name),
        color: statusHeaderColor(s.status)
      })),
      rows: categories.map((category) => ({
        label: localizeName(category.name),
        cells: statusesSorted.map((s) => {
          const base = priceFor(s.monthly, category);
          const final = buyMult !== null && buyMult !== 1 ? applyMultiplier(base, buyMult) : null;
          return {
            base: formatDollars(base),
            final: final === null ? null : formatDollars(final)
          };
        })
      }))
    };

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._listenerController?.abort();
    this._listenerController = new AbortController();
    const signal = this._listenerController.signal;

    const converter = (event) => this.#onConverterInput(event);
    this.element.querySelectorAll('[data-gph="dollars"], [data-gph-coin]').forEach((el) => {
      el.addEventListener("input", converter, { signal });
    });

    const dollars = this.element.querySelector('[data-gph="dollars"]');
    dollars?.addEventListener("wheel", (event) => {
      if (!event.deltaY) return;
      event.preventDefault();
      const current = Number(dollars.value) || 0;
      const next = Math.max(0, current + (event.deltaY < 0 ? 1 : -1));
      dollars.value = String(next);
      this.gphState.dollars = next;
      this.#renderConverterOutputs();
    }, { signal });

    const reaction = (event) => this.#onReactionInput(event);
    this.element.querySelectorAll("[data-gph-reaction]").forEach((el) => {
      el.addEventListener("change", reaction, { signal });
      el.addEventListener("input", reaction, { signal });
    });

    const status = this.element.querySelector('select[name="statusId"]');
    status?.addEventListener("change", (event) => this.#onStatusChange(event), { signal });

    const matrix = this.element.querySelector(".gph-matrix-details");
    matrix?.addEventListener("toggle", (event) => {
      this.gphState.matrixOpen = event.target.open;
    }, { signal });
  }

  #onConverterInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-gph="dollars"]')) {
      this.gphState.dollars = Number(target.value) || 0;
    } else if (target.matches("[data-gph-coin]")) {
      this.gphState.coins[target.dataset.gphCoin] = Number(target.value) || 0;
    }
    this.#renderConverterOutputs();
  }

  #adjustedLine(amount, currencies, asCoins, buyMult, sellMult) {
    const base = Number(amount) || 0;
    const buy = applyMultiplier(base, buyMult);
    const sell = applyMultiplier(base, sellMult);
    const buyLabel = game.i18n.localize("GPH.Reaction.BuyShort");
    const sellLabel = game.i18n.localize("GPH.Reaction.SellShort");
    const noDeal = game.i18n.localize("GPH.Reaction.NoDeal");
    const fmt = (value) => {
      if (value === null) return noDeal;
      return asCoins ? formatCoinsFromDollars(value, currencies) : formatDollars(value);
    };
    return `${buyLabel}: ${fmt(buy)} · ${sellLabel}: ${fmt(sell)}`;
  }

  #reactionMults() {
    const reactionTable = getTable(REACTION);
    const total = Number(this.gphState.roll || 0) + Number(this.gphState.modifier || 0);
    const tier = findReactionTier(total, reactionTable);
    return {
      buyMult: reactionMultiplier(tier, "buy"),
      sellMult: reactionMultiplier(tier, "sell")
    };
  }

  #renderConverterOutputs() {
    const currencies = sortCurrencies(getTable(CURRENCIES));
    const coinsOut = this.element.querySelector('[data-gph="coinsResult"]');
    if (coinsOut) coinsOut.innerHTML = formatCoinsFromDollars(this.gphState.dollars, currencies);
    const dollarsOut = this.element.querySelector('[data-gph="dollarsResult"]');
    if (dollarsOut) {
      dollarsOut.textContent = formatDollars(coinsToDollars(this.gphState.coins, currencies));
    }
    const { buyMult, sellMult } = this.#reactionMults();
    const set = (name, value) => {
      const el = this.element.querySelector(`[data-gph="${name}"]`);
      if (el) el.innerHTML = value;
    };
    set("coinsAdjusted", this.#adjustedLine(Number(this.gphState.dollars) || 0, currencies, true, buyMult, sellMult));
    set("dollarsAdjusted", this.#adjustedLine(coinsToDollars(this.gphState.coins, currencies), currencies, false, buyMult, sellMult));
  }

  #onReactionInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.matches("[data-gph-reaction]")) return;
    const field = target.dataset.gphReaction;
    this.gphState[field] = Number(target.value) || 0;

    const total = this.gphState.roll + this.gphState.modifier;
    const reactionTable = getTable(REACTION);
    const tier = findReactionTier(total, reactionTable);
    const buyText = formatMultiplier(reactionMultiplier(tier, "buy"));
    const sellText = formatMultiplier(reactionMultiplier(tier, "sell"));

    const totalOut = this.element.querySelector('[data-gph="reactionTotal"]');
    if (totalOut) totalOut.textContent = total;
    const labelOut = this.element.querySelector('[data-gph="reactionLabel"]');
    if (labelOut) {
      labelOut.textContent = tier ? localizeName(tier.name) : game.i18n.localize("GPH.Reaction.NoMatch");
      labelOut.style.color = reactionTierColor(tier, reactionTable);
    }
    const buyOut = this.element.querySelector('[data-gph="reactionBuy"]');
    if (buyOut) buyOut.textContent = buyText;
    const sellOut = this.element.querySelector('[data-gph="reactionSell"]');
    if (sellOut) sellOut.textContent = sellText;

    this.#renderConverterOutputs();
    this.render({ parts: ["prices"] });
  }

  #onStatusChange(event) {
    this.gphState.statusId = event.target.value;
    this.render({ parts: ["prices"] });
  }

  static async onResetConverter() {
    this.gphState.dollars = 0;
    this.gphState.coins = {};
    this.render();
  }

  static async onOpenConfig() {
    if (!game.user.isGM) return;
    const { ConfigApp } = await import("./config-app.mjs");
    ConfigApp.open();
  }
}
