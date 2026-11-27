// =============================================================================
// expense-budget-visualizer ΓÇö app.js
// Vanilla JavaScript, no build tooling required.
// =============================================================================

// ---------------------------------------------------------------------------
// Data Models (JSDoc type definitions)
// ---------------------------------------------------------------------------

/**
 * A single spending record.
 *
 * @typedef {Object} Transaction
 * @property {string} id        - UUID v4 generated at creation time via crypto.randomUUID()
 * @property {string} name      - Item name (non-empty, whitespace-trimmed)
 * @property {number} amount    - Positive finite number representing the spend amount
 * @property {string} category  - One of the active category list entries
 * @property {number} createdAt - Unix timestamp (Date.now()) recorded when the transaction was created
 */

/**
 * The full application state held in memory and mirrored to localStorage.
 *
 * @typedef {Object} AppState
 * @property {Transaction[]}       transactions - Ordered list of all recorded transactions
 * @property {string[]}            categories   - Full category list (default + any user-added custom categories)
 * @property {SortOption}          sortOption   - The currently active sort order for the transaction list
 * @property {'dark' | 'light'}    theme        - The currently active visual theme
 */

/**
 * Valid sort order values for the transaction list.
 *
 * @typedef {'amount-asc' | 'amount-desc' | 'category-asc'} SortOption
 */

// ---------------------------------------------------------------------------
// Default State
// ---------------------------------------------------------------------------

/**
 * Immutable template used to initialise state when no persisted data exists.
 * Never mutate this object ΓÇö always deep-copy before use.
 *
 * @type {AppState}
 */
const DEFAULT_STATE = {
  transactions: [],
  categories: ['Food', 'Transport', 'Fun'],
  sortOption: 'amount-desc',
  theme: 'light',
};

// ---------------------------------------------------------------------------
// In-Memory State
// ---------------------------------------------------------------------------

/**
 * The single authoritative in-memory state object.
 * Initialised as a deep copy of DEFAULT_STATE; overwritten by loadState() on
 * DOMContentLoaded once localStorage is consulted.
 *
 * @type {AppState}
 */
let state = {
  transactions: [],
  categories: [...DEFAULT_STATE.categories],
  sortOption: DEFAULT_STATE.sortOption,
  theme: DEFAULT_STATE.theme,
};

// ---------------------------------------------------------------------------
// Persistence Layer
// ---------------------------------------------------------------------------

/**
 * localStorage key constants.
 */
const STORAGE_KEYS = {
  transactions: 'ebv_transactions',
  categories:   'ebv_categories',
  theme:        'ebv_theme',
  sort:         'ebv_sort',
};

/**
 * Serialize the current state and write it to localStorage.
 * Wraps the entire write in a try/catch so quota errors are non-fatal.
 *
 * @param {AppState} state
 * @returns {void}
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
    localStorage.setItem(STORAGE_KEYS.categories,   JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.theme,        state.theme);
    localStorage.setItem(STORAGE_KEYS.sort,         state.sortOption);
  } catch (err) {
    console.warn('[expense-budget-visualizer] Could not save state to localStorage:', err);
  }
}

/**
 * Read state from localStorage and return a fully-formed AppState.
 * Any missing key or JSON parse error falls back to the DEFAULT_STATE
 * value for that key only ΓÇö the remaining keys are still restored.
 *
 * @returns {AppState}
 */
function loadState() {
  // --- transactions ---
  let transactions = DEFAULT_STATE.transactions;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);
    if (raw !== null) {
      transactions = JSON.parse(raw);
    }
  } catch (_) {
    transactions = DEFAULT_STATE.transactions;
  }

  // --- categories ---
  let categories = [...DEFAULT_STATE.categories];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.categories);
    if (raw !== null) {
      categories = JSON.parse(raw);
    }
  } catch (_) {
    categories = [...DEFAULT_STATE.categories];
  }

  // --- theme ---
  let theme = DEFAULT_STATE.theme;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.theme);
    if (raw === 'dark' || raw === 'light') {
      theme = raw;
    }
  } catch (_) {
    theme = DEFAULT_STATE.theme;
  }

  // --- sortOption ---
  let sortOption = DEFAULT_STATE.sortOption;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sort);
    if (raw === 'amount-asc' || raw === 'amount-desc' || raw === 'category-asc') {
      sortOption = raw;
    }
  } catch (_) {
    sortOption = DEFAULT_STATE.sortOption;
  }

  return { transactions, categories, theme, sortOption };
}

// ---------------------------------------------------------------------------
// Balance Computation  (Requirement 3.1)
// ---------------------------------------------------------------------------

/**
 * Returns the arithmetic sum of all transaction amounts.
 * Returns 0 for an empty array.
 * Pure function ΓÇö no side effects, no DOM access, no mutation.
 *
 * @param {Transaction[]} transactions
 * @returns {number}
 */
function computeBalance(transactions) {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// ---------------------------------------------------------------------------
// Category Totals  (Requirement 4.2)
// ---------------------------------------------------------------------------

/**
 * Returns a plain object mapping each category name to its total spend amount.
 * Only categories that have at least one transaction appear in the result.
 * Pure function ΓÇö no side effects, no DOM access, no mutation.
 *
 * Example: [{ category: 'Food', amount: 5 }, { category: 'Food', amount: 7.5 }]
 *   ΓåÆ { Food: 12.5 }
 *
 * @param {Transaction[]} transactions
 * @returns {Record<string, number>}
 */
function computeCategoryTotals(transactions) {
  return transactions.reduce((totals, t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
    return totals;
  }, {});
}

// ---------------------------------------------------------------------------
// Currency Formatter  (IDR)
// ---------------------------------------------------------------------------

/**
 * Formats a number as Indonesian Rupiah, e.g. formatRupiah(25000) -> "Rp 25.000".
 * Uses the browser Intl API with the id-ID locale and IDR currency.
 * No decimal places -- Rupiah amounts are whole numbers.
 *
 * @param {number} value
 * @returns {string}
 */
function formatRupiah(value) {
  return value.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// Sort Transactions
// ---------------------------------------------------------------------------

/**
 * Returns a new array of transactions sorted according to the given sort option.
 * The input array is never mutated.
 *
 * Sort options:
 *   'amount-asc'   ΓÇö ascending by amount
 *   'amount-desc'  ΓÇö descending by amount
 *   'category-asc' ΓÇö lexicographic ascending by category name
 *   (unknown)      ΓÇö returns a shallow copy of the input, order unchanged
 *
 * @param {Transaction[]} transactions - The transactions to sort.
 * @param {SortOption}    sortOption   - The sort order to apply.
 * @returns {Transaction[]} A new sorted array.
 *
 * Requirements: 7.1, 7.2, 7.3
 */
function sortTransactions(transactions, sortOption) {
  const copy = [...transactions];

  switch (sortOption) {
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount);

    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount);

    case 'category-asc':
      return copy.sort((a, b) => a.category.localeCompare(b.category));

    default:
      // Unknown sort option ΓÇö return a copy in original order.
      return copy;
  }
}

// ---------------------------------------------------------------------------
// Input Validation (Requirement 1.4)
// ---------------------------------------------------------------------------

/**
 * Validates the fields of a prospective transaction.
 *
 * Rules:
 *  - name    : must be a non-empty string after whitespace trimming
 *  - amount  : must be a finite number greater than zero
 *  - category: must be a non-empty string present in the provided categories list
 *
 * @param {{ name: string, amount: unknown, category: string }} fields
 * @param {string[]} categories - The active category list to validate against
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTransaction({ name, amount, category }, categories) {
  const errors = [];

  // Validate item name
  if (typeof name !== 'string' || name.trim() === '') {
    errors.push('Item name is required.');
  }

  // Validate amount: must be a finite number strictly greater than zero
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }

  // Validate category: must be a non-empty string present in the categories list
  if (typeof category !== 'string' || category.trim() === '' || !categories.includes(category)) {
    errors.push('Please select a valid category.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Render Balance  (Requirements 3.1, 3.2, 3.3)
// ---------------------------------------------------------------------------

/**
 * Reads the current total from computeBalance and updates the #balance element.
 * Formats the value as Indonesian Rupiah using formatRupiah(), e.g. "Rp 25.000".
 *
 * @param {Transaction[]} transactions
 * @returns {void}
 */
function renderBalance(transactions) {
  const total = computeBalance(transactions);
  const formatted = formatRupiah(total);
  document.getElementById('balance').textContent = formatted;
}

// ---------------------------------------------------------------------------
// Render Categories  (Requirements 1.1, 1.2, 6.1, 6.2, 6.4)
// ---------------------------------------------------------------------------

/**
 * Syncs the #category <select> element with the provided categories array.
 *
 * Steps:
 *  1. Record the currently selected value so it can be restored if still valid.
 *  2. Clear all existing <option> elements.
 *  3. Append a blank placeholder option ("-- Select category --").
 *  4. Append one <option> per category in the supplied array.
 *  5. Re-select the previously chosen value if it still exists in the new list.
 *
 * This keeps the dropdown in sync whenever a custom category is added
 * or the saved category list is restored from localStorage on page load.
 *
 * @param {string[]} categories - The full list of categories (default + custom).
 * @returns {void}
 */
function renderCategories(categories) {
  const select = document.getElementById('category');

  // Preserve the current selection (may be '' if nothing was chosen yet).
  const previousValue = select.value;

  // Wipe existing options.
  select.innerHTML = '';

  // Blank placeholder.
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Select category --';
  select.appendChild(placeholder);

  // One option per category.
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Restore previous selection only if it still exists in the updated list.
  if (previousValue && categories.includes(previousValue)) {
    select.value = previousValue;
  }
}

// ---------------------------------------------------------------------------
// Chart Component  (Requirements 4.1, 4.2, 4.3, 4.4)
// ---------------------------------------------------------------------------

/**
 * Module-level reference to the active Chart.js instance.
 * Null until the first call to renderChart() with at least one transaction.
 *
 * @type {Chart|null}
 */
let chartInstance = null;

/**
 * Preset slice colors used for the pie chart.
 * Covers the three default categories plus up to three custom ones before
 * cycling; expand this array if more than 6 categories are expected.
 *
 * @type {string[]}
 */
const CHART_COLORS = [
  '#6366f1', // indigo-500   ΓÇô Food
  '#10b981', // emerald-500  ΓÇô Transport
  '#f59e0b', // amber-500    ΓÇô Fun
  '#ef4444', // red-500      ΓÇô custom 1
  '#3b82f6', // blue-500     ΓÇô custom 2
  '#8b5cf6', // violet-500   ΓÇô custom 3
  '#ec4899', // pink-500     ΓÇô custom 4
  '#14b8a6', // teal-500     ΓÇô custom 5
];

/**
 * Renders or updates the pie chart inside `#spending-chart`.
 *
 * Behaviour:
 *   - If `transactions` is empty, any existing chart is destroyed and the
 *     canvas is cleared so the element returns to a blank state.
 *   - If `chartInstance` already exists, its data is replaced in-place and
 *     `chartInstance.update()` is called ΓÇö the Chart instance is never
 *     destroyed and recreated unnecessarily.
 *   - If `chartInstance` is null, a new `Chart` of type `'pie'` is created.
 *
 * @param {Transaction[]} transactions - The current transaction list.
 * @returns {void}
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
function renderChart(transactions) {
  const canvas = document.getElementById('spending-chart');
  if (!canvas) return; // Guard: canvas element not present in the DOM

  const emptyEl = document.getElementById('chart-empty');

  // ----- Empty-state handling -----
  if (transactions.length === 0) {
    if (chartInstance !== null) {
      chartInstance.destroy();
      chartInstance = null;
    }
    // Clear any residual pixels on the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Show empty state, hide canvas
    canvas.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  // Show canvas, hide empty state
  canvas.classList.remove('hidden');
  if (emptyEl) emptyEl.classList.add('hidden');

  // ----- Compute data -----
  const totals   = computeCategoryTotals(transactions);
  const labels   = Object.keys(totals);
  const data     = labels.map(label => totals[label]);
  const colors   = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  // ----- Update existing instance -----
  if (chartInstance !== null) {
    chartInstance.data.labels             = labels;
    chartInstance.data.datasets[0].data   = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.update();
    return;
  }

  // ----- Create new instance -----
  const ctx = canvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { size: 13 },
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return ` ${formatRupiah(value)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Render Functions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// renderList  (Requirements 2.1, 2.2, 7.2, 7.3)
// ---------------------------------------------------------------------------

/**
 * Renders the transaction list into the `#transaction-list` element.
 *
 * Steps:
 *  1. Sort the transactions using `sortTransactions` so the active sort order
 *     is always respected, including when new items are added (Req 7.3).
 *  2. Clear the existing list contents.
 *  3. If there are no transactions, show a placeholder message.
 *  4. Otherwise create one `<li>` per transaction containing:
 *     - Item name
     - Amount formatted as Indonesian Rupiah using formatRupiah()
 *     - Category shown as a coloured badge
 *     - A delete button carrying a `data-id` attribute for event delegation
 *
 * Pure DOM side-effect ΓÇö does not mutate state or touch localStorage.
 *
 * @param {Transaction[]} transactions - All recorded transactions.
 * @param {SortOption}    sortOption   - The currently active sort order.
 * @returns {void}
 */
function renderList(transactions, sortOption) {
  const listEl = document.getElementById('transaction-list');
  if (!listEl) return;

  // Sort without mutating the original array.
  const sorted = sortTransactions(transactions, sortOption);

  // Clear current contents.
  listEl.innerHTML = '';

  // Empty-state placeholder (Req 2.1).
  if (sorted.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.className =
      'px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500 italic';
    placeholder.textContent = 'No transactions yet.';
    listEl.appendChild(placeholder);
    return;
  }

  // Build one <li> per transaction (Req 2.1, 2.2).
  sorted.forEach((transaction) => {
    const li = document.createElement('li');
    li.className =
      'flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';

    // --- Left side: name + category badge ---
    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex flex-col gap-0.5 min-w-0';

    const nameSpan = document.createElement('span');
    nameSpan.className =
      'text-sm font-medium text-gray-800 dark:text-gray-100 truncate';
    nameSpan.textContent = transaction.name;

    const badge = document.createElement('span');
    badge.className =
      'inline-block self-start text-xs font-semibold px-2 py-0.5 rounded-full ' +
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
    badge.textContent = transaction.category;

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(badge);

    // --- Right side: amount + delete button ---
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flex items-center gap-3 shrink-0';

    const amountSpan = document.createElement('span');
    amountSpan.className =
      'text-sm font-semibold text-gray-700 dark:text-gray-200 tabular-nums';
    amountSpan.textContent = formatRupiah(transaction.amount);
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.dataset.id = transaction.id;
    deleteBtn.className =
      'text-xs font-medium px-2 py-1 rounded-md ' +
      'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 ' +
      'transition-colors';
    deleteBtn.textContent = 'Delete';
    // aria label for accessibility
    deleteBtn.setAttribute('aria-label', `Delete ${transaction.name}`);

    actionsDiv.appendChild(amountSpan);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);

    listEl.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// renderAll  (Requirements 3.2, 3.3, 4.3, 4.4)
// ---------------------------------------------------------------------------

/**
 * Re-renders the entire UI from the current application state.
 *
 * Call this function after every state mutation and on page load.
 * It delegates to each individual render function in the correct order:
 *   1. renderCategories ΓÇö keeps the category <select> in sync with state.categories
 *   2. renderBalance    ΓÇö updates the displayed total spend
 *   3. renderList       ΓÇö rebuilds the sorted transaction list
 *   4. renderChart      ΓÇö updates (or creates/destroys) the pie chart
 *
 * @param {AppState} state - The current application state.
 * @returns {void}
 *
 * Requirements: 3.2, 3.3, 4.3, 4.4
 */
function renderAll(state) {
  renderCategories(state.categories);
  renderBalance(state.transactions);
  renderList(state.transactions, state.sortOption);
  renderChart(state.transactions);
}

// ---------------------------------------------------------------------------
// Theme Application  (Requirements 8.2, 8.3, 8.4)
// ---------------------------------------------------------------------------

/**
 * Applies the given theme by toggling the `dark` class on `<html>`.
 * Called on page load (from DOMContentLoaded) to restore the saved theme,
 * and called by handleThemeToggle (task 7.5) on each user-initiated switch.
 *
 * @param {'dark' | 'light'} theme
 * @returns {void}
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';

  // 1. Toggle the dark class on <html> (Tailwind darkMode: 'class').
  document.documentElement.classList.toggle('dark', isDark);

  // 2. Sync the toggle button icon, label, and aria-pressed.
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const iconLight = btn.querySelector('.theme-icon-light');
  const iconDark  = btn.querySelector('.theme-icon-dark');
  const label     = btn.querySelector('.theme-label');

  if (iconLight) iconLight.classList.toggle('hidden', isDark);
  if (iconDark)  iconDark.classList.toggle('hidden', !isDark);
  if (label)     label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
}

// ---------------------------------------------------------------------------
// Event Handler Stubs  (Tasks 7.1 ΓÇô 7.5 will implement these)
// ---------------------------------------------------------------------------

/**
 * Handles transaction form submission.
 * TODO: implement in task 7.1
 *
 * @param {SubmitEvent} event
 * @returns {void}
 */
function handleFormSubmit(event) {
  event.preventDefault();

  // Read form field values
  const name     = document.getElementById('item-name').value;
  const amount   = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;

  // Validate
  const result = validateTransaction({ name, amount, category }, state.categories);
  const errorEl = document.getElementById('form-error');

  if (!result.valid) {
    errorEl.textContent = result.errors[0];
    errorEl.classList.remove('hidden');
    return;
  }

  // Hide any previous error
  errorEl.classList.add('hidden');

  // Build the new transaction
  const newTransaction = {
    id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2),
    name:      name.trim(),
    amount,
    category,
    createdAt: Date.now(),
  };

  // Persist and re-render
  state.transactions.push(newTransaction);
  saveState(state);
  renderAll(state);

  // Clear the form
  event.target.reset();
}

/**
 * Handles deletion of a transaction by its id.
 * TODO: implement in task 7.2
 *
 * @param {string} id - The id of the transaction to delete
 * @returns {void}
 */
function handleDelete(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveState(state);
  renderAll(state);
}

/**
 * Handles adding a new custom category.
 * TODO: implement in task 7.3
 *
 * @returns {void}
 */
function handleAddCategory() {
  const input = document.getElementById('add-category-input');
  const trimmed = input.value.trim();

  // Silently return if empty or already exists (case-insensitive).
  if (trimmed === '') return;
  const alreadyExists = state.categories.some(
    (cat) => cat.toLowerCase() === trimmed.toLowerCase()
  );
  if (alreadyExists) return;

  // Add the new category to state.
  state.categories.push(trimmed);

  // Persist and sync the dropdown.
  saveState(state);
  renderCategories(state.categories);

  // Clear the input.
  input.value = '';
}

/**
 * Handles sort-select change events.
 * TODO: implement in task 7.4
 *
 * @param {Event} event
 * @returns {void}
 */
function handleSortChange(event) {
  state.sortOption = event.target.value;
  saveState(state);
  renderList(state.transactions, state.sortOption);
}

/**
 * Handles theme-toggle click events.
 * TODO: implement in task 7.5
 *
 * @returns {void}
 */
function handleThemeToggle() {
  // 1. Toggle the theme in state.
  state.theme = state.theme === 'dark' ? 'light' : 'dark';

  // 2. Apply the theme (dark class, button icon/label, aria-pressed).
  applyTheme(state.theme);

  // 3. Persist the new theme preference to localStorage.
  saveState(state);
}

// ---------------------------------------------------------------------------
// App Initialisation  (Requirements 5.3, 6.4, 8.4)
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // 1. Restore persisted state (or fall back to DEFAULT_STATE).
  state = loadState();

  // 2. Apply the saved theme before anything is painted.
  applyTheme(state.theme);

  // 3. Populate the full UI from the restored state.
  renderAll(state);

  // Sync the sort select to the restored sort preference.
  document.getElementById('sort-select').value = state.sortOption;

  // 4. Attach event listeners.

  // Form submission ΓÇö add a new transaction.
  document.getElementById('transaction-form')
    .addEventListener('submit', handleFormSubmit);

  // Event delegation on the list ΓÇö delete a transaction by its id.
  // Use closest() so clicks on child nodes inside the button still resolve.
  document.getElementById('transaction-list')
    .addEventListener('click', (e) => {
      const btn = e.target.closest('[data-id]');
      if (btn) {
        handleDelete(btn.dataset.id);
      }
    });

  // Sort-select change ΓÇö reorder the transaction list.
  document.getElementById('sort-select')
    .addEventListener('change', handleSortChange);

  // Theme toggle ΓÇö switch dark / light mode.
  document.getElementById('theme-toggle')
    .addEventListener('click', handleThemeToggle);

  // Add-category button ΓÇö append a new custom category.
  document.getElementById('add-category-btn')
    .addEventListener('click', handleAddCategory);
});
