terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"  # 서울 리전
}

# DynamoDB 테이블
resource "aws_dynamodb_table" "faq_table" {
  name           = "freshdesk-faq"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "category"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }
}

resource "aws_dynamodb_table" "tickets_table" {
  name           = "freshdesk-tickets"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ticket_id"
  range_key      = "created_at"

  attribute {
    name = "ticket_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }
}

# Lambda 함수
resource "aws_lambda_function" "ai_agent" {
  filename         = "../lambda/deployment.zip"
  function_name    = "freshdesk-ai-agent"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.9"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DYNAMODB_FAQ_TABLE     = aws_dynamodb_table.faq_table.name
      DYNAMODB_TICKETS_TABLE = aws_dynamodb_table.tickets_table.name
    }
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "api" {
  name          = "freshdesk-ai-agent-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "stage" {
  api_id = aws_apigatewayv2_api.api.id
  name   = "prod"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"

  connection_type    = "INTERNET"
  description        = "Lambda integration"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.ai_agent.invoke_arn
}

resource "aws_apigatewayv2_route" "route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /webhook"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# IAM 역할 및 정책
resource "aws_iam_role" "lambda_role" {
  name = "freshdesk-ai-agent-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.faq_table.arn,
          aws_dynamodb_table.tickets_table.arn
        ]
      }
    ]
  })
}

# CloudWatch 로그 그룹
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.ai_agent.function_name}"
  retention_in_days = 30
}

# CloudWatch 알람
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${aws_lambda_function.ai_agent.function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "Lambda 함수 오류 발생"
  
  dimensions = {
    FunctionName = aws_lambda_function.ai_agent.function_name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${aws_lambda_function.ai_agent.function_name}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period             = "300"
  statistic          = "Average"
  threshold          = "5000"  # 5초
  alarm_description  = "Lambda 함수 실행 시간 초과"
  
  dimensions = {
    FunctionName = aws_lambda_function.ai_agent.function_name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# SNS 토픽 (알림용)
resource "aws_sns_topic" "alerts" {
  name = "freshdesk-ai-agent-alerts"
} 