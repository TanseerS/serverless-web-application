terraform{
    backend "s3"{
        bucket = "todo-app-statefile-303670280486"
        key = "dev/terraform.tfstate"
        region = "ap-south-1"
        encrypt = true
        use_lockfile = true
    }
}