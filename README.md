# Job Hunt Board 🎯

A kanban board for the job hunt. Drag applications from **Applied** to **Interview** to **Offer** (or **Rejected**), keep notes, links and priorities, and watch your pipeline stats update live.

**Live demo:** https://malakmo7amed309.github.io/job-hunt-board/

## Features

- Drag & drop cards between and within columns (@dnd-kit)
- Add, edit and delete applications (company, role, location, salary, link, priority, notes)
- Live pipeline stats: total applications, interviews, offers, response rate
- Instant search across company, role, location and notes
- Everything persists in `localStorage` — no account, no backend
- Ships with realistic demo data you can reset any time
- Fully responsive: horizontal board scroll on mobile, touch drag support

## Stack

React · Vite · Tailwind CSS v4 · @dnd-kit

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build is a single self-contained `index.html` (via `vite-plugin-singlefile`), served from this repo's `docs/` folder with GitHub Pages.

---

Built by [Malak Mohamed](https://malakmo7amed309.github.io/) as a portfolio project.
