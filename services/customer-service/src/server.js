import { createApp } from './app.js';
import { config } from './config.js';
import { CustomerRepository } from './customer-repository.js';
import { openDatabase } from './db.js';

const db = openDatabase(config.databasePath);
const repo = new CustomerRepository(db);

if (config.seedDemoData && (await repo.list()).length === 0) {
  await repo.create({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'analytical1' });
  await repo.create({ name: 'Alan Turing', email: 'alan@example.com', password: 'enigma1912' });
  await repo.create({ name: 'Grace Hopper', email: 'grace@example.com', password: 'cobol1959' });
}

const server = createApp({ repo, logRequests: config.logRequests }).listen(config.port, () => {
  console.log(`customer-service listening on http://localhost:${config.port}`);
});

// Graceful shutdown: finish in-flight requests, then close the database.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
