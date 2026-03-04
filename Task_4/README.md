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

### GitHub secrets you need
Add these as **Repository secrets** (Settings → Secrets and variables → Actions).

Docker Hub:

- `DOCKERHUB_USERNAME` (example: `dampish0`)
- `DOCKERHUB_TOKEN` (Docker Hub access token)

AKS access:

- `KUBE_CONFIG_B64` (base64 of a kubeconfig file for the cluster)

Backend runtime config (the pipeline turns these into a Kubernetes Secret called `fogis-backend-secrets`):

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `MAILTRAP_TOKEN`

### Getting `KUBE_CONFIG_B64`
We use kubeconfig because some school Azure tenants block creating Service Principals.

1) Fetch kubeconfig (admin) to a local file:

```bash
az aks get-credentials --admin -g bru -n fais --file kubeconfig
```

2) Convert it to base64 (PowerShell):

```powershell
$bytes = [IO.File]::ReadAllBytes("kubeconfig")
[Convert]::ToBase64String($bytes)
```

3) Paste the base64 output into the GitHub secret `KUBE_CONFIG_B64`.

### Evidence for the report
The easiest “proof” is screenshots from GitHub Actions showing:

- the `npm test` step running and passing
- the Docker build/push step
- the `kubectl rollout status` step finishing successfully
