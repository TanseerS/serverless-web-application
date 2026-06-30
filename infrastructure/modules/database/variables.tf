variable "project" {
    description = "The name of the project."
    type        = string
    default     = "todo-app"
}

variable "environment" {
    description = "The environment for the project."
    type        = string
}

variable "username" {
    description = "The username for the database."
    type        = string
    default     = "admin"
}

variable "password" {
    description = "The password for the database."
    type        = string
    sensitive   = true
}

variable "subnet_ids" {
    type = list(string)
    description = "Subnet IDs for the DB subnet group"
}

variable "vpc_id" {
    type = string
    description = "VPC in which security group lives"
}