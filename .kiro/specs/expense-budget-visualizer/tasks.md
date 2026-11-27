# Implementation Plan: Expense Budget Visualizer

## Overview

Build a mobile-first, single-page expense tracker as three files (`index.html`, `css/style.css`, `js/app.js`). All logic is Vanilla JavaScript with a unidirectional data-flow pattern: user action → state mutation → localStorage write → re-render. Tailwind CSS (Play CDN) and Chart.js (CDN) are the only external dependencies.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` with `<!DOCTYPE html>`, `<html>`, `<head>`, and `<body>` elements
  - Add Tailwind CSS Play CDN `<script>` tag in `<head>`
  - Add Chart.js CDN `<script>` tag in `<head>`
  - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - Add `<script src="js/app.js" defer></script>` before `</body>`
  - Create empty `css/style.css` file inside a `css/` directory
  - Create empty `js/app.js` file inside a `js/` directory
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 2. Build the HTML structure and layout
  - [x] 2.1 Add the Balance Display section to `index.html`
    - Add an element with `id="balance"` displaying the current total
    - Apply Tailwind utility classes for a prominent, mobile-friendly header area
    - _Requirements: 3.1_

  - [x] 2.2 Add the Input Form section to `index.html`
    - Add `<form id="transaction-form">` with:
      - `<input type="text" id="item-name">` for item name
      - `<input type="number" id="amount" min="0.01" step="0.01">` for amount
      - `<select id="category">` with default options Food, Transport, Fun
      - Submit `<button>` to add the transaction
    - Add `<input type="text" id="add-category-input">` and `<button id="add-category-btn">` for custom categories
    - Add `required` attributes on the three main fields for native HTML5 validation
    - _Requirements: 1.1, 1.2, 6.1_

  - [x] 2.3 Add the Sort Control and Theme Toggle to `index.html`
    - Add `<select id="sort-select">` with options `amount-asc`, `amount-desc`, `category-asc`
    - Add `<button id="theme-toggle">` (or checkbox) for dark/light switching
    - _Requirements: 7.1, 8.1_

  - [x] 2.4 Add the Transaction List and Chart canvas to `index.html`
    - Add `<ul id="transaction-list">` (empty; populated by JavaScript)
    - Add `<canvas id="spending-chart">` for the Chart.js pie chart
    - _Requirements: 2.1, 4.1_

- [x] 3. Implement data models, state, and persistence layer in `js/app.js`
  - [x] 3.1 Define data models and default state
    - Define the `Transaction` object shape (id, name, amount, category, createdAt)
    - Define the `AppState` object shape (transactions, categories, sortOption, theme)
    - Define `DEFAULT_STATE` with empty transactions, `['Food', 'Transport', 'Fun']` categories, `'amount-desc'` sort, and `'light'` theme
    - _Requirements: 9.1_

  - [x] 3.2 Implement `saveState(state)` and `loadState()` functions
    - `saveState`: serialize and write `ebv_transactions`, `ebv_categories`, and `ebv_theme` keys to `localStorage`
    - `loadState`: read and parse those keys; return `DEFAULT_STATE` values for any absent or invalid JSON keys
    - Add `try/catch` in `saveState` for quota errors (log a console warning, do not throw)
    - Add `try/catch` in `loadState` for JSON parse errors (fall back to default for that key only)
    - _Requirements: 5.1, 5.2, 5.3, 6.3, 6.4, 8.4_

- [x] 4. Implement core computation functions in `js/app.js`
  - [x] 4.1 Implement `computeBalance(transactions)` and `computeCategoryTotals(transactions)`
    - `computeBalance`: return the arithmetic sum of all `amount` fields (return `0` for an empty array)
    - `computeCategoryTotals`: return a `Record<string, number>` mapping each category to its total amount
    - _Requirements: 3.1, 4.2_

  - [x] 4.2 Implement `sortTransactions(transactions, sortOption)`
    - Return a new sorted array without mutating the input
    - `"amount-asc"`: ascending by amount
    - `"amount-desc"`: descending by amount
    - `"category-asc"`: lexicographic ascending by category name
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 4.3 Implement input validation logic
    - `validateTransaction({name, amount, category})`: return `{valid, errors}` where errors names invalid fields
    - Reject item name that is empty or whitespace-only after trimming
    - Reject amount that is zero, negative, non-finite (NaN, ±Infinity), or not a number
    - Reject category that is empty or not in the current category list
    - _Requirements: 1.4_

- [x] 5. Implement render functions in `js/app.js`
  - [x] 5.1 Implement `renderBalance(transactions)`
    - Set `#balance` `textContent` to the formatted sum from `computeBalance`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Implement `renderList(transactions, sortOption)`
    - Sort transactions using `sortTransactions`
    - Clear `#transaction-list` and rebuild one `<li>` per transaction containing item name, formatted amount, category badge, and a delete `<button data-id="...">` 
    - _Requirements: 2.1, 2.2, 7.2, 7.3_

  - [x] 5.3 Implement `renderChart(transactions)`
    - Compute category totals with `computeCategoryTotals`
    - On first call, create a new `Chart` instance on `#spending-chart` as a pie chart
    - On subsequent calls, update `chart.data.labels`, `chart.data.datasets[0].data`, then call `chart.update()`
    - Render only categories with at least one transaction
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.4 Implement `renderCategories(categories)`
    - Rebuild the `<option>` elements inside `#category` from the current categories array
    - _Requirements: 1.2, 6.2, 6.4_

  - [x] 5.5 Implement `renderAll(state)`
    - Call `renderBalance`, `renderList`, `renderChart`, and `renderCategories` with current state values
    - _Requirements: 5.3_

- [-] 6. Checkpoint — Wire up initial app load
  - In `js/app.js`, on `DOMContentLoaded`:
    1. Call `loadState()` to populate the in-memory state object
    2. Call `applyTheme(state.theme)` to restore the saved theme
    3. Call `renderAll(state)` to populate the UI from persisted data
    4. Attach all event listeners (form submit, delete clicks, sort change, theme toggle, add-category button)
  - Verify the page loads without console errors with an empty `localStorage`
  - Verify the page loads without console errors when `localStorage` contains saved data
  - _Requirements: 5.3, 6.4, 8.4_

- [ ] 7. Implement event handlers in `js/app.js`
  - [~] 7.1 Implement `handleFormSubmit(event)` for `#transaction-form`
    - Call `event.preventDefault()`
    - Read values from `#item-name`, `#amount`, `#category`
    - Run `validateTransaction`; if invalid, display an inline message naming the failing fields and return early
    - On valid input: create a `Transaction` object with `crypto.randomUUID()` (fall back to timestamp + `Math.random()`) and `Date.now()`
    - Push to `state.transactions`, call `saveState(state)`, call `renderAll(state)`, reset the form
    - _Requirements: 1.3, 1.4, 1.5, 3.2, 4.3, 5.1_

  - [~] 7.2 Implement `handleDelete(id)` for delete buttons in `#transaction-list`
    - Use event delegation on `#transaction-list` listening for clicks on `[data-id]` buttons
    - Filter `state.transactions` to remove the matching id
    - Call `saveState(state)`, call `renderAll(state)`
    - _Requirements: 2.3, 3.3, 4.4, 5.2_

  - [~] 7.3 Implement `handleAddCategory()` for `#add-category-btn`
    - Read and trim the value from `#add-category-input`
    - Silently ignore empty strings or values already present in `state.categories`
    - Append the new category to `state.categories`, call `saveState(state)`, call `renderCategories(state.categories)`, clear the input
    - _Requirements: 6.1, 6.2, 6.3_

  - [~] 7.4 Implement `handleSortChange(event)` for `#sort-select`
    - Update `state.sortOption` to the selected value
    - Call `renderList(state.transactions, state.sortOption)` (no persistence needed for sort preference)
    - _Requirements: 7.2, 7.3_

  - [~] 7.5 Implement `handleThemeToggle()` and `applyTheme(theme)` for `#theme-toggle`
    - `applyTheme('dark')`: add class `dark` to `<html>`; `applyTheme('light')`: remove it
    - `handleThemeToggle`: toggle `state.theme` between `'dark'` and `'light'`, call `applyTheme`, write `ebv_theme` to `localStorage`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [~] 8. Apply CSS styling in `css/style.css` and Tailwind classes in `index.html`
  - Apply Tailwind utility classes throughout `index.html` for a mobile-first responsive layout (single-column on small screens, wider on medium+)
  - In `css/style.css`, write custom styles that complement Tailwind: scrollable transaction list height, chart container sizing, dark-mode color overrides not covered by Tailwind utilities, and any typography adjustments
  - Ensure the transaction list scrolls when it overflows its container
  - _Requirements: 2.2, 9.3, 9.5_

- [~] 9. Final checkpoint — End-to-end verification
  - Open `index.html` directly in Chrome, Firefox, Edge, and Safari (no server required)
  - Confirm: adding a transaction updates the list, balance, and pie chart
  - Confirm: deleting a transaction updates the list, balance, and pie chart
  - Confirm: refreshing the page restores transactions, custom categories, and theme
  - Confirm: theme toggle switches dark/light mode and persists across reload
  - Confirm: sort control reorders the list immediately and new transactions respect the active sort
  - Confirm: submitting the form with any empty field shows a validation message and does not add a transaction
  - Confirm: custom categories appear in the selector and persist after reload
  - _Requirements: 1.1–1.5, 2.1–2.3, 3.1–3.3, 4.1–4.4, 5.1–5.3, 6.1–6.4, 7.1–7.3, 8.1–8.4, 9.5_

## Notes

- All tasks produce files in `index.html`, `css/style.css`, or `js/app.js` — no build step or test runner is needed
- No frameworks, no npm, no bundler: open `index.html` in a browser to run the app
- Tasks are ordered so each step produces an incrementally runnable state
- Checkpoints (tasks 6 and 9) are manual verification steps against the running page

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.5"] },
    { "id": 6, "tasks": ["6"] },
    { "id": 7, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 8, "tasks": ["8"] },
    { "id": 9, "tasks": ["9"] }
  ]
}
```
