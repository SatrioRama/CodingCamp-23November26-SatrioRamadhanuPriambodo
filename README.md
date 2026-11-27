# Expense & Budget Visualizer

A mobile-friendly web app that helps users track their daily spending. It shows the total balance, a history of transactions, and a visual chart of spending by category.

🔗 **Live Demo:** https://satriorama.github.io/CodingCamp-23November26-SatrioRamadhanuPriambodo/

## Features

### Required (MVP)
- **Input Form** – Item Name, Amount (Rp), Category (Food, Transport, Fun) with validation
- **Transaction List** – Scrollable list showing name, amount, and category, with delete
- **Total Balance** – Displayed at the top in Rupiah, updates automatically
- **Visual Chart** – Pie chart of spending by category (Chart.js), updates automatically

### Optional Challenges
- Add custom categories
- Sort transactions by amount or category
- Dark/light mode toggle

## Tech Stack
- HTML
- CSS + Tailwind CSS (Play CDN)
- Vanilla JavaScript
- Chart.js (CDN)
- Browser Local Storage (data saved client-side only)

## Project Structure

| Path | Description |
|------|-------------|
| `index.html` | Main page |
| `css/style.css` | Custom styles |
| `js/app.js` | App logic |
| `.kiro/specs/` | Kiro specs (requirements, design, tasks) |

## How to Run
No setup needed. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari), or visit the live demo link above.

## Built With Kiro
This project was planned and built using Kiro spec-driven development. See the `.kiro/specs/expense-budget-visualizer/` folder.