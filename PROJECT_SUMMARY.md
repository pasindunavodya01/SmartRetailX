# SmartRetailX - Cloud-Based Distributed Web Application

This document summarizes the complete architecture, services, and tasks completed for the SmartRetailX microservices project. It maps directly to the 8 core assignment tasks.

---

## 1. Cloud-Based Distributed Web Application Design (Task 1)
SmartRetailX is built on a robust, cloud-native **Microservices Architecture** leveraging modern AWS services:
* **Compute / Containerization:** The application is containerized using **Docker** and deployed on **Amazon ECS** using **AWS Fargate** (Serverless compute), eliminating the need to manage underlying EC2 instances.
* **Database:** Cloud-managed **Amazon RDS (PostgreSQL)**.
* **Microservices Ecosystem:**
  * `user-service` (Port 3001): Handles JWT Authentication and Role-Based Access Control (RBAC).
  * `product-inventory-service` (Port 3004): Manages product catalogs and inventory levels.
  * `order-service` (Port 3003): Handles order processing and acts as an event publisher.
  * `notification-service` (Port 3002): Consumes events and generates system notifications.

## 2. Secure API Gateway Architecture (Task 2)
To secure the platform and provide a single entry point for clients, the system uses **Amazon API Gateway** (HTTP API):
* **VPC Link Integration:** The API Gateway connects securely to a private, internal **Application Load Balancer (ALB)**, meaning the ECS microservices are entirely shielded from the public internet.
* **Security & Auth:** Endpoints are secured using **JWT (JSON Web Tokens)** and strict **RBAC**, ensuring only users with the `ADMIN` role can manipulate products, inventory, or trigger promotions.

## 3. Event-Driven Communication (Task 3)
Synchronous HTTP calls between services were replaced with an **Event-Driven Architecture** to decouple services and increase reliability:
* **Amazon SNS (Simple Notification Service):** The `order-service` publishes `OrderEvents` to an SNS Topic.
* **Amazon SQS (Simple Queue Service):** The `notification-service` and `product-inventory-service` subscribe to the SNS topic via SQS queues (`NotificationQueue` and `InventoryQueue`).
* **Idempotency:** Implemented event deduplication logic in the database to prevent duplicate stock mutations or double-notifications if AWS delivers an event twice.

## 4. Advanced Data Management (Task 4)
* **ORM:** Utilized **Prisma ORM** for type-safe database queries and schema migrations.
* **Database Optimization:** Structured normalized relational tables inside a centralized PostgreSQL instance, enforcing referential integrity. ACID compliance guarantees atomic operations during inventory adjustments.

## 5. Fault Tolerance and Resilience (Task 5)
The platform is designed to survive partial failures and sudden traffic spikes:
* **Circuit Breaker Pattern:** Implemented in the `order-service` using the `opossum` Node.js library. It wraps outgoing AWS SNS calls, failing fast and executing fallback logic if the event bus experiences an outage.
* **Application Auto Scaling:** Configured Target Tracking scaling policies in Terraform. ECS services automatically scale out (up to 3 tasks per service) if CPU utilization exceeds 70%.
* **High Availability & Backups:** The RDS database is configured with **Multi-AZ** deployment for automatic failover and a 7-day automated backup retention policy.

## 6. Performance and Scalability Testing (Task 6)
* **Load Testing:** Conducted using **Locust** (Python). 
* **Scenario:** A custom script (`load_test.py`) was developed to simulate 50 concurrent users registering, logging in, acquiring JWTs, and aggressively querying the product catalog via the API Gateway.
* **Evidence:** Generated HTML performance reports detailing throughput (req/s), response time percentiles, and error rates.

## 7. Monitoring, Logging, and Observability (Task 7)
* **Centralised Logging:** Configured ECS Tasks with the `awslogs` log driver, streaming all container logs securely to **Amazon CloudWatch**.
* **Alerting Mechanisms:** Defined CloudWatch Alarms in Terraform to trigger on High CPU Utilization (>85%) and high HTTP 5XX Error rates on the Application Load Balancer.
* **Distributed Tracing:** Integrated the **AWS X-Ray SDK** into the Express middleware to trace end-to-end request latency, including wrapping the AWS SDK to trace asynchronous SNS publishing events.

## 8. Testing and Validation Strategy (Task 8)
A comprehensive testing strategy was implemented across the SDLC:
* **Unit & Integration Testing:** Implemented using **Jest** and **Supertest** across microservices (e.g., `user-service/tests`), mocking dependencies to validate business logic and RBAC constraints in isolation.
* **API Testing:** Interactive **Swagger UI** documentation is exposed on `/api/v1/*/docs` for all services. Additionally, extensive curl/Postman request collections are provided in `api-tests.txt`.
* **End-to-End Testing:** Achieved via the authenticated Locust load testing scripts.
* **Security Testing:** Embedded in the Jest suites to explicitly validate token signatures, expiration handling, and boundary testing for unauthorized access attempts.

---
**Infrastructure as Code (IaC):** The entire AWS cloud environment (VPC, ECS, ECR, RDS, ALB, API Gateway, SNS, SQS, CloudWatch, Auto Scaling) is codified and deployed using **Terraform**.
