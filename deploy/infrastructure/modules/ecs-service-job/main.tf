resource "aws_cloudwatch_log_group" "this_log_group" {
  name              = var.log_group_name
  retention_in_days = 14
}

data "aws_ecs_task_definition" "this_task_definition" {
  task_definition = "${aws_ecs_task_definition.this_task_definition.family}"
}


resource "aws_ecs_task_definition" "this_task_definition" {
  family = var.app_name
  execution_role_arn = "${var.role_arn}"
    container_definitions = jsonencode([
{
	name: "${var.app_name}",
	image: "${var.image}",
	memory: var.memory,
	command: [
		"sh",
		"-c",
		"${var.command}"],
  environment: [
                {
                    name: "NODE_ENV",
                    value: "${var.node_env}"
                },
                {
									name: "TZ",
									value: "UTC"
							  },
                {
                    name: "NODE_OPTIONS",
                    value: "--max_old_space_size=${var.memory}"
                }
            ],
	logConfiguration: {
		logDriver: "awslogs",
		options: {
			awslogs-region: "${var.aws_region}",
			awslogs-group: "${aws_cloudwatch_log_group.this_log_group.name}",
			awslogs-stream-prefix: "${var.app_name}"
		}
	}
}
  ])
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ecs_service" "this_task_service" {
  depends_on = [
    aws_ecs_task_definition.this_task_definition
  ]
  name            = "${var.app_name}-service"
  cluster         = var.cluster_arn
  task_definition = "${aws_ecs_task_definition.this_task_definition.family}:${max("${aws_ecs_task_definition.this_task_definition.revision}", "${data.aws_ecs_task_definition.this_task_definition.revision}")}"

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [task_definition]
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  capacity_provider_strategy {
    base = var.min_size
    capacity_provider = var.capacity_provider_name
    weight = 100
  }

  desired_count = var.desired_count
  force_new_deployment = true

  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 0
}