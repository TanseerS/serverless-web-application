# add aws provider
terraform {
  required_version = "~> 1.15.0"
  required_providers {
    aws = {
        source = "hashicorp/aws"
        version = "~> 6.0"
    }
  }
}

# setup aws region
provider "aws" {
  region = "ap-south-1"
}