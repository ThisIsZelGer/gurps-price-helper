import { MODULE_ID } from "./constants.mjs";
import { registerSettings, registerKeybinding, openConverter, canUse } from "./settings.mjs";
import { PriceHelperApp } from "./apps/converter-app.mjs";
import { ConfigApp } from "./apps/config-app.mjs";
import * as logic from "./logic.mjs";

Hooks.once("init", () => {
  registerSettings();
  registerKeybinding();
});

Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      open: openConverter,
      openConverter,
      PriceHelperApp,
      ConfigApp,
      logic
    };
  }
});

Hooks.on("getSceneControlButtons", (controls) => {
  try {
    if (!controls || !canUse()) return;
    const group = controls.tokens ?? controls.token;
    if (!group) return;
    group.tools ??= {};
    const key = `${MODULE_ID}-open`;
    group.tools[key] = {
      name: key,
      title: game.i18n.localize("GPH.Control.Open"),
      icon: "fa-solid fa-coins",
      button: true,
      visible: true,
      order: Object.keys(group.tools).length,
      onChange: () => openConverter(),
      onClick: () => openConverter()
    };
  } catch (err) {
    console.error(`${MODULE_ID} | failed to add scene control button`, err);
  }
});
