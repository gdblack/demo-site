# Demo Site

This repository contains a monorepo setup with two main projects:

- **next/**: A Next.js frontend application
- **strapi/**: A Strapi backend (headless CMS)

---

## Project Structure

```
next/      # Next.js frontend app
strapi/    # Strapi backend (API & CMS)
```

### next/
- Built with Next.js (TypeScript)
- Contains all frontend code
- Entry point: `app/page.tsx`
- Global styles: `app/globals.css`
- Static assets: `public/`

### strapi/
- Built with Strapi (TypeScript)
- Contains all backend code, API, and content types
- Configurations in `config/`
- API logic in `src/api/`
- Components in `src/components/`
- Database migrations in `database/migrations/`

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Install Dependencies

#### Next.js frontend
```bash
cd next
npm install
```

#### Strapi backend
```bash
cd strapi
npm install
```

### Running the Projects

#### Start Next.js frontend
```bash
cd next
npm run dev
```

#### Start Strapi backend
```bash
cd strapi
npm run develop
```

---

## Development Notes
- The frontend and backend run independently.
- Update Strapi content types and components in `strapi/src/` as needed.
- API endpoints are defined in `strapi/src/api/`.
- Frontend fetches data from Strapi API endpoints.

---

## License
See `strapi/license.txt` for backend license details.
