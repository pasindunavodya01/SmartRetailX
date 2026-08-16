output "api_gateway_url" {
  description = "The URL of the API Gateway (Use this to access your APIs!)"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "alb_dns_name" {
  description = "The DNS name of the internal Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "rds_endpoint" {
  description = "The endpoint of the RDS database"
  value       = module.db.db_instance_endpoint
}
