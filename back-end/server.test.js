const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { createServer } = require('./server');

let server;
let baseUrl;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-api-'));
  server = createServer({ dataFile: path.join(temporaryDirectory, 'todos.json') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/todos`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
});

test('creates tasks and keeps them after the API reloads the JSON file', async () => {
  const created = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '  First task  ' })
  });
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), [
    { id: 1, title: 'First task', status: 'in-progress' }
  ]);

  const loaded = await fetch(baseUrl);
  assert.deepEqual(await loaded.json(), [
    { id: 1, title: 'First task', status: 'in-progress' }
  ]);
});

test('updates and deletes tasks through the API', async () => {
  const updated = await fetch(`${baseUrl}/1`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'done' })
  });
  assert.equal(updated.status, 200);
  assert.deepEqual(await updated.json(), [
    { id: 1, title: 'First task', status: 'done' }
  ]);

  const deleted = await fetch(`${baseUrl}/1`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
  assert.deepEqual(await deleted.json(), []);
});

test('rejects empty task titles', async () => {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '  ' })
  });
  assert.equal(response.status, 400);
});
