data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "archive_file" "order_processor_lambda" {
  type        = "zip"
  output_path = "${path.module}/order_processor_lambda.zip"

  source {
    content  = <<-EOT
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  if (!event.Records) return { statusCode: 200, body: 'No records' };
  
  for (const record of event.Records) {
    let payload;
    let messageId;
    
    if (record.Sns) {
      messageId = record.Sns.MessageId;
      try {
        payload = JSON.parse(record.Sns.Message);
      } catch(e) {
        payload = record.Sns.Message;
      }
    } else {
      payload = record;
      messageId = Date.now().toString();
    }
    
    const eventId = payload.orderId || payload.id || messageId;
    
    const command = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        EventId: eventId,
        Timestamp: new Date().toISOString(),
        Status: payload.status || 'LOGGED',
        RawData: JSON.stringify(payload)
      }
    });
    
    await docClient.send(command);
    console.log(`Successfully logged event $${eventId} to DynamoDB`);
  }
  
  return { statusCode: 200, body: 'Processed' };
};
EOT
    filename = "index.js"
  }
}

# Order Event Processor Lambda Function
resource "aws_lambda_function" "order_event_processor" {
  filename         = data.archive_file.order_processor_lambda.output_path
  source_code_hash = data.archive_file.order_processor_lambda.output_base64sha256
  function_name    = "${var.project_name}-order-event-processor"
  role             = data.aws_iam_role.lab_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.analytics.name
    }
  }
}

# Allow SNS to invoke the Lambda
resource "aws_lambda_permission" "allow_sns_invoke" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_event_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.order_events.arn
}

# Subscribe Lambda to SNS Topic
resource "aws_sns_topic_subscription" "lambda_sns_subscription" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.order_event_processor.arn
}
