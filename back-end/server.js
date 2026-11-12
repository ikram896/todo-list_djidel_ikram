const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const defaultDataFile = path.join(__dirname, 'data', 'todos.json');

async function readTodos(dataFile) {
  try {
    return JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, '[]\n', 'utf8');
    return [];
  }
}

async function saveTodos(dataFile, todos) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryFile, dataFile);
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': 'http://localhost:4200',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
}

function createServer({ dataFile = defaultDataFile } = {}) {
  return http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      response.end();
      return;
    }

    const url = new URL(request.url, 'http://localhost');
    const basePath = '/api/todos';

    try {
      let todos = await readTodos(dataFile);

      if (url.pathname === basePath && request.method === 'GET') {
        sendJson(response, 200, todos);
        return;
      }

      if (url.pathname === basePath && request.method === 'POST') {
        const body = await readBody(request);
        if (!body || typeof body !== 'object' || Array.isArray(body)
          || typeof body.title !== 'string' || !body.title.trim()) {
          sendJson(response, 400, { message: 'A task title is required.' });
          return;
        }

        const id = todos.reduce((maximum, todo) => Math.max(maximum, todo.id), 0) + 1;
        todos.push({ id, title: body.title.trim(), status: 'in-progress' });
        await saveTodos(dataFile, todos);
        sendJson(response, 201, todos);
        return;
      }

      if (url.pathname === `${basePath}/completed` && request.method === 'DELETE') {
        todos = todos.filter(todo => todo.status !== 'done');
        await saveTodos(dataFile, todos);
        sendJson(response, 200, todos);
        return;
      }

      const todoMatch = url.pathname.match(/^\/api\/todos\/(\d+)$/);
      if (todoMatch) {
        const id = Number(todoMatch[1]);
        const index = todos.findIndex(todo => todo.id === id);
        if (index === -1) {
          sendJson(response, 404, { message: 'Task not found.' });
          return;
        }

        if (request.method === 'PATCH') {
          const body = await readBody(request);
          if (!body || typeof body !== 'object' || Array.isArray(body)) {
            sendJson(response, 400, { message: 'A valid title and status are required.' });
            return;
          }
          const currentTodo = todos[index];
          const title = body.title === undefined
            ? currentTodo.title
            : typeof body.title === 'string' ? body.title.trim() : '';
          const status = body.status === undefined ? currentTodo.status : body.status;
          if (typeof title !== 'string' || !title || !['in-progress', 'done'].includes(status)) {
            sendJson(response, 400, { message: 'A valid title and status are required.' });
            return;
          }

          todos[index] = { ...currentTodo, title, status };
          await saveTodos(dataFile, todos);
          sendJson(response, 200, todos);
          return;
        }

        if (request.method === 'DELETE') {
          todos = todos.filter(todo => todo.id !== id);
          await saveTodos(dataFile, todos);
          sendJson(response, 200, todos);
          return;
        }
      }

      sendJson(response, 404, { message: 'Route not found.' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { message: 'Request body must be valid JSON.' });
        return;
      }

      console.error('Todo API error:', error);
      sendJson(response, 500, { message: 'The server could not process the request.' });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => {
    console.log(`Todo API listening at http://localhost:${port}`);
  });
}

module.exports = { createServer };
