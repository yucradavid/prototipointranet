# Tecnología del frontend (vistas del prototipo)

Inventario real de lo que usan las vistas hoy, extraído directamente de `package.json` y del código — no es una propuesta, es lo que ya está corriendo.

## Stack base

| Tecnología | Versión | Uso |
|---|---|---|
| [React](https://react.dev/) | 19.2.7 | Librería de UI. Todas las vistas son componentes funcionales con hooks (`useState`, `useEffect`, `useMemo`, `useRef`) — no hay clases. |
| [Vite](https://vite.dev/) | 8.2.2 | Servidor de desarrollo y bundler de producción. `npm run dev` / `npm run build` / `npm run preview`. |
| [@vitejs/plugin-react](https://www.npmjs.com/package/@vitejs/plugin-react) | 6.1.1 | Soporte de JSX + Fast Refresh para Vite. |
| JavaScript (JSX) | — | **No hay TypeScript.** Todo el código es `.js`/`.jsx` plano, sin tipado estático. |

`src/main.jsx` monta la app con `createRoot` dentro de `<React.StrictMode>`, sin ningún otro wrapper (sin Router, sin Provider de estado global).

## Sin router — navegación por estado interno

No se usa `react-router` ni ninguna librería de rutas. La vista activa es un `useState('activeView')` dentro de `App.jsx`; el menú lateral (`AppShell.jsx`) simplemente cambia ese estado. No hay URLs por pantalla — recargar la página siempre vuelve al login o a la última vista guardada en la sesión de `localStorage`.

## Manejo de estado

- **Sin librería de estado global** (no Redux, no Zustand, no Context API — `grep` de `createContext`/`useContext`/`useReducer` no encuentra nada en `src/`).
- Todo el estado vive en `useState` dentro de `App.jsx` (expedientes, catálogos, usuarios, sesión, etc.) y se pasa a las vistas por **props** ("prop drilling" explícito, sin capa intermedia).
- Persistencia: `src/repositories/prototypeRepository.js` lee/escribe ese estado en `localStorage` del navegador — no hay API HTTP ni base de datos real (ver `docs/HANDOFF_BACKEND.md` para el plan de reemplazo por Laravel + PostgreSQL).

## Estilos

- **Un solo archivo CSS plano**: `src/styles.css` (~3300 líneas), importado una vez en `main.jsx`. Sin Tailwind, sin Bootstrap, sin ningún framework de utilidades.
- **Sin CSS-in-JS** (no styled-components, no emotion). Los componentes combinan clases del stylesheet (`className="panel"`, `"hero-row"`, `"master-detail-grid"`, etc.) con `style={{...}}` inline puntual para casos dinámicos (colores por oficina, estados condicionales).
- **Variables CSS nativas** (`:root { --primary: ...; --arib-navy: ...; --space-1: ...; }`) como sistema de tokens de color, sombra, radio, espaciado y tipografía — sin preprocesador (no Sass/Less/PostCSS).
- Responsive con `@media` estándar, centralizado al final del archivo (breakpoints en 540px, 850px y 1200px).

## Componentes de UI compartidos

`src/components/ui.jsx` es la librería de componentes propia (no hay MUI, Chakra, shadcn ni ninguna librería de componentes de terceros). Expone: `Panel`, `Badge`, `StatusBadge`, `SlaBadge`, `PaymentStatusCard`, `Modal`, `Field`, `Toast`, `Kpi`, `Timeline`, `RouteStrip`, `FileList`, `RequirementsBlock`. Cada vista los combina con su propio JSX.

## Iconos

[lucide-react](https://lucide.dev/) 1.41.0 — única librería de iconos usada en todo el proyecto (`import { Search, Plus, ... } from 'lucide-react'`).

## Diagrama visual de rutas

[@xyflow/react](https://reactflow.dev/) (React Flow) 12.11.3 — usado exclusivamente en `src/views/WorkflowAdminView.jsx` para el lienzo interactivo de diseño de rutas (arrastrar oficinas, dibujar el flujo Mesa de Partes → Dirección → oficinas → Cierre). Es la única dependencia de UI de terceros del proyecto además de los iconos.

## Code-splitting

Las vistas exclusivas del rol Administrador se cargan de forma perezosa con `React.lazy` + `Suspense` (en `App.jsx`): `AdminOfficeOperationsView`, `AdminControlView`, `WorkflowAdminView`, `CatalogAdminView`, `BookAuditView`, `CashReportView`. Esto es lo que genera los chunks separados que se ven en `npm run build` (`WorkflowAdminView-*.js`, `CatalogAdminView-*.js`, etc.) — un estudiante o secretaría nunca descarga el código del panel de administración.

## Testing

- [`node:test`](https://nodejs.org/api/test.html) + `node:assert/strict` — el runner de pruebas **nativo de Node.js**, sin Jest ni Vitest.
- `npm run test:logic` corre `tests/*.test.mjs` (29 casos a la fecha).
- Cubre exclusivamente **lógica** (`src/workflowEngine.js`, `src/models/procedure.js`, `src/repositories/prototypeRepository.js`, `src/data/catalogs.js`) — no hay pruebas de componentes ni de UI (no React Testing Library, no Playwright/Cypress para las vistas). La verificación visual de este proyecto se hace manualmente en navegador.

## Calidad de código

No hay ESLint ni Prettier configurados en el repositorio (sin `.eslintrc`, sin `.prettierrc`) — el formato es el que cada archivo ya trae.

## Lo que esto NO es

Este stack es deliberadamente mínimo porque es un **prototipo de validación funcional**, no la versión de producción. Según `docs/HANDOFF_FRONTEND.md`, la versión real reemplazaría `localStorage` por llamadas HTTP a una API (Laravel 11 + PostgreSQL, ver `docs/HANDOFF_BACKEND.md`), pero mantendría la misma UI, flujo de pantallas y componentes como referencia visual ya validada.
