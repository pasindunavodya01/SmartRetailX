output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer (Use this to access your APIs!)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "rds_endpoint" {
  description = "The endpoint of the RDS database"
  value       = module.db.db_instance_endpoint
}
