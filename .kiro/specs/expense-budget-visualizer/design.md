# Design Document

## Overview

The expense-budget-visualizer is a mobile-first, single-page web application for tracking daily spending. It runs entirely in the browser with no backend: all state lives in `localStorage` and all logic is Vanilla JavaScript.

The delivered artifact is three files:

| File | Purpose |
|---|---|
| `index.html` | Markup, CDN script/link tags, and the structural skeleton |
| `css/style.css` | Custom CSS that complements Tailwind utility classes |
| `js/app.js` | All application logic |

External dependencies loaded via CDN only:
- **Tailwind CSS Play CDN** — utility-first styling
- **Chart.js** — pie chart rendering

---

## Architecture

The application follows a unidirectional data-flow pattern inside a single JavaScript module:

```
User Interaction
      │
      ▼
  Event Handler  (in app.js)
      │
      ▼
  State Mutation  (addTransaction / deleteTransaction / addCategory / setSort / setTheme)
      │
      ▼
  Persistence  (saveState → localStorage)
      │
      ▼
  Render  (renderAll → renderList + renderBalance + renderChart + renderCategories)
      │
      ▼
  DOM / Chart.js
```

There is one authoritative in-memory state object. Every user action mutates the state object, writes it to `localStorage`, then re-renders the affected UI regions. No two-way binding or reactive framework is used.

**Startup sequence:**

1. Parse `localStorage` → populate in-memory state (or use defaults if empty).
2. Apply saved theme.
3. Call `renderAll()`.
4. Attach all event listeners.

---

## Components and Interfaces

### 1. Input Form Component

**Responsibility:** Collect item name, amount, and category from the user and emit a validated transaction.

**DOM elements:**
- `#item-name` — `<input type="text">`
- `#amount` — `<input type="number" min="0.01" step="0.01">`
- `#category` — `<select>` populated from state
- `#add-category-input` — `<input type="text">` for new custom categories
- `#add-category-btn` — `<button>` to confirm a new custom category
- `#transaction-form` — `<form>` wrapping the above

**JavaScript interface:**

```js
// Called on form submit event
function handleFormSubmit(event: SubmitEvent): void

// Called on add-category-btn click
function handleAddCategory(): void
```

**Validation rules:**
- Item name: non-empty after trimming whitespace
- Amount: a finite positive number
- Category: a non-empty string present in the category list

---

### 2. Transaction List Component

**Responsibility:** Display all transactions ordered by the active sort option; provide per-row delete.

**DOM elements:**
- `#transaction-list` — `<ul>` or `<tbody>` container
- Each row: item name, formatted amount, category badge, delete button

**JavaScript interface:**

```js
function renderList(transactions: Transaction[], sortOption: SortOption): void
function handleDelete(id: string): void
```

---

### 3. Balance Display Component

**Responsibility:** Show the running sum of all transaction amounts.

**DOM elements:**
- `#balance` — element updated via `textContent`

**JavaScript interface:**

```js
function renderBalance(transactions: Transaction[]): void
function computeBalance(transactions: Transaction[]): number
```

---

### 4. Chart Component

**Responsibility:** Render and update a Chart.js pie chart representing spending per category.

**DOM elements:**
- `#spending-chart` — `<canvas>`

**JavaScript interface:**

```js
function renderChart(transactions: Transaction[]): void
function computeCategoryTotals(transactions: Transaction[]): Record<string, number>
```

A single `Chart` instance is created on first render and updated via `chart.data = …; chart.update()` on subsequent calls, avoiding unnecessary DOM teardown.

---

### 5. Sort Control Component

**Responsibility:** Let the user choose a sort order for the Transaction List.

**DOM elements:**
- `#sort-select` — `<select>` with three `<option>` values

**Sort options (string enum):**

| Value | Meaning |
|---|---|
| `"amount-asc"` | Amount ascending |
| `"amount-desc"` | Amount descending |
| `"category-asc"` | Category name alphabetically |

**JavaScript interface:**

```js
function handleSortChange(event: Event): void
function sortTransactions(transactions: Transaction[], option: SortOption): Transaction[]
```

`sortTransactions` is a **pure function** — it returns a new sorted array and does not mutate the input.

---

### 6. Theme Toggle Component

**Responsibility:** Switch between dark and light visual modes and persist the preference.

**DOM elements:**
- `#theme-toggle` — `<button>` or `<input type="checkbox">`

**Mechanism:** Toggling adds/removes a `dark` class on `<html>`. Tailwind's `darkMode: 'class'` strategy applies dark-variant utilities automatically.

**JavaScript interface:**

```js
function handleThemeToggle(): void
function applyTheme(theme: 'dark' | 'light'): void
```

---

### 7. Persistence Layer

**Responsibility:** Serialize state to and deserialize state from `localStorage`.

**Keys:**

| Key | Value |
|---|---|
| `ebv_transactions` | JSON array of `Transaction` objects |
| `ebv_categories` | JSON array of custom category strings |
| `ebv_theme` | `"dark"` or `"light"` |

**JavaScript interface:**

```js
function saveState(state: AppState): void
function loadState(): AppState
```

`loadState` returns a fully initialized `AppState` with defaults when keys are absent or contain invalid JSON.

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id        - UUID v4 generated at creation time (crypto.randomUUID())
 * @property {string}  name      - Item name (non-empty, trimmed)
 * @property {number}  amount    - Positive finite number
 * @property {string}  category  - One of the active category list entries
 * @property {number}  createdAt - Unix timestamp (Date.now()) for ordering stability
 */
```

### AppState

```js
/**
 * @typedef {Object} AppState
 * @property {Transaction[]} transactions   - Ordered list of all transactions
 * @property {string[]}      categories     - Full category list (defaults + custom)
 * @property {SortOption}    sortOption     - Currently active sort
 * @property {'dark'|'light'} theme         - Currently active theme
 */
```

### SortOption

```js
/** @typedef {'amount-asc' | 'amount-desc' | 'category-asc'} SortOption */
```

### Default State

```js
const DEFAULT_STATE = {
  transactions: [],
  categories: ['Food', 'Transport', 'Fun'],
  sortOption: 'amount-desc',
  theme: 'light',
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: State serialization round-trip

*For any* valid `AppState` object, serializing it to JSON and deserializing it back via `saveState` / `loadState` SHALL produce a structurally equivalent `AppState`.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 2: Balance equals sum of transaction amounts

*For any* list of transactions, `computeBalance` SHALL return a value equal to the arithmetic sum of every transaction's `amount` field.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 3: Category totals partition the balance

*For any* non-empty list of transactions, the values produced by `computeCategoryTotals` SHALL sum to the same value as `computeBalance` applied to the same list.

**Validates: Requirements 4.2**

---

### Property 4: Sorted output is a permutation of the input

*For any* list of transactions and any valid `SortOption`, `sortTransactions` SHALL return an array that contains exactly the same elements as the input (same length, same items by identity).

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 5: Amount-ascending sort order invariant

*For any* list of transactions sorted with `"amount-asc"`, every adjacent pair of elements SHALL satisfy `transactions[i].amount ≤ transactions[i+1].amount`.

**Validates: Requirements 7.1, 7.2**

---

### Property 6: Amount-descending sort order invariant

*For any* list of transactions sorted with `"amount-desc"`, every adjacent pair of elements SHALL satisfy `transactions[i].amount ≥ transactions[i+1].amount`.

**Validates: Requirements 7.1, 7.2**

---

### Property 7: Category-alphabetical sort order invariant

*For any* list of transactions sorted with `"category-asc"`, every adjacent pair of elements SHALL satisfy `transactions[i].category ≤ transactions[i+1].category` (lexicographic comparison).

**Validates: Requirements 7.1, 7.2**

---

### Property 8: Whitespace-only names are rejected

*For any* string composed entirely of whitespace characters, the input validation logic SHALL classify it as invalid and reject the transaction.

**Validates: Requirements 1.4**

---

### Property 9: Non-positive amounts are rejected

*For any* numeric value that is zero, negative, or non-finite (NaN, ±Infinity), the input validation logic SHALL classify it as invalid and reject the transaction.

**Validates: Requirements 1.4**

---

### Property 10: Custom category persistence round-trip

*For any* list of custom category strings added by the user, saving state and reloading it SHALL restore exactly that list of custom categories in the category selector.

**Validates: Requirements 6.3, 6.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` read returns invalid JSON | `loadState` catches the parse error, discards the bad key, and returns `DEFAULT_STATE` |
| `localStorage` write throws (quota exceeded) | A `try/catch` in `saveState` logs a console warning; the in-memory state remains valid and the UI continues to function |
| `crypto.randomUUID()` unavailable (very old browser) | Fall back to a simple timestamp + Math.random ID |
| Chart.js CDN fails to load | The canvas remains blank; all other features are unaffected |
| Tailwind CDN fails to load | Tailwind classes have no effect; the page is functional but unstyled |
| User submits form with missing/invalid fields | Native HTML5 constraint validation plus a custom check; the form is not submitted and an inline message names the failing field |
| User attempts to add a duplicate or empty custom category | The addition is silently ignored; no error is thrown |

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and error conditions for the pure-function layer in `js/app.js`. They do not require a browser or DOM.

Recommended test runner: **Vitest** (zero-config, ESM-native). Run with `vitest --run` for single execution.

**Key unit test targets:**

- `computeBalance([])` returns `0`
- `computeBalance` with a single transaction returns that transaction's amount
- `computeCategoryTotals` with transactions in one category returns a single-entry object
- `loadState` with an empty `localStorage` returns `DEFAULT_STATE`
- `loadState` with corrupted JSON for one key returns defaults for that key only
- `sortTransactions` with an empty array returns an empty array
- Input validation rejects empty strings, whitespace-only strings, zero, and negative amounts
- Input validation accepts a valid `{name, amount, category}` triple

### Property-Based Tests

Property-based tests verify the correctness properties listed above across a wide range of randomly generated inputs.

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, works with Vitest).

**Configuration:** Each property test runs a **minimum of 100 iterations**.

**Tag format** (comment above each test):
```
// Feature: expense-budget-visualizer, Property N: <property_text>
```

**Property–test mapping:**

| Property | Test description |
|---|---|
| Property 1 | Generate random `AppState`, serialize and deserialize, assert deep equality |
| Property 2 | Generate random transaction array, assert `computeBalance` equals `array.reduce((s,t) => s+t.amount, 0)` |
| Property 3 | Generate random transaction array, assert sum of `computeCategoryTotals` values equals `computeBalance` |
| Property 4 | Generate random transaction array and sort option, assert `sortTransactions` output is a permutation of input |
| Properties 5–7 | Generate random array and each sort option, assert adjacent-pair invariant |
| Property 8 | Generate whitespace-only strings, assert validation returns invalid |
| Property 9 | Generate zero/negative/NaN/Infinity values, assert validation returns invalid |
| Property 10 | Generate random string arrays as custom categories, save and load state, assert restoration |

### Integration / Smoke Tests

These are manual or Playwright-based checks that verify the assembled page in a real browser:

- Page loads without console errors in Chrome, Firefox, Edge, and Safari.
- Adding a transaction updates the list, balance, and chart.
- Deleting a transaction removes it from the list, balance, and chart.
- Refreshing the page restores all transactions, custom categories, and theme.
- Theme toggle switches the `dark` class on `<html>` and persists across reload.
- Sort control reorders the transaction list immediately.
- Form validation prevents submission and shows a message when fields are empty.

PBT is not used for DOM interactions or Chart.js rendering because those are side-effect operations on external APIs; example-based integration tests provide adequate coverage there.
