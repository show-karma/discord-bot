variable "log_group_name" {
    type = string
    description = "(optional) describe your variable"
}

variable "app_name" {
    type = string
    description = "(optional) describe your variable"
}

variable "node_env" {
    type = string
    description = "NODE_ENV variable for container"
}
variable "image" {
    type = string
    description = "(optional) describe your variable"
}

variable "aws_region" {
    type = string
    description = "(optional) describe your variable"
}

variable "cluster_arn" {
    type = string
    description = "(optional) describe your variable"
}

variable "desired_count" {
    type = number
    default = 0
}

variable "role_arn" {
  type = string
}

variable "min_size" {
  type = number
  default = 0
}

variable "max_size" {
  type = number
  default = 0
}

variable "capacity_provider_name" {
  type = string
}

variable "memory" {
  type = number
}

variable "command" {
  type = string
}