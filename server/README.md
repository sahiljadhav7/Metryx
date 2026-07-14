# Metryx — Scalable API Monitoring System

Metryx is a production-grade, event-driven API monitoring platform built to simulate how modern backend systems track, process, and analyze millions of API requests in real time. It's designed as a **modular monolith** with a clean separation between ingestion, asynchronous processing, and analytics storage — the same architectural pattern used by real-world observability platforms.

This project demonstrates how to design a system that can absorb high-throughput traffic without blocking on writes, recover gracefully from processing failures, and serve both raw event data and aggregated metrics from purpose-built stores.

---

## Architecture

![Metryx Architecture](./Metryx_Architecture.svg)

**Request flow:**

1. **API Gateway (Express)** — an Express-based ingest server accepts incoming API hit events (authenticated via per-tenant API keys) and publishes them to RabbitMQ instead of writing to a database synchronously.
2. **RabbitMQ Exchange → `api_hits` Queue** — decouples ingestion from processing. If a consumer fails to process a message, it's routed to a **Dead Letter Queue (DLQ)** for retry/inspection instead of being lost.
3. **Background Consumer (`consume.js`) + Processor Engine** — a background worker consumes messages off the queue, transforms/aggregates them, and writes to two destinations in parallel:
   - **MongoDB** — stores the raw, untouched event as the source of truth.
   - **PostgreSQL** — stores time-bucketed, aggregated metrics for fast analytical queries.
4. **Admin Tools** — pgAdmin, MongoDB Compass, and the RabbitMQ Management UI are wired in for direct visibility into queues, raw events, and aggregates during development/ops.

This gives Metryx a **dual-database strategy**: MongoDB for flexible, append-only raw storage, and PostgreSQL for structured, query-friendly aggregates — each database used for what it's actually good at, instead of forcing one store to do both jobs.

---

## Key Features

- **Event-driven ingestion** — API hits are queued, not written synchronously, so ingestion throughput isn't bottlenecked by database write latency.
- **Asynchronous processing with retry handling** — RabbitMQ + Dead Letter Queue ensures failed message processing doesn't silently drop data.
- **Dual-database design** — raw events (MongoDB) and aggregated time-bucket metrics (PostgreSQL) are stored separately, optimized for their respective access patterns.
- **Multi-tenant architecture** — API-key based ingestion scopes every event to a tenant, enabling isolated analytics per client/application.
- **Modular monolith structure** — services (ingest, consumer, processor) are logically separated but deployed as a single cohesive backend, avoiding premature microservice complexity.
- **Full observability tooling** — RabbitMQ UI, pgAdmin, and MongoDB Compass are included for real-time inspection of queues and data.
- **Containerized deployment** — the entire stack (API, RabbitMQ, MongoDB, PostgreSQL) runs via Docker for consistent local and production environments.

---

## Tech Stack

| Layer                 | Technology                                       | Purpose                                                                          |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| API Layer             | Node.js, Express (ES Modules)                    | Ingest endpoint, authentication, request validation                              |
| Message Broker        | RabbitMQ                                         | Queue-based decoupling of ingestion and processing, with DLQ for failed messages |
| Raw Storage           | MongoDB                                          | Source-of-truth store for unprocessed API event data                             |
| Analytics Storage     | PostgreSQL                                       | Time-bucketed, aggregated metrics for dashboards/queries                         |
| Background Processing | Node.js Worker (`consume.js`)                    | Consumes queued events, aggregates them, writes to both databases                |
| Deployment            | Docker & Docker Compose                          | Containerized, reproducible environment for all services                         |
| Admin/Ops             | pgAdmin, MongoDB Compass, RabbitMQ Management UI | Manual inspection and debugging of data/queues                                   |

---

## Why This Design?

Most tutorial-level monitoring projects write directly to a single database on every request. That approach falls apart under real load because:

- A slow database write blocks the API response.
- A database outage means dropped events with no recovery path.
- A single schema can't efficiently serve both "give me the raw event" and "give me last hour's error rate" queries.

Metryx addresses each of these:

- **Decoupling via RabbitMQ** means the ingest API only needs to publish a message and respond — it doesn't wait on downstream processing.
- **The DLQ** captures anything that fails processing so it can be retried or inspected instead of silently lost.
- **Two databases, two jobs** — MongoDB handles flexible raw storage, PostgreSQL handles structured aggregation and fast time-range queries.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Docker & Docker Compose
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/metryx.git
cd metryx

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running with Docker

```bash
docker-compose up --build
```

This spins up:

- Express API server (ingest)
- Background consumer/processor
- RabbitMQ (with Management UI)
- MongoDB
- PostgreSQL

### Environment Variables

```env
PORT=3000

RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=api_hits
RABBITMQ_DLQ=api_hits_dlq

MONGO_URI=mongodb://localhost:27017/metryx_raw
POSTGRES_URI=postgres://user:password@localhost:5432/metryx_metrics

---

## Multi-Tenancy

Every ingested event is scoped to a tenant via an API key passed with each request. This allows Metryx to:

- Isolate analytics per client/application
- Rate-limit or throttle per tenant
- Serve tenant-specific dashboards from the same underlying infrastructure

---

## Roadmap

- [ ] Real-time dashboard (WebSocket/SSE push of live metrics)
- [ ] Configurable alerting on error-rate/latency thresholds
- [ ] Horizontal scaling of consumers with competing-consumer pattern
- [ ] Load testing suite with published throughput benchmarks
- [ ] Automated retry policy with exponential backoff on the DLQ

