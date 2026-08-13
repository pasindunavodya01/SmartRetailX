resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks-sg"
  vpc_id      = module.vpc.vpc_id
  description = "Allow inbound traffic from ALB to ECS tasks"

  ingress {
    from_port       = 3000
    to_port         = 3010
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Placeholder ECR Repositories
resource "aws_ecr_repository" "user_service" {
  name = "${var.project_name}-user-service"
}

resource "aws_ecr_repository" "product_service" {
  name = "${var.project_name}-product-service"
}

resource "aws_ecr_repository" "order_service" {
  name = "${var.project_name}-order-service"
}

resource "aws_ecr_repository" "notification_service" {
  name = "${var.project_name}-notification-service"
}
