# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build

# Format code with Prettier
pnpm format
```

## Architecture Overview

### Technology Stack
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** as build tool
- **PrimeVue** component library with Aura theme
- **Tailwind CSS 4** for styling
- **Pinia** for state management
- **Vue Router** for navigation
- **Axios** for API communication
- **Vuelidate** for form validation

### Project Structure

The application follows a feature-based structure with clear separation of concerns:

- **Views** (`/src/views/`): Page-level components organized by feature domain
- **Components** (`/src/components/`): Reusable UI components grouped by feature
- **Stores** (`/src/stores/`): Pinia stores for state management
- **Services** (`/src/services/`): API service layer for backend communication
- **Composables** (`/src/composables/`): Vue composition functions for shared logic
- **Guards** (`/src/guards/`): Route guards for authentication and authorization
- **Types** (`/src/types/`): TypeScript type definitions

### Authentication & Authorization

The application implements role-based access control with the following roles:
- `admin`: Full system access
- `juez`: Judge role with expediente management
- `presidente_audiencia`: Court president role
- `secretario_general`: General secretary role
- `director_prensa` / `tecnico_prensa`: Press management roles

Authentication flow:
1. JWT-based authentication with access/refresh tokens
2. Tokens stored in localStorage
3. Auth state managed by Pinia store (`useAuthStore`)
4. Route guards enforce role-based access

### API Configuration

- Base URL configured via `VITE_API_URL` environment variable
- All API endpoints defined in `/src/api/config.ts`
- Axios instance with request/response interceptors in `/src/api/axios.ts`
- Automatic token refresh on 401 responses

### Code Conventions

- **Prettier** formatting: no semicolons, single quotes, 100 char line width
- **Path alias**: `@` maps to `/src` directory
- **Component naming**: PascalCase for components, kebab-case for files
- **Composition API**: Use `<script setup>` syntax for Vue components
- **TypeScript**: Strict typing with interface/type definitions in `/src/types/`

### Key Features

1. **Dashboard**: Role-specific dashboards with statistics and pending tasks
2. **Expedientes**: Legal case management with approval workflow
3. **News Management**: Multi-level approval system for news publication
4. **Document Management**: File upload/download with expediente association
5. **Contact System**: Public contact form with internal assignment workflow