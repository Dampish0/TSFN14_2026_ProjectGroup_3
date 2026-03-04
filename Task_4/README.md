# Task 4 – Automated Testing and Test Pipeline

### What we did
For this task we added a small set of backend tests and then hooked them into a GitHub Actions pipeline.

- tests: Jest + Supertest (10 tests)
- pipeline: runs tests on push → builds Docker image → pushes to Docker Hub → deploys to AKS

### Running tests locally
Go to the backend folder and run:

```bash
cd backend
npm install
npm test
```

The tests live in `backend/tests/`.

### The pipeline
Workflow file: `.github/workflows/cicd.yml`

What it does when you push to `main`:

1. installs backend deps
2. runs `npm test` (fails the build if a test fails)
3. builds and pushes `dampish0/prodimage` to Docker Hub
4. applies the manifests in `Task_3/` (`deployment.yaml` + `service.yaml`)
5. updates the deployment image to the new `${{ github.sha }}` tag and waits for rollout