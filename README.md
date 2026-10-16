# GURPS Price Helper

Модуль для Foundry VTT, который упрощает работу с деньгами и ценами в GURPS:
конвертирует доллары в игровые монеты (и обратно), считает цены на ночлег, еду и
питьё по Статусу и применяет модификаторы из таблицы броска реакции.

A Foundry VTT module that makes handling money and prices in GURPS easy: it
converts dollars to and from in-game coins, calculates prices for lodging, food
and drink by Status, and applies the GURPS reaction-roll modifiers.

**Автор / Author:** ZelGer

---

## Русский

### Возможности

- **Конвертер валют** — вводите сумму в `$` и получаете монеты (золото/серебро/медь
  и любые свои), либо вводите монеты и получаете сумму в `$`. Обозначения монет
  окрашены в их цвета, остаток размена показывается в `$`.
- **Бросок реакции** — итог `3d6 + модификатор` по таблице реакции даёт наценку при
  покупке и скидку при продаже; результат сразу применяется к ценам.
- **Ценник** — базовые цены категорий (ночлег, завтрак/ланч, обед, спиртное, паёк)
  считаются от месячных расходов на жизнь выбранного Статуса.
- **Матрица всех статусов** — таблица цен по всем Статусам сразу (база / с учётом
  реакции на покупку).
- **Настройки** — редактирование валют, категорий цен, статусов и таблицы реакции:
  добавление и удаление строк, перетаскивание для изменения порядка, выбор цвета
  валюты, сброс каждого блока отдельно к значениям по умолчанию.
- Мастер может разрешить открытие помощника обычным игрокам.

### Установка

1. В Foundry VTT откройте **Add-on Modules → Install Module**.
2. Вставьте ссылку на манифест в поле **Manifest URL**:

   ```
   https://github.com/ThisIsZelGer/gurps-price-helper/releases/latest/download/module.json
   ```

3. Нажмите **Install**.

Либо распакуйте релизный архив в папку `Data/modules/gurps-price-helper`.

### Использование

- Открыть помощник: кнопка в панели управления сцены (Token Controls), сочетание
  клавиш **Shift + P** или меню настроек модуля.
- Ввести сумму в `$` или монеты — результаты обновляются на лету.
- Задать бросок `3d6` и модификатор персонажа, чтобы применить реакцию.
- Мастер может открыть **Настройки** кнопкой в заголовке окна помощника.

### Совместимость

- Foundry VTT **14+** (проверено на 14.369).
- Языки интерфейса: **русский**, **английский**.

### API

```js
// Открыть окно помощника цен
game.modules.get("gurps-price-helper").api.open();

// Открыть окно настроек (только Мастер)
game.modules.get("gurps-price-helper").api.ConfigApp.open();
```

---

## English

### Features

- **Currency converter** — enter an amount in `$` to get coins (gold/silver/copper
  or your own), or enter coins to get the total in `$`. Coin symbols are tinted with
  their colour and any leftover change is shown in `$`.
- **Reaction roll** — `3d6 + modifier` run through the reaction table yields a
  markup when buying and a markdown when selling, applied to prices instantly.
- **Price list** — base prices for categories (lodging, breakfast/lunch, dinner,
  spirits, rations) are computed from the cost of living of the selected Status.
- **All-statuses matrix** — every Status at a glance (base / incl. buy reaction).
- **Configuration** — edit currencies, price categories, statuses and the reaction
  table: add/remove rows, drag to reorder, pick currency colours, reset each block
  to defaults independently.
- The GM can allow regular players to open the helper.

### Installation

1. In Foundry VTT open **Add-on Modules → Install Module**.
2. Paste the manifest link into the **Manifest URL** field:

   ```
   https://github.com/ThisIsZelGer/gurps-price-helper/releases/latest/download/module.json
   ```

3. Click **Install**.

Or unzip the release archive into `Data/modules/gurps-price-helper`.

### Usage

- Open the helper via the scene control buttons (Token Controls), the
  **Shift + P** keybinding, or the module's settings menu.
- Type an amount in `$` or coins — results update live.
- Set the `3d6` result and the character modifier to apply the reaction.
- A GM can open **Settings** using the button in the helper window header.

### Compatibility

- Foundry VTT **14+** (verified on 14.369).
- UI languages: **English**, **Russian**.

### API

```js
// Open the price helper window
game.modules.get("gurps-price-helper").api.open();

// Open the settings window (GM only)
game.modules.get("gurps-price-helper").api.ConfigApp.open();
```

---

## Лицензия / License

[MIT](LICENSE) © ZelGer
