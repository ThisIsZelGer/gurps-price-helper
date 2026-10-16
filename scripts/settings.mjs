import {
  MODULE_ID,
  CURRENCIES,
  CATEGORIES,
  STATUSES,
  REACTION,
  ALLOW_PLAYERS,
  DEFAULTS,
  clone
} from "./constants.mjs";
import { ConfigApp } from "./apps/config-app.mjs";
import { PriceHelperApp } from "./apps/converter-app.mjs";

export function registerSettings() {
  game.settings.register(MODULE_ID, CURRENCIES, {
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULTS[CURRENCIES])
  });

  game.settings.register(MODULE_ID, CATEGORIES, {
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULTS[CATEGORIES])
  });

  game.settings.register(MODULE_ID, STATUSES, {
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULTS[STATUSES])
  });

  game.settings.register(MODULE_ID, REACTION, {
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULTS[REACTION])
  });

  game.settings.register(MODULE_ID, ALLOW_PLAYERS, {
    name: "GPH.Settings.AllowPlayers.Name",
    hint: "GPH.Settings.AllowPlayers.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.registerMenu(MODULE_ID, "openConverter", {
    name: "GPH.Menu.Open.Name",
    label: "GPH.Menu.Open.Label",
    hint: "GPH.Menu.Open.Hint",
    icon: "fa-solid fa-coins",
    type: PriceHelperApp,
    restricted: false
  });

  game.settings.registerMenu(MODULE_ID, "config", {
    name: "GPH.Menu.Config.Name",
    label: "GPH.Menu.Config.Label",
    hint: "GPH.Menu.Config.Hint",
    icon: "fa-solid fa-sliders",
    type: ConfigApp,
    restricted: true
  });
}

export function registerKeybinding() {
  game.keybindings.register(MODULE_ID, "openConverter", {
    name: "GPH.Keybind.Open",
    hint: "GPH.Keybind.OpenHint",
    editable: [{ key: "KeyP", modifiers: ["Shift"] }],
    onDown: () => {
      if (!canUse()) return false;
      openConverter();
      return true;
    }
  });
}

export function canUse() {
  return game.user.isGM || game.settings.get(MODULE_ID, ALLOW_PLAYERS);
}

export function openConverter() {
  if (!canUse()) {
    ui.notifications.warn(game.i18n.localize("GPH.Notify.NotAllowed"));
    return;
  }
  PriceHelperApp.open();
}

export function getTable(key) {
  const stored = game.settings.get(MODULE_ID, key);
  return clone(stored ?? DEFAULTS[key] ?? []);
}
