variable "region" {
    type = string
    description = "AWS region where the statefile must exists"
    default = "ap-south-1"
  
}

variable "project" {
  type = string
  description = "Name of the project"
  default = "todo-app"
}