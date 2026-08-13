variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  default     = "smartretailx"
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}
