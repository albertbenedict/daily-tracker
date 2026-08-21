# Daily Tracker — Todos + Habits

Minimal vanilla JS app to manage daily todos and track habit streaks. Built as my first portfolio project. (will soon update and and more features lol)

**Live Demo:** `https://albertbenedict.github.io/daily-tracker/` (after Pages deploy)

## Features
- **Todos:** add, toggle complete, delete, filter All/Active/Done, counter `0 left • N total`, Clear done, duplicate guard, localStorage
- **Habits:** add, check today, streak 🔥, undo, delete, duplicate guard, streak logic (yesterday → +1 else reset to 1), localStorage
- Tabs, theme toggle (light/dark persists), responsive, input autofocus

## Tech
- HTML, CSS (variables `--bg-color` etc.), vanilla JS (DOM, arrays, dates, `localStorage` + `JSON.stringify/parse`)
- No frameworks, no backend

## How to run
1. Open `index.html` in browser, or
2. `npx serve .` in `daily-tracker/` then open `http://localhost:3000`

Data saved in browser under keys `daily-tracker-todos`, `daily-tracker-habits`.

## Structure
- `index.html` — tabs, forms, lists
- `style.css` — variables, layout, responsive
- `app.js` — helpers `getTodayString`, `loadJSON/saveJSON`, tabs, todos CRUD, habits streak

## V1 → V2
- V1: polished todos + habits as standalone
- V2 plan: optional link Todos → Habits (e.g., `↻ Make habit` button), better mobile polish, optional duration for todos/habits + time tracking 
