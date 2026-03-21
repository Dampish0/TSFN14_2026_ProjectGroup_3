# Task 6 – Load Testing and Performance Observation

## Objective
The goal of this task was to observe how our backend behaves under a small, controlled amount of load, and to relate what we see to the architecture and deployment choices from earlier tasks (AKS deployment, probes/logging, and HPA).

This is not intended to be a perfect benchmark. The point is to see how response time, error rate, and scaling behave when load increases.

## Load testing goal
We focused on two simple metrics:

- **Response time** (average + max)
- **Error rate** (failed requests / assertion failures)

And we used a small, stepped increase in concurrent users to see when the service starts to slow down and whether HPA scaling is triggered.

## Scenario tested
We tested one simple endpoint repeatedly:

- `GET /health/ready`

Why this endpoint:

- It is relevant to our deployment because Kubernetes uses it as the **readiness probe** (Task 5).
- It exercises the application request pipeline (Express routing, middleware, logging) and also checks runtime state (startup flag + MongoDB connection state via Mongoose), without requiring a complex workflow.

This scenario is intentionally simple and “safe” to hit frequently.

## JMeter test setup
Test plan file: `Task 6/load_test_plan.jmx`

Key configuration:

- **3 sequential load stages** (thread groups are serialized)
  - 5 users for 120s (ramp-up 20s)
  - 10 users for 120s (ramp-up 20s)
  - 20 users for 120s (ramp-up 20s)
- **Think time**: uniform random timer between ~100–300ms per request
- **Assertions**: response code must be `200`
- **Timeouts**: connect/response timeout = 10s

This setup is small enough to keep cloud cost lower, but still large enough to see differences between local execution and AKS.

## Test environments
We ran the same test plan in two environments:

### Local
Backend running locally and JMeter targeting `http://localhost:5000/health/ready`.

### Azure (AKS)
Backend deployed to AKS (Task 3) with probes and logging (Task 5) and HPA enabled (Task 5). For this run we pointed JMeter to the AKS-exposed backend endpoint by changing the JMeter variables (`host`, `protocol`, and `port`) to match the deployed service.

Relevant scaling configuration:

- HPA: `minReplicas: 1`, `maxReplicas: 4`
- CPU target: **60% utilization**
- Deployment resources: `requests.cpu: 100m`, `limits.cpu: 500m`

Because HPA uses CPU **utilization of the requested CPU**, the target effectively means scaling when pods average above roughly **60m CPU usage**.

## Results
We used the JMeter Summary Report CSV output for the comparison.

### Local summary

| Metric | Value |
| --- | ---: |
| Samples | 17,523 |
| Average response time | 20 ms |
| Min / Max | 1 ms / 117 ms |
| Std. deviation | 14.92 ms |
| Error rate | 0.000% |
| Throughput | 6.55 req/s |

### Azure summary

| Metric | Value |
| --- | ---: |
| Samples | 16,890 |
| Average response time | 54 ms |
| Min / Max | 21 ms / 486 ms |
| Std. deviation | 39.84 ms |
| Error rate | 0.024% |
| Throughput | 5.92 req/s |

## Observations

### Response times increased in Azure
The average response time increased from **20 ms (local)** to **54 ms (Azure)**, and the max response time increased from **117 ms** to **486 ms**.

This makes sense for a few reasons:

- **Network and platform overhead**: in Azure the requests travel through cloud networking and Kubernetes service/load balancer instead of the local looback interface.
- **Resource limits**: the deployment has explicit CPU and memory limits. Under bursty load, the pod can hit CPU contention faster than on a developer machine.
- **Logging overhead under load**: our backend logs every request start and completion (Task 5). Console logging is relatively expensive and becomes more noticeable when many requests are produced per second.

Even though the endpoint is simple, these factors can add latency and increase variance.

### Error rate stayed very low
Local had **0% errors**. Azure had **0.024%** errors.

With 16,890 total samples, 0.024% corresponds to roughly **4 failed requests**.

Likely causes:

- brief spikes during the highest load stage (20 users)
- temporary delays around scaling events (new pod scheduling / warm-up)
- transient networking issues in the cluster

Because the JMeter plan asserts HTTP 200, any short readiness instability or non-200 response will be counted as an error.

### Throughput was similar
Throughput was close in both environments:

- Local: **6.55 req/s**
- Azure: **5.92 req/s**

The Azure throughput was slightly lower, which matches the higher average latency and larger variance.

## Scaling behavior (HPA)
During the Azure run, the HPA targets were observed to climb above the configured **60% CPU** target (for example values like **67%**, **80%**, **84%**, and up to **108%** of target).

At the same time, the replica count was observed to increase from **1 → 2** pods.

Why it did not scale further toward 4:

- The load stages are short (each stage is 2 minutes). HPA decisions are not instant; metrics collection and scaling actions take time.
- After scaling to 2 replicas, average CPU per pod likely dropped closer to the target, so there was no strong signal to continue scaling.

Overall, this matches the intent of our Task 5 setup: scale up when CPU rises above the target, and keep the baseline at 1 pod.

## Reflection in relation to previous tasks

### Task 2 (architecture)
Our backend is a stateless HTTP API service with MongoDB connectivity managed via Mongoose. The `/health/ready` endpoint checks the service state and the database connection state, which is a small but meaningful part of the overall architecture.

This test mostly measured:

- Express request handling + middleware
- per-request logging
- readiness logic based on process state and MongoDB connection state

It does **not** represent heavier endpoints (database queries, authentication, business logic). So the results are mainly about baseline service responsiveness and platform overhead, not full “end-user” performance.

### Task 5 (monitoring and scaling)
This task directly validated the monitoring/scaling choices from Task 5:

- Request logging made it easy to see traffic volume and request durations in logs.
- The readiness endpoint we tested is the same endpoint Kubernetes uses for routing traffic.
- The HPA reacted when CPU exceeded the configured target and increased replicas.

## Lessons learned

- Azure adds latency and variance compared to local runs, even for a simple endpoint.
- HPA scaling works, but it is not instantaneous; short tests may only show 1–2 replica changes.
- Logging is useful for observability, but under load it can add overhead and contribute to CPU usage.
- Testing `/health/ready` is a good “safe” scenario, but future performance testing should also include one real business endpoint to capture database/query behavior.

## Deliverables (repo files)

- JMeter test plan: `Task 6/load_test_plan.jmx`
- Local results: `Task 6/results/summarylocal.csv`
- Azure results: `Task 6/results/summaryAzure.csv`
- Evidence/screenshots: `Task 6/screenshots/`