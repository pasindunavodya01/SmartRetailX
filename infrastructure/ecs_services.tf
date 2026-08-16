locals {
  ecr_base_url = "381491960645.dkr.ecr.us-east-1.amazonaws.com"
  db_url       = "postgresql://smartretailx:${var.db_password}@${module.db.db_instance_endpoint}/smartretailx?sslmode=no-verify"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 7
}

# User Service
resource "aws_ecs_task_definition" "user" {
  family                   = "${var.project_name}-user-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "user-service"
    image     = "${local.ecr_base_url}/${var.project_name}-user-service:latest"
    essential = true
    portMappings = [{
      containerPort = 3001
      hostPort      = 3001
    }]
    environment = [
      { name = "PORT", value = "3001" },
      { name = "DATABASE_URL", value = local.db_url },
      { name = "JWT_SECRET", value = "production-super-secret-key" },
      { name = "FORCE_DEPLOY", value = "10" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "user"
      }
    }
  }])
}

resource "aws_ecs_service" "user" {
  name            = "${var.project_name}-user-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.user.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.user.arn
    container_name   = "user-service"
    container_port   = 3001
  }
}

# Product Service
resource "aws_ecs_task_definition" "product" {
  family                   = "${var.project_name}-product-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "product-service"
    image     = "${local.ecr_base_url}/${var.project_name}-product-service:latest"
    essential = true
    portMappings = [{
      containerPort = 3004
      hostPort      = 3004
    }]
    environment = [
      { name = "PORT", value = "3004" },
      { name = "DATABASE_URL", value = local.db_url },
      { name = "JWT_SECRET", value = "production-super-secret-key" },
      { name = "AWS_REGION", value = "us-east-1" },
      { name = "SQS_INVENTORY_QUEUE_URL", value = aws_sqs_queue.inventory_queue.url },
      { name = "FORCE_DEPLOY", value = "14" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "product"
      }
    }
  }])
}

resource "aws_ecs_service" "product" {
  name            = "${var.project_name}-product-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.product.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.product.arn
    container_name   = "product-service"
    container_port   = 3004
  }
}

# Order Service
resource "aws_ecs_task_definition" "order" {
  family                   = "${var.project_name}-order-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "order-service"
    image     = "${local.ecr_base_url}/${var.project_name}-order-service:latest"
    essential = true
    portMappings = [{
      containerPort = 3003
      hostPort      = 3003
    }]
    environment = [
      { name = "PORT", value = "3003" },
      { name = "DATABASE_URL", value = local.db_url },
      { name = "JWT_SECRET", value = "production-super-secret-key" },
      { name = "AWS_REGION", value = "us-east-1" },
      { name = "SNS_ORDER_EVENTS_TOPIC_ARN", value = aws_sns_topic.order_events.arn },
      { name = "FORCE_DEPLOY", value = "12" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "order"
      }
    }
  }])
}

resource "aws_ecs_service" "order" {
  name            = "${var.project_name}-order-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.order.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.order.arn
    container_name   = "order-service"
    container_port   = 3003
  }
}

# Notification Service (Worker - no ALB)
resource "aws_ecs_task_definition" "notification" {
  family                   = "${var.project_name}-notification-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "notification-service"
    image     = "${local.ecr_base_url}/${var.project_name}-notification-service:latest"
    essential = true
    portMappings = [{
      containerPort = 3002
      hostPort      = 3002
    }]
    environment = [
      { name = "PORT", value = "3002" },
      { name = "DATABASE_URL", value = local.db_url },
      { name = "JWT_SECRET", value = "production-super-secret-key" },
      { name = "AWS_REGION", value = "us-east-1" },
      { name = "SQS_NOTIFICATION_QUEUE_URL", value = aws_sqs_queue.notification_queue.url },
      { name = "FORCE_DEPLOY", value = "13" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "notification"
      }
    }
  }])
}

resource "aws_ecs_service" "notification" {
  name            = "${var.project_name}-notification-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.notification.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.notification.arn
    container_name   = "notification-service"
    container_port   = 3002
  }
}
