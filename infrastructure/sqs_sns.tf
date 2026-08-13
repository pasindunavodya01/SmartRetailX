# SNS Topic for Order Events
resource "aws_sns_topic" "order_events" {
  name = "${var.project_name}-order-events"
}

# SQS Queue for Inventory
resource "aws_sqs_queue" "inventory_queue" {
  name = "${var.project_name}-inventory-queue"
}

# SQS Queue for Notifications
resource "aws_sqs_queue" "notification_queue" {
  name = "${var.project_name}-notification-queue"
}

# Subscriptions
resource "aws_sns_topic_subscription" "inventory_sub" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.inventory_queue.arn
}

resource "aws_sns_topic_subscription" "notification_sub" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_queue.arn
}

# SQS Queue Policies to allow SNS to publish
resource "aws_sqs_queue_policy" "inventory_policy" {
  queue_url = aws_sqs_queue.inventory_queue.id
  policy    = data.aws_iam_policy_document.sns_to_inventory_sqs.json
}

data "aws_iam_policy_document" "sns_to_inventory_sqs" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.inventory_queue.arn]
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_sns_topic.order_events.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "notification_policy" {
  queue_url = aws_sqs_queue.notification_queue.id
  policy    = data.aws_iam_policy_document.sns_to_notification_sqs.json
}

data "aws_iam_policy_document" "sns_to_notification_sqs" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.notification_queue.arn]
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_sns_topic.order_events.arn]
    }
  }
}
