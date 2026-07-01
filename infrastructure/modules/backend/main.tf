# lambda ------------------------------------------------------

# Trust policy (who can assume the role)
data "aws_iam_policy_document" "this" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Lambda execution role
resource "aws_iam_role" "this" {
  name               = "${var.project}-${var.environment}-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.this.json
}

# Attach AWS managed CloudWatch Logs policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# generate arhive 
data "archive_file" "this" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend"
  output_path = "${path.module}/../../build/function.zip"
}

# lambda function
resource "aws_lambda_function" "this" {
  filename      = data.archive_file.this.output_path
  function_name = "${var.project}-${var.environment}-lambda-function"
  role          = aws_iam_role.this.arn
  handler       = "server.handler"
  source_code_hash = data.archive_file.this.output_base64sha256

  runtime = "nodejs22.x"
  timeout = 30
  memory_size = 512
  architectures = [ "x86_64" ]

  depends_on = [ aws_iam_role_policy_attachment.lambda_logs ]

  environment {
    variables = {
      ENVIRONMENT = var.environment
      PORT        = "3000"
      DB_PORT     = "3306"
      DB_HOST     = module.database.db_endpoint
      DB_NAME     = module.database.db_name
      DB_USER     = var.username
      DB_PASSWORD = var.password
    }
  }

  tags = {
    Environment = var.environment
    Application = var.project
  }
}

# api-gateway ------------------------------------------------------