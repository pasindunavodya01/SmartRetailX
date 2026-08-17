resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 15,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "app/smartretailx-alb/59a400588366f593" ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", "." ]
                ],
                "period": 60,
                "region": "us-east-1",
                "stat": "Sum",
                "title": "ALB Error Rates (4XX & 5XX)"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 15,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "smartretailx-db" ]
                ],
                "period": 60,
                "region": "us-east-1",
                "stat": "Average",
                "title": "RDS Database Connections"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 5,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"RequestCount\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "RequestCount: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 8,
            "y": 5,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTPCode_ELB_5XX_Count\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "HTTPCode_ELB_5XX_Count: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 16,
            "y": 10,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"ActiveConnectionCount\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "ActiveConnectionCount: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 8,
            "y": 10,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "ConsumedLCUs", "LoadBalancer", "app/comp70070-lab-alb/02da862903e454c1", { "period": 300, "stat": "Average" } ],
                    [ "...", "app/smartretailx-alb/cf36c23ec03b67e7", { "period": 300, "stat": "Average" } ],
                    [ "...", "app/smartretailx-alb/59a400588366f593", { "period": 300, "stat": "Average" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC",
                "title": "ConsumedLCUs: Average"
            }
        },
        {
            "type": "metric",
            "x": 16,
            "y": 5,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTP_Fixed_Response_Count\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "HTTP_Fixed_Response_Count: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 26,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTPCode_ELB_4XX_Count\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "HTTPCode_ELB_4XX_Count: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 8,
            "y": 26,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"NewConnectionCount\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "NewConnectionCount: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 10,
            "width": 8,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"ProcessedBytes\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "ProcessedBytes: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 21,
            "width": 12,
            "height": 5,
            "properties": {
                "metrics": [
                    [ { "expression": "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"RuleEvaluations\" ', 'Sum', 300)" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "title": "RuleEvaluations: Sum",
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 21,
            "width": 12,
            "height": 5,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/comp70070-lab-alb/02da862903e454c1", { "period": 300, "stat": "Average" } ],
                    [ "...", "app/smartretailx-alb/cf36c23ec03b67e7", { "period": 300, "stat": "Average" } ],
                    [ "...", "app/smartretailx-alb/59a400588366f593", { "period": 300, "stat": "Average" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC",
                "title": "TargetResponseTime: Average"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 5,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ClusterName", "smartretailx-cluster", "ServiceName", "smartretailx-user-service", { "period": 300, "stat": "Average" } ],
                    [ "...", "smartretailx-notification-service", { "period": 300, "stat": "Average" } ],
                    [ "...", "smartretailx-order-service", { "period": 300, "stat": "Average" } ],
                    [ "...", "smartretailx-product-service", { "period": 300, "stat": "Average" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC",
                "title": "CPUUtilization: Average"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 5,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "MemoryUtilization", "ClusterName", "smartretailx-cluster", "ServiceName", "smartretailx-user-service", { "period": 300, "stat": "Average" } ],
                    [ "...", "smartretailx-notification-service", { "period": 300, "stat": "Average" } ],
                    [ "...", "smartretailx-order-service", { "period": 300, "stat": "Average" } ],
                    [ "...", "smartretailx-product-service", { "period": 300, "stat": "Average" } ]
                ],
                "legend": {
                    "position": "bottom"
                },
                "region": "us-east-1",
                "liveData": false,
                "timezone": "UTC",
                "title": "MemoryUtilization: Average"
            }
        }
    ]
})
}
