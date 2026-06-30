# db subnet group
resource "aws_db_subnet_group" "this" {
  name       = "${var.project}-${var.environment}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project}-${var.environment}-subnet-group"
    Project     = var.project
    Environment = var.environment
  }
}

# db security group
resource "aws_security_group" "this" {
  name = "${var.project}-${var.environment}-security-group"
  description = "Inbound access to the ${var.environment} MySQL database"
  vpc_id = var.vpc_id
  
  ingress {
    description = "Allow MySQL from anywhere"
    protocol = "tcp"
    from_port = 3306
    to_port = 3306
    cidr_blocks = [ "0.0.0.0/0" ]
  }

  egress {
    description = "Allow all outbound"
    protocol = "-1"
    from_port = 0
    to_port = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
  
}

# rds instance
resource "aws_db_instance" "default" {
  db_name = "todo-app-db"
  engine = "mysql"
  engine_version = "8.0"

  allocated_storage = 20
  storage_type =  "gp3"
  instance_class = "db.t3.micro"

  username = var.username
  password = var.password

  db_subnet_group_name = aws_db_subnet_group.this.name
  vpc_security_group_ids = [ aws_security_group.this.id ]
  
  publicly_accessible = true
  skip_final_snapshot = true
  enabled_cloudwatch_logs_exports = [ "error" ]
}