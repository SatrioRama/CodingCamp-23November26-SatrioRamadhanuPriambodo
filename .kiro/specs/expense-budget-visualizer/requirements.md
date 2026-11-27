# Requirements Document

## Introduction

A mobile-friendly single-page web application that helps users track daily spending. The app displays a running total balance, a scrollable transaction history, and a pie chart of spending by category. It is built with HTML, CSS, and Vanilla JavaScript — no backend or build tooling required. All data persists in the browser's Local Storage. Tailwind CSS (Play CDN) and Chart.js (CDN) are the only external libraries permitted.

## Glossary

- **App**: The expense-budget-visualizer single-page web application.
- **Transaction**: A single spending record consisting of an item name, a numeric amount, and a category.
- **Category**: A label that classifies a transaction. Default categories are Food, Transport, and Fun. Users may also add custom categories.
- **Input_Form**: The HTML form through which users create new transactions.
- **Transaction_List**: The scrollable on-screen list that displays all recorded transactions.
- **Balance_Display**: The UI element at the top of the page that shows the current total of all transaction amounts.
- **Chart**: The Chart.js pie chart showing spending distribution by category.
- **Local_Storage**: The browser's Web Storage API used to persist all transaction data client-side.
- **Sort_Control**: The UI control that changes the display order of items in the Transaction_List.
- **Theme_Toggle**: The UI control that switches the App between dark and light visual modes.

---

## Requirements

### Requirement 1: Input Form

**User Story:** As a user, I want to fill in an item name, amount, and category and submit the form, so that a new transaction is recorded.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for item name, a numeric field for amount, and a selector for category.
2. THE Input_Form SHALL populate the category selector with the default options Food, Transport, and Fun.
3. WHEN the user submits the Input_Form with all fields filled, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
4. IF the user submits the Input_Form with any field empty, THEN THE Input_Form SHALL prevent submission and display a validation message indicating which fields are required.
5. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my transactions in a scrollable list, so that I can review and manage my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction's item name, amount, and category.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area.
3. WHEN the user deletes a transaction, THE App SHALL remove that transaction from the Transaction_List and from Local_Storage.

---

### Requirement 3: Total Balance

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts.
2. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.

---

### Requirement 4: Visual Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand how my money is distributed.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart using the Chart.js library loaded via CDN.
2. THE Chart SHALL display one segment per category that has at least one transaction, sized proportionally to that category's total amount.
3. WHEN a transaction is added, THE Chart SHALL update automatically to reflect the new category totals.
4. WHEN a transaction is deleted, THE Chart SHALL update automatically to reflect the new category totals.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the full transaction list to Local_Storage.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction list to Local_Storage.
3. WHEN the App loads, THE App SHALL read all transactions from Local_Storage and restore the Transaction_List, Balance_Display, and Chart to the persisted state.

---

### Requirement 6: Custom Categories

**User Story:** As a user, I want to add my own categories beyond the defaults, so that I can classify transactions in ways that fit my personal spending habits.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a mechanism for the user to add a new custom category name.
2. WHEN the user adds a custom category, THE Input_Form SHALL append that category to the category selector immediately.
3. WHEN the user adds a custom category, THE App SHALL persist the custom category list to Local_Storage so it is available after a page reload.
4. WHEN the App loads, THE App SHALL restore all previously saved custom categories into the category selector.

---

### Requirement 7: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or by category, so that I can find and compare entries more easily.

#### Acceptance Criteria

1. THE Sort_Control SHALL offer the options: sort by amount (ascending), sort by amount (descending), and sort by category (alphabetical).
2. WHEN the user selects a sort option, THE Transaction_List SHALL reorder its displayed items according to that option immediately.
3. WHILE a sort option is active, THE Transaction_List SHALL maintain that sort order when new transactions are added.

---

### Requirement 8: Dark / Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light visual modes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_Toggle SHALL allow the user to switch between dark mode and light mode.
2. WHEN the user activates dark mode, THE App SHALL apply a dark color scheme to all visible UI elements.
3. WHEN the user activates light mode, THE App SHALL apply a light color scheme to all visible UI elements.
4. WHEN the App loads, THE App SHALL restore the last selected theme from Local_Storage.

---

### Requirement 9: Technology and File Structure

**User Story:** As a developer, I want the app built with a constrained, simple stack and a clean file layout, so that the codebase is easy to read and requires no build tooling.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript — no JavaScript frameworks are permitted.
2. THE App SHALL load Tailwind CSS and Chart.js exclusively via CDN links; no local copies or build steps are required.
3. THE App SHALL contain exactly one CSS file located inside a `css/` directory.
4. THE App SHALL contain exactly one JavaScript file located inside a `js/` directory.
5. THE App SHALL function correctly in current stable releases of Chrome, Firefox, Edge, and Safari without any installation or setup step.
