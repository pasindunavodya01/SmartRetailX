# SmartRetailX: Presentation Design Guide

This guide provides a structured 15-slide outline designed perfectly for a 15-minute presentation (roughly 1 minute per slide). It covers all the required grading criteria.

## Slide 1: Title Slide
* **Title:** SmartRetailX Global Commerce Platform
* **Subtitle:** A Cloud-Native Distributed Microservices Architecture on AWS
* **Visual:** Your university logo and your name.
* **Speaker Note:** Introduce yourself and the project. State that you will be demonstrating how you transformed a legacy monolithic application into a highly scalable, event-driven microservices platform.

## Slide 2: Background & Objectives
* **Bullet Points:**
  * **The Problem:** SmartRetailX's monolithic architecture suffered from scaling bottlenecks, tight coupling, and single points of failure.
  * **The Goal:** Decompose the monolith into business-capability microservices.
  * **The Approach:** Containerisation, Infrastructure as Code (Terraform), and Event-Driven Messaging.
* **Speaker Note:** Briefly explain why monoliths fail at global scale. Emphasise that your goal was to design for resilience, not just functionality.

## Slide 3: High-Level Architecture Design
* **Visual:** Paste the **Cloud-Based Distributed Architecture Diagram** (from the Mermaid file).
* **Speaker Note:** Walk the audience through the request flow: Client → API Gateway → Internal ALB → ECS Fargate. Point out the clear separation of concerns between public routing and private compute.

## Slide 4: Key Implementation Components
* **Bullet Points:**
  * **Compute:** 4 independently deployable Node.js microservices (User, Product, Order, Notification).
  * **Orchestration:** Amazon ECS Fargate (Serverless Containers).
  * **Infrastructure as Code:** 100% managed via HashiCorp Terraform.
* **Speaker Note:** Explain why you chose ECS Fargate over EKS (lower operational overhead for a 4-service platform) and Terraform over CloudFormation (multi-provider dependency mapping).

## Slide 5: Data & Serverless Analytics
* **Visual:** Screenshot of your RDS configuration or DynamoDB table.
* **Bullet Points:**
  * **Transactional Data:** Amazon RDS PostgreSQL (Multi-AZ for disaster recovery).
  * **Serverless Processing:** AWS Lambda processor triggered by events.
  * **Audit/Analytics Storage:** Amazon DynamoDB.
* **Speaker Note:** Discuss the hybrid database approach. Relational data lives in RDS for strict consistency, while high-velocity audit events are processed serverlessly by Lambda into DynamoDB.

## Slide 6: Event-Driven Architecture (SNS & SQS)
* **Visual:** Paste the **Data Flow Diagram** (Mermaid sequence diagram).
* **Bullet Points:**
  * **Producer:** Order Service publishes to Amazon SNS.
  * **Consumers:** SQS Fan-out to Inventory and Notification services.
  * **Idempotency:** Implemented to prevent duplicate processing.
* **Speaker Note:** This is a critical slide. Explain how SNS/SQS decouples services so the Order Service doesn't crash if the Notification Service goes offline. Highlight your idempotency implementation.

## Slide 7: Real-Time Distributed Communication
* **Bullet Points:**
  * **Requirement:** Administrative promotion changes must update clients instantly.
  * **Implementation:** WebSockets (Socket.IO).
  * **Mechanism:** Persistent stateful connections allow server-to-client push events without client polling.
* **Speaker Note:** Explain how you achieved the real-time pricing requirement. Contrast the asynchronous SNS/SQS backend communication with the real-time, synchronous WebSocket frontend communication.

## Slide 8: Security Approach
* **Visual:** Screenshot of your JWT payload or API Gateway configuration.
* **Bullet Points:**
  * **Network Security:** ECS Services isolated in Private Subnets; accessed only via API Gateway VPC Link.
  * **Authentication:** Stateless JSON Web Tokens (JWT).
  * **Authorisation:** Role-Based Access Control (CUSTOMER vs ADMIN).
* **Speaker Note:** Explain the "Defense in Depth" strategy. Network boundaries protect the infrastructure, while JWTs and RBAC protect the application logic.

## Slide 9: Resilience & Fault Tolerance
* **Visual:** Screenshot of your Opossum Circuit Breaker code or Auto Scaling metrics.
* **Bullet Points:**
  * **Circuit Breaker:** Protects against cascading failures during SNS outages.
  * **Auto Scaling:** Dynamic ECS task scaling based on 70% CPU utilisation.
  * **Saga Pattern:** Compensating transactions (reserving and releasing inventory).
* **Speaker Note:** Explain how you tested failure. Mention that when you deliberately killed the Notification service, the Order service kept working perfectly because of the architecture.

## Slide 10: Observability & Monitoring
* **Visual:** Screenshots of CloudWatch Dashboards and AWS X-Ray code.
* **Bullet Points:**
  * **Centralised Logging:** Amazon CloudWatch Logs & Alarms.
  * **Metrics:** Custom dashboards tracking CPU, Memory, and ALB 5XX errors.
  * **Distributed Tracing:** AWS X-Ray instrumentation.
* **Speaker Note:** Emphasise that in a distributed system, you cannot just read a single log file. CloudWatch and X-Ray were critical for tracking a request across four different services.

## Slide 11: Testing Outcomes - Automation
* **Visual:** Screenshot of your Jest terminal showing `23/23 PASSED`.
* **Bullet Points:**
  * Unit and Integration testing via Jest & Supertest.
  * Comprehensive coverage: Auth, creation, retrieval, and failure recovery.
  * **Key Win:** Automated idempotency testing passed flawlessly.
* **Speaker Note:** Walk through the test suite. Highlight that you didn't just test the "happy path", but you also automated the testing of cancellation and inventory release logic.

## Slide 12: Testing Outcomes - Performance
* **Visual:** Locust charts (Requests per second & Response Times).
* **Bullet Points:**
  * **Baseline Load:** 50 concurrent users.
  * **Stress Test:** 1,000 concurrent users.
  * **Outcome:** ALB and Circuit Breaker successfully maintained system stability under extreme load.
* **Speaker Note:** Explain that you pushed the system to its limits with 1,000 users. While latency increased, the architecture proved its resilience by not crashing.

## Slide 13: Critical Evaluation
* **Bullet Points:**
  * **Strengths:** Highly decoupled, independently scalable, excellent fault isolation.
  * **Weaknesses:** Increased operational complexity, eventual consistency challenges.
  * **Limitations:** Single-region deployment, lacks dedicated payment gateway.
* **Speaker Note:** Be honest. Academics love critical evaluation. Admit that microservices are much harder to debug and deploy than monoliths, but the trade-off is worth it for global scale.

## Slide 14: Lessons Learned
* **Bullet Points:**
  * Infrastructure as Code (Terraform) is essential, but state management is tricky (e.g., Auto Scaling conflicts).
  * Eventual consistency requires careful data modelling (Idempotency).
  * Cloud architecture is about balancing cost, complexity, and availability.
* **Speaker Note:** Share a personal struggle, like figuring out how to connect API Gateway to the internal ALB via a VPC Link, and how solving it deepened your understanding of cloud networking.

## Slide 15: Conclusion & Q&A
* **Bullet Points:**
  * SmartRetailX successfully transformed into a modern, cloud-native architecture.
  * Built using industry-standard patterns and AWS best practices.
  * Ready for future multi-region expansion.
* **Speaker Note:** Thank the audience for their time, briefly summarise that you met all objectives, and open the floor to questions.
