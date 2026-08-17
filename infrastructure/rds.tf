resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  vpc_id      = module.vpc.vpc_id
  description = "Allow inbound PostgreSQL traffic from ECS"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnets_cidr_blocks
  }
}

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project_name}-db"

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.t3.micro"

  allocated_storage = 20

  db_name                     = "smartretailx"
  username                    = "smartretailx"
  password                    = var.db_password
  manage_master_user_password = false
  port                        = 5432

  multi_az               = true
  create_db_subnet_group = true
  vpc_security_group_ids = [aws_security_group.rds.id]

  subnet_ids = module.vpc.private_subnets

  # Backup and Recovery Configuration (Task 5 Requirement)
  backup_retention_period = 7
  backup_window           = "02:00-03:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"
  copy_tags_to_snapshot   = true

  # Set to true for easier lab cleanup, but backups will still run daily
  skip_final_snapshot = true
}
