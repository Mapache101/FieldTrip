# CampQuest - SCIS School Camping Trip Planner & Coordinator

An interactive school expedition planning and logistics platform for Palermo, Santa Cruz, Bolivia. Designed for educators and outdoor trip coordinators to manage schedules, student cohorts, supervision ratios, supplies, and real-time SCIS Firebase rosters.

## Features

- **Interactive Timelines & Desk Board**: Drag-and-drop schedule planner with Gantt-style duration bars, sunset indicators, and timeline validation.
- **SCIS Firebase Roster Sync**: Real-time connection to the Santa Cruz International School (`scis-house-points`) Firestore database. Import student rosters by classroom (`4sA`, `5sB`, `8th Grade`) or House (`Centaurs`, `Pegasus`, `Titans`, `Unicorns`).
- **Cohort Wave Management**: Split students into Group 1 (Alpha Wave) and Group 2 (Bravo Wave) with dedicated timeline and desk filtering.
- **Interactive Topographic Map**: Leaflet-powered GIS station map with camp checkpoints, hiking trails, creek exploration points, and GPS coordinates.
- **Expedition Manifest**: Chaperone supervision ratio tracking (1:10 safety limits), equipment checklists, dietary & medical requirements, and print-ready summary exports.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

## Deploying to GitHub Pages

This repository is pre-configured for GitHub Pages:

1. Push this repository to GitHub (e.g. `main` branch).
2. Go to your repository on GitHub -> **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` will automatically build and publish your applet.
