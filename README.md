# Task Manager

A simple full-stack task management app.

- **Backend:** Node.js + Express — REST API
- **Database:** SQLite (via `better-sqlite3`) — file-based, zero setup
- **Frontend:** Vanilla HTML/CSS/JS (no build step), served by the same Express server

## Getting Started

    cd backend
    npm install
    npm start

Then open http://localhost:3000. The SQLite database file is created automatically at
`backend/data/tasks.db` on first run.

## API

| Method | Endpoint      | Purpose         |
|--------|---------------|-----------------|
| GET    | /tasks        | List tasks (supports `status`, `priority`, `search`, `page`, `limit`, `sortBy`, `order`) |
| GET    | /tasks/:id    | Get one task    |
| POST   | /tasks        | Create a task   |
| PUT    | /tasks/:id    | Update a task   |
| DELETE | /tasks/:id    | Delete a task   |

Task fields: `id`, `title`, `description`, `status` (`Pending`/`Completed`), `priority` (`Low`/`Medium`/`High`), `createdAt`, `updatedAt`.
