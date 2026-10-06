/** Service configuration, read once from the environment. */
export const config = Object.freeze({
  port: Number(process.env.PORT ?? 6102),
  /** SQLite file path. Use ':memory:' for a throwaway database. */
  databasePath: process.env.DATABASE_PATH ?? 'data/customers.db',
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
  logRequests: process.env.LOG_REQUESTS !== 'false',
});
