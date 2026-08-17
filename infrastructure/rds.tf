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

  multi_az               = false
  create_db_subnet_group = true
  vpc_security_group_ids = [aws_security_group.rds.id]

  subnet_ids = module.vpc.private_subnets

  skip_final_snapshot = true
}
