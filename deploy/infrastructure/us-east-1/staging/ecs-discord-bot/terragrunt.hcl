locals {
   # Automatically load environment-level variables
   environment_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
   region_vars = read_terragrunt_config(find_in_parent_folders("region.hcl"))   
   # Extract out common variables for reuse
   env        = local.environment_vars.locals.environment
   project    = local.environment_vars.locals.project
   aws_region = local.region_vars.locals.aws_region
}

terraform {
  source = "${get_parent_terragrunt_dir()}//infrastructure/modules/ecs-service-job"
}

inputs = {
  cluster_arn            = "arn:aws:ecs:us-east-1:113455407625:cluster/karma-staging"
  log_group_name         = "discord-bot-${local.environment_vars.locals.environment}"
  app_name               = "discord-bot-${local.environment_vars.locals.environment}"
  node_env               = local.environment_vars.locals.environment
  role_arn               = "arn:aws:iam::113455407625:role/ecs/karma-staging-ecs-instance-role"
  aws_region             = local.region_vars.locals.aws_region
  image                  = dependency.ecr.outputs.repository_url
  desired_count          = 1
  max_size               = 1
  min_size               = 1
  capacity_provider_name = "cp-staging"
  memory                 = 1024
  command                = "node index.js"
}


include {
  path = find_in_parent_folders()
}

dependencies {
  paths = [ "../ecr" ]
}

dependency "ecr" {
  config_path = "../ecr"
}
