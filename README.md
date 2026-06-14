# Mini Task Manager

A simple full-stack task manager application built with React, Node.js, Express, and TypeScript.
This project was developed as a take-home task to demonstrate end-to-end feature building, architectural decisions, and clean code practices.

## How to Run

### Backend
1. Open a terminal and navigate to the `backend` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the backend server on `http://localhost:3001`.

### Frontend
1. Open a terminal and navigate to the `frontend` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the frontend server.
4. Open the displayed local URL (usually `http://localhost:5173`) in your browser.

## Architecture & Tech Stack

- **Frontend:** React + TypeScript + Vite. It uses a component-based architecture with `axios` for API calls and standard CSS for simple, clean styling. State is managed via React Hooks.
- **Backend:** Node.js + Express + TypeScript. It exposes RESTful API endpoints. 
- **Data Persistence:** In-memory variables are used for storing `Tasks` and `AuditLogs` to keep the setup minimal and prevent complex local environment configurations. Data is reset upon server restart.

## Assumptions & Trade-offs

### Assumptions
- Since no specific complex persistence layer was mandated ("Data boleh disimpan di memory"), I assumed in-memory storage would best fulfill the request for "sederhana tapi jelas" (simple but clear) without creating overhead for the reviewer.
- Actors in the audit log are simulated using a dropdown instead of actual authentication, to meet the "No Overengineering" and "UI kompleks" restriction.

### Trade-offs
- **In-Memory Store vs Database:** Chose in-memory for speed of delivery and zero setup for the reviewer, trading off data persistence across server restarts.
- **Standard CSS vs Tailwind/UI Libraries:** Chose standard CSS to keep the dependency footprint small and the code easily readable, trading off the speed of utility classes.

## Future Improvements (If there was more time)
- Add a proper database (e.g., PostgreSQL with Prisma ORM) for persistent data.
- Add comprehensive Unit and Integration testing using Jest/Supertest.
- Implement proper user authentication (JWT) to accurately track the "Actor" instead of a dropdown.
- Add pagination and filtering to the Task List and Audit Logs.

---

## Technical Questions

### Bagaimana kamu memastikan audit log tidak ter-modifikasi?
Audit logs are only created internally by the backend during the `PUT /tasks/:id/status` endpoint execution. There are intentionally no `PUT`, `PATCH`, or `DELETE` endpoints exposed for the `/audit-logs` resource. Because the data structure (`store.auditLogs`) is managed exclusively by the server logic and no external modification endpoints exist, the logs are effectively immutable from the client's perspective. In a production scenario, we would use an append-only database table or database triggers to ensure absolute immutability.

### Bagian mana dari solusi ini yang paling berisiko jika digunakan oleh banyak user?
The most critical risk with the current in-memory implementation is **Concurrency and Race Conditions**. If multiple users try to update the exact same task at the exact same millisecond, the status validation might process stale data before the memory is updated, leading to inconsistent audit logs or invalid state transitions. Additionally, the memory will eventually run out if thousands of tasks and logs are created since there is no pagination or memory management.

### Jika task ini berkembang menjadi sistem besar, bagian mana yang akan kamu refactor terlebih dahulu dan kenapa?
The very first component to refactor would be the **Data Layer (In-Memory Store)**. 
I would replace `store.ts` with a robust relational database (like PostgreSQL) and an ORM (like Prisma or TypeORM). 
**Why:**
1. To ensure data persistence.
2. To handle concurrent updates safely using database transactions and row-level locking.
3. To allow for horizontal scaling (currently, multiple server instances would have completely separate in-memory states).

### Penggunaan AI
AI (Gemini) was used as a pair-programming assistant to:
1. Scaffold the boilerplate configuration files (package.json, tsconfig.json).
2. Generate the repetitive REST API boilerplate (Express routes).
3. Draft the CSS styling to ensure a clean UI rapidly.
I validated the AI's output by manually reviewing the status transition logic (`isValidTransition`), the idempotency checks, and testing the API endpoints to ensure they align exactly with the requirement constraints.
