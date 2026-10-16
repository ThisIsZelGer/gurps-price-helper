import {
  MODULE_ID,
  CURRENCIES,
  CATEGORIES,
  STATUSES,
  REACTION,
  DEFAULTS,
  clone
} from "../constants.mjs";
import { getTable } from "../settings.mjs";
import { localizeName, resolveCurrencyColor } from "../logic.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const ARRAYS = [CURRENCIES, CATEGORIES, STATUSES, REACTION];

let instance = null;

function newId(prefix) {
  return `${prefix}-${foundry.utils.randomID(6)}`;
}

function newRow(arrayKey) {
  switch (arrayKey) {
    case CURRENCIES:
      return { id: newId("cur"), name: "GPH.Config.NewCurrency", abbr: "?", value: 1, color: "#cccccc" };
    case CATEGORIES:
      return { id: newId("cat"), name: "GPH.Config.NewCategory", percent: 0 };
    case STATUSES:
      return { id: newId("st"), status: 0, name: "GPH.Config.NewStatus", monthly: 0 };
    case REACTION:
      return { id: newId("re"), min: 0, max: 0, name: "GPH.Config.NewReaction", buy: 100, sell: 100 };
    default:
      return {};
  }
}

function defaultDraft() {
  return {
    [CURRENCIES]: clone(DEFAULTS[CURRENCIES]),
    [CATEGORIES]: clone(DEFAULTS[CATEGORIES]),
    [STATUSES]: clone(DEFAULTS[STATUSES]),
    [REACTION]: clone(DEFAULTS[REACTION])
  };
}

export class ConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "gurps-price-helper-config",
    tag: "div",
    classes: ["gurps-price-helper", "gph-config"],
    window: {
      title: "GPH.Config.Title",
      icon: "fa-solid fa-sliders",
      resizable: true
    },
    position: { width: 720, height: 640 },
    actions: {
      addRow: ConfigApp.onAddRow,
      removeRow: ConfigApp.onRemoveRow,
      save: ConfigApp.onSave,
      reset: ConfigApp.onReset
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/config.hbs` }
  };

  constructor(options = {}) {
    super(options);
    this.gphDraft = {
      [CURRENCIES]: getTable(CURRENCIES),
      [CATEGORIES]: getTable(CATEGORIES),
      [STATUSES]: getTable(STATUSES),
      [REACTION]: getTable(REACTION)
    };
  }

  static open() {
    if (!game.user.isGM) return;
    instance ??= new ConfigApp();
    instance.gphDraft = {
      [CURRENCIES]: getTable(CURRENCIES),
      [CATEGORIES]: getTable(CATEGORIES),
      [STATUSES]: getTable(STATUSES),
      [REACTION]: getTable(REACTION)
    };
    instance.render({ force: true });
    return instance;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.currencies = this.gphDraft[CURRENCIES].map((row, index) => {
      row.color = resolveCurrencyColor(row) || "#cccccc";
      return {
        ...row,
        index,
        nameDisplay: localizeName(row.name),
        abbrDisplay: localizeName(row.abbr),
        colorDisplay: row.color
      };
    });
    context.categories = this.gphDraft[CATEGORIES].map((row, index) => ({
      ...row,
      index,
      nameDisplay: localizeName(row.name)
    }));
    context.statuses = this.gphDraft[STATUSES].map((row, index) => ({
      ...row,
      index,
      nameDisplay: localizeName(row.name)
    }));
    context.reactions = this.gphDraft[REACTION].map((row, index) => ({
      ...row,
      index,
      nameDisplay: localizeName(row.name),
      buyDisplay: row.buy ?? "",
      sellDisplay: row.sell ?? ""
    }));
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._listenerController?.abort();
    this._listenerController = new AbortController();
    const handler = (event) => this.#onInput(event);
    this.element.addEventListener("input", handler, { signal: this._listenerController.signal });
    this.element.addEventListener("change", handler, { signal: this._listenerController.signal });

    const el = this.element;
    el.addEventListener("dragstart", (e) => this.#onDragStart(e), { signal: this._listenerController.signal });
    el.addEventListener("dragover", (e) => this.#onDragOver(e), { signal: this._listenerController.signal });
    el.addEventListener("drop", (e) => this.#onDrop(e), { signal: this._listenerController.signal });
    el.addEventListener("dragend", () => this.#clearDragClasses(), { signal: this._listenerController.signal });
  }

  #clearDragClasses() {
    this.element.querySelectorAll(".gph-dragging, .gph-drop-before, .gph-drop-after").forEach((n) => {
      n.classList.remove("gph-dragging", "gph-drop-before", "gph-drop-after");
    });
  }

  #onDragStart(event) {
    const handle = event.target.closest?.(".gph-drag-handle");
    if (!handle) return;
    const row = handle.closest("tr[data-array]");
    if (!row) return;
    const index = Number(row.dataset.index);
    const arrayKey = row.dataset.array;
    this.gphDrag = { arrayKey, index };
    event.dataTransfer.effectAllowed = "move";
    try { event.dataTransfer.setData("text/plain", String(index)); } catch {}
    row.classList.add("gph-dragging");
  }

  #onDragOver(event) {
    if (!this.gphDrag) return;
    const row = event.target.closest?.("tr[data-array]");
    if (!row || row.dataset.array !== this.gphDrag.arrayKey) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    this.#markDropTarget(row, event);
  }

  #markDropTarget(row, event) {
    this.#clearDragClasses();
    const rect = row.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    if (after) row.classList.add("gph-drop-after");
    else row.classList.add("gph-drop-before");
  }

  #onDrop(event) {
    if (!this.gphDrag) return;
    const row = event.target.closest?.("tr[data-array]");
    if (!row || row.dataset.array !== this.gphDrag.arrayKey) return;
    event.preventDefault();
    const rows = [...row.parentElement.children];
    const targetIndex = rows.indexOf(row);
    let insertIndex = targetIndex;
    const rect = row.getBoundingClientRect();
    if (event.clientY > rect.top + rect.height / 2) insertIndex = targetIndex + 1;
    const { arrayKey, index } = this.gphDrag;
    const list = this.gphDraft[arrayKey];
    if (!Array.isArray(list)) { this.gphDrag = null; this.#clearDragClasses(); return; }
    if (index < insertIndex) insertIndex -= 1;
    if (index === insertIndex || insertIndex < 0 || insertIndex > list.length) { this.gphDrag = null; this.#clearDragClasses(); if (index !== insertIndex) { /* maybe force render no, but same */ } }
    if (index === insertIndex) { this.gphDrag = null; this.#clearDragClasses(); return; }
    const [moved] = list.splice(index, 1);
    list.splice(insertIndex, 0, moved);
    this.gphDrag = null;
    this.#clearDragClasses();
    this.render({ parts: ["body"] });
  }

  #onInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.field) return;
    const arrayKey = target.dataset.array;
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    const rows = this.gphDraft[arrayKey];
    if (!rows || !rows[index]) return;
    if (target.dataset.type === "number") {
      rows[index][field] = target.value === "" ? null : Number(target.value);
    } else {
      rows[index][field] = target.value;
    }
  }

  static async onAddRow(event, target) {
    const arrayKey = target.dataset.array;
    this.gphDraft[arrayKey].push(newRow(arrayKey));
    this.render({ parts: ["body"] });
  }

  static async onRemoveRow(event, target) {
    const arrayKey = target.dataset.array;
    const index = Number(target.dataset.index);
    this.gphDraft[arrayKey].splice(index, 1);
    this.render({ parts: ["body"] });
  }

  static async onSave() {
    for (const key of ARRAYS) {
      await game.settings.set(MODULE_ID, key, this.gphDraft[key]);
    }
    ui.notifications.info(game.i18n.localize("GPH.Notify.Saved"));
  }

  static async onReset(event, target) {
    const arrayKey = target?.dataset?.array;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize("GPH.Config.Reset") },
      content: `<p>${game.i18n.localize("GPH.Config.ResetConfirm")}</p>`
    });
    if (!confirmed) return;
    const defaults = defaultDraft();
    if (arrayKey && this.gphDraft[arrayKey]) {
      this.gphDraft[arrayKey] = defaults[arrayKey];
    } else {
      this.gphDraft = defaults;
    }
    this.render({ parts: ["body"] });
    ui.notifications.info(game.i18n.localize("GPH.Notify.Reset"));
  }
}
