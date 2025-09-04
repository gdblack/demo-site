# Copilot Instructions for AI Agents

## Overview
This monorepo contains two main projects:
- **next/**: Next.js frontend (TypeScript)
- **strapi/**: Strapi backend (TypeScript, headless CMS)

## Architecture & Data Flow
- The frontend (`next/`) fetches content/data from the backend (`strapi/`) via REST APIs defined in `strapi/src/api/`.
- Content types and components are defined in `strapi/src/api/page/content-types/` and `strapi/src/components/`.
- Strapi manages content and exposes endpoints; Next.js renders pages using this data.

## Key Workflows
### Install dependencies (from root):
- `cd next && npm install` (or `yarn`)
- `cd strapi && npm install` (or `yarn`)

### Start development servers:
- **Frontend:**
  - `cd next && npm run dev`
  - Access at [http://localhost:3000](http://localhost:3000)
- **Backend:**
  - `cd strapi && npm run develop`
  - Admin panel at [http://localhost:1337/admin](http://localhost:1337/admin)

### Build for production:
- **Frontend:** `cd next && npm run build`
- **Backend:** `cd strapi && npm run build`

## Project Conventions & Patterns
- **TypeScript** is used throughout both projects.
- **Next.js** entry: `next/app/page.tsx`; global styles: `next/app/globals.css`.
- **Strapi** config: `strapi/config/`; API logic: `strapi/src/api/`; components: `strapi/src/components/`.
- **Content types** and **components** are JSON schema files in Strapi.
- **Database migrations**: `strapi/database/migrations/`.
- **Static assets**: `next/public/` (frontend), `strapi/public/` (backend).

## Integration Points
- Next.js fetches data from Strapi endpoints (see `strapi/src/api/page/routes/page.ts`).
- Custom Strapi services/controllers live in `strapi/src/api/page/services/` and `controllers/`.

## Examples
- To add a new content type: create a schema in `strapi/src/api/[name]/content-types/` and update related controllers/services.
- To add a new frontend page: add a file in `next/app/` (e.g., `about/page.tsx`).

## Additional Notes
- Use the respective `README.md` files in each project for more details.
- Keep backend/frontend dependencies isolated unless cross-communication is required via API.

---
For any unclear conventions or missing documentation, check the `README.md` files or ask for clarification.
