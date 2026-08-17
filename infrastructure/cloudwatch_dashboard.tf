resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            [{ "expression": "SEARCH('{AWS/ECS,ClusterName,ServiceName} ClusterName=\"smartretailx-cluster\" MetricName=\"CPUUtilization\"', 'Average', 60)", "id": "e1" }]
          ]
          period = 60
          stat   = "Average"
          region = "us-east-1"
          title  = "ECS Cluster CPU Utilization (Per Service)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            [{ "expression": "SEARCH('{AWS/ECS,ClusterName,ServiceName} ClusterName=\"smartretailx-cluster\" MetricName=\"MemoryUtilization\"', 'Average', 60)", "id": "e1" }]
          ]
          period = 60
          stat   = "Average"
          region = "us-east-1"
          title  = "ECS Cluster Memory Utilization (Per Service)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix],
            [".", "HTTPCode_Target_4XX_Count", ".", "."]
          ]
          period = 60
          stat   = "Sum"
          region = "us-east-1"
          title  = "ALB Error Rates (4XX & 5XX)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", module.db.db_instance_identifier]
          ]
          period = 60
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Database Connections"
        }
      }
    ]
  })
}
