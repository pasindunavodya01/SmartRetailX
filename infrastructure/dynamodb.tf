resource "aws_dynamodb_table" "analytics" {
  name         = "${var.project_name}-analytics"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "EventId"

  attribute {
    name = "EventId"
    type = "S"
  }
}
