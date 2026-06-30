# data --------------------------------------------------------------

# subnet ids of default subnet
data "aws_vpc" "default" {
  default = true

}

data "aws_subnets" "default" {
    filter {
      name = "vpc-id"
      values = [data.aws_vpc.default.id]
    }
  
}

# resources --------------------------------------------------------------

# rds
module "database" {
  source = "../../modules/database"

  project             = var.project
  environment         = var.environment
  vpc_id              = data.aws_vpc.default.id
  subnet_ids          = data.aws_subnets.default.ids
  username            = var.username
  password            = var.password

}