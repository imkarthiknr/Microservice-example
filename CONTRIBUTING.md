# Contributing

Thanks for taking the time to contribute!

## Reporting issues

Open an [issue](https://github.com/imkarthiknr/Microservice-example/issues) with what you expected, what happened, steps to reproduce, and your OS, Node.js and Docker versions.

## Making changes

1. Fork the repo and branch from `master`: `git checkout -b feat/short-description`.
2. Set up the project with [DEVELOPMENT.md](DEVELOPMENT.md).
3. Make your change **with tests**.
4. Check everything locally:

   ```bash
   npm test
   npm run format:check
   npm run build
   docker compose up --build   # if you touched Dockerfiles, nginx or compose
   ```

5. Commit with [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(customer-service): add pagination`.
6. Open a pull request explaining **what** and **why**. Include screenshots for UI changes.

## Guidelines

- Keep pull requests focused.
- Update [docs/API.md](docs/API.md) whenever API behaviour changes.
- Never log, return or store plain-text passwords.
