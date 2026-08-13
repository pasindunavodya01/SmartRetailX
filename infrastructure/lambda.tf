data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "archive_file" "dummy_lambda" {
  type        = "zip"
  output_path = "${path.module}/dummy_lambda.zip"
  
  source {
    content  = "exports.handler = async (event) => { console.log(event); return 'OK'; };"
    filename = "index.js"
  }
}

# Analytics Lambda Function
resource "aws_lambda_function" "analytics_processor" {
  filename         = data.archive_file.dummy_lambda.output_path
  source_code_hash = data.archive_file.dummy_lambda.output_base64sha256
  function_name    = "${var.project_name}-analytics-processor"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.analytics.name
    }
  }
}
