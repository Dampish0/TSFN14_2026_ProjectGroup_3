# Task 5 – Verification

Use the following checks in AKS to collect the required evidence.

## 1. Observe logs

- `kubectl logs deployment/fogis-backend --follow`
- Send requests to the backend and verify that `Request received`, `Request completed`, startup logs, and any probe failures appear.

## 2. Observe probes

- `kubectl describe pod <pod-name>`
- Verify that `startupProbe`, `readinessProbe`, and `livenessProbe` are listed and that readiness changes if the app cannot reach MongoDB.

## 3. Observe scaling

- `kubectl get hpa fogis-backend-hpa --watch`
- `kubectl top pods`
- Generate temporary load against the backend and watch the HPA increase replicas from 1 up toward 4.

## 4. Suggested evidence to include

- Screenshot or terminal output showing request logs.
- Screenshot or terminal output showing probe status in a pod description.
- Screenshot or terminal output showing the HPA increase the replica count at least once.