# TodoApp

The Angular application stores its tasks through a small Node.js API. The API persists them in `back-end/data/todos.json`, so they remain available after restarting the server.

## Run the application

Use two terminals from the project folder:

1. Start the backend:
   ```
   cd back-end
   npm start
   ```
2. Start the frontend:
   ```
   cd front-end
   npm start
   ```

Open `http://localhost:4200/`. The backend listens on `http://localhost:3000/`.
