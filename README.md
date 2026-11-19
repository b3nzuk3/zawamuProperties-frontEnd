# Welcome to your Zawamu Properties project

## Project info

**URL**:

## How can I edit this code?

You can edit your application in several ways:

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Phase A: owner-aware admin access and tests

Read `AGENTS.md`, `handoff.md`, and `docs/phase-a-baseline.md`. Phase A is a checkpoint; do not start Phase B before user approval.

Use npm with the committed package lock:

```sh
npm ci
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

`typecheck` checks the application and Node/Vite configuration, rather than only the empty solution config. Baseline application typing/lint errors are documented separately; do not suppress them or report a clean repository-wide gate without proof. Vitest/React Testing Library fixtures are simulated UI/API responses, not evidence of production authentication.

Configure `VITE_API_URL` with the backend base including `/api`. Backend login and profile return `{ id, name, email, isAdmin }`. Only `isAdmin === true` enables owner routes/navigation; missing flags fail closed. This UI is not a security boundary: the backend independently checks its current persisted account against backend-only `ADMIN_EMAILS` on each protected request. Never put that allowlist in a `VITE_` variable.

Anonymous admin navigation goes to sign-in; ordinary accounts cannot mount admin pages and go to their dashboard; owners can enter admin routes. Session restoration must not resurrect an earlier account after logout or a newer login.

No Phase B–F rental/feature/contact/discount work or production deployment is included in this checkpoint.

## How can I deploy this project?

You can deploy this project using your preferred hosting provider (e.g., Vercel, Netlify, etc.).

## Can I connect a custom domain?

Yes, most hosting providers allow you to connect a custom domain to your deployed project.
