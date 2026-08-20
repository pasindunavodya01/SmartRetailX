# SmartRetailX Architecture Diagrams

You can use these diagrams in your final report. If your markdown editor supports Mermaid (like GitHub, Notion, or Obsidian), you can paste the code blocks directly. Otherwise, you can paste the code into [Mermaid Live Editor](https://mermaid.live/) to export them as PNG images.

## 1. Cloud-Based Distributed Architecture Diagram

```mermaid
architecture-beta
    group aws(cloud)[AWS Cloud]
    
    service client(internet)[Client / Frontend]
    service apigw(server)[Amazon API Gateway]
    service vpclink(disk)[VPC Link]
    
    group vpc(cloud)[Amazon VPC] in aws
    
    group public(cloud)[Public Subnets] in vpc
    service alb(server)[Internal ALB] in public
    
    group private(cloud)[Private Subnets] in vpc
    
    group ecs(cloud)[ECS Fargate Cluster] in private
    service userSvc(server)[User Service] in ecs
    service prodSvc(server)[Product Service] in ecs
    service orderSvc(server)[Order Service] in ecs
    service notifSvc(server)[Notification Service] in ecs
    
    group data(cloud)[Data Layer] in private
    service rds(database)[Amazon RDS PostgreSQL] in data
    service dynamo(database)[DynamoDB Analytics] in data
    
    group events(cloud)[Event-Driven Messaging] in private
    service sns(disk)[SNS Order Topic] in events
    service sqsInv(disk)[SQS Inventory Queue] in events
    service sqsNot(disk)[SQS Notification Queue] in events

    client:R --> L:apigw
    apigw:R --> L:vpclink
    vpclink:R --> L:alb
    
    alb:B --> T:userSvc
    alb:B --> T:prodSvc
    alb:B --> T:orderSvc
    alb:B --> T:notifSvc
    
    userSvc:R --> L:rds
    prodSvc:R --> L:rds
    orderSvc:R --> L:rds
    
    orderSvc:B --> T:sns
    sns:B --> T:sqsInv
    sns:B --> T:sqsNot
    
    sqsInv:L --> R:prodSvc
    sqsNot:R --> L:notifSvc
```

*(Note: The above uses the new Mermaid Architecture syntax. If your editor doesn't support it, use the standard Flowchart below).*

### Standard Flowchart Architecture

```mermaid
graph TD
    Client[Web Frontend / Mobile] -->|HTTPS| APIGW[Amazon API Gateway]
    
    subgraph "AWS Cloud (VPC)"
        APIGW -->|VPC Link| ALB[Internal Application Load Balancer]
        
        subgraph "Amazon ECS Fargate (Private Subnets)"
            ALB --> UserSvc[User Service]
            ALB --> ProdSvc[Product Service]
            ALB --> OrderSvc[Order Service]
            ALB --> NotifSvc[Notification Service]
        end
        
        subgraph "Event-Driven Messaging"
            OrderSvc -->|Publish Event| SNS[Amazon SNS Topic: OrderEvents]
            SNS -->|Fan-out| SQS1[SQS: Inventory Queue]
            SNS -->|Fan-out| SQS2[SQS: Notification Queue]
            SQS1 -->|Consume| ProdSvc
            SQS2 -->|Consume| NotifSvc
        end
        
        subgraph "Data Storage & Processing"
            UserSvc --> RDS[(Amazon RDS PostgreSQL<br>Multi-AZ)]
            ProdSvc --> RDS
            OrderSvc --> RDS
            
            OrderSvc -.->|Trigger| Lambda[AWS Lambda: Analytics Processor]
            Lambda --> DynamoDB[(Amazon DynamoDB)]
        end
        
        subgraph "Observability"
            UserSvc -.-> CW[Amazon CloudWatch]
            ProdSvc -.-> CW
            OrderSvc -.-> CW
            NotifSvc -.-> CW
            OrderSvc -.-> XRAY[AWS X-Ray]
        end
    end

    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:black;
    classDef ecs fill:#147EBA,stroke:#232F3E,stroke-width:2px,color:white;
    classDef db fill:#3355DA,stroke:#232F3E,stroke-width:2px,color:white;
    classDef queue fill:#FF4F8B,stroke:#232F3E,stroke-width:2px,color:white;
    
    class APIGW,ALB aws;
    class UserSvc,ProdSvc,OrderSvc,NotifSvc ecs;
    class RDS,DynamoDB db;
    class SNS,SQS1,SQS2 queue;
```

---

## 2. Data Flow Diagram (Event-Driven Order Processing)

This diagram satisfies the "Data Flow Diagram" requirement, specifically showing how an asynchronous order propagates through the system.

```mermaid
sequenceDiagram
    participant User as Client App
    participant GW as API Gateway
    participant OS as Order Service
    participant DB as RDS Database
    participant SNS as Amazon SNS
    participant PS as Product Service
    participant NS as Notification Service

    User->>GW: POST /api/v1/orders
    GW->>OS: Route Request
    
    OS->>DB: 1. Validate User & Save Order (Pending)
    DB-->>OS: Order Saved
    
    OS->>SNS: 2. Publish "OrderCreated" Event
    Note over OS,SNS: Opossum Circuit Breaker Protects this call
    
    OS-->>GW: 201 Created (Order Pending)
    GW-->>User: Order Received Response
    
    par Fan-out Event
        SNS->>PS: 3a. Deliver to Inventory SQS
        SNS->>NS: 3b. Deliver to Notification SQS
    end
    
    PS->>DB: 4a. Deduplicate Event & Update Stock
    Note over PS,DB: Atomic Transaction guarantees stock
    
    NS->>DB: 4b. Deduplicate & Save Notification
    Note over NS,DB: Idempotency prevents double-emails
```
