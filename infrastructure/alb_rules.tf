# Target Groups
resource "aws_lb_target_group" "user" {
  name        = "${var.project_name}-user-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/api/v1/health"
    matcher = "200"
  }
}

resource "aws_lb_target_group" "product" {
  name        = "${var.project_name}-product-tg"
  port        = 3004
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/api/v1/health"
    matcher = "200"
  }
}

resource "aws_lb_target_group" "order" {
  name        = "${var.project_name}-order-tg"
  port        = 3003
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/api/v1/health"
    matcher = "200"
  }
}

# Listener Rules
resource "aws_lb_listener_rule" "user" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.user.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/users*", "/api/v1/auth*", "/api/v1/admin*", "/api/v1/health"]
    }
  }
}

resource "aws_lb_listener_rule" "product" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.product.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/products*", "/api/v1/inventory*", "/api/v1/internal/inventory*"]
    }
  }
}

resource "aws_lb_listener_rule" "order" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 30

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.order.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/orders*"]
    }
  }
}

# Notification Target Group & Listener
resource "aws_lb_target_group" "notification" {
  name        = "${var.project_name}-notif-tg"
  port        = 3002
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path    = "/api/v1/health"
    matcher = "200"
  }
}

resource "aws_lb_listener_rule" "notification" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 40

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.notification.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/notifications*"]
    }
  }
}
