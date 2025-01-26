#!/bin/bash

# Variables
NAME=""
AWS_REGION="us-west-1"
DB_INSTANCE_TYPE="db.t3.micro"
DB_ENGINE="postgres"
DB_USERNAME="postgres"
DB_PORT="5432"
DB_NAME="deacero"
CONTAINER_PORT=5001


# Print in colors
print_error() {
  echo -e "\033[31m$1\033[0m"
}

print_info() {
  echo -e "\033[36m$1\033[0m"
}

print_success() {
  echo -e "\033[32m$1\033[0m"
}

validate_aws_setup() {
  print_info "Validating AWS setup..."
  
  # Check AWS credentials
  aws sts get-caller-identity --region $AWS_REGION > /dev/null 2>&1 || {
    print_error "AWS credentials not configured or invalid."
    exit 1
  }
}

parse_arguments() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --region=*)
        AWS_REGION="${1#*=}"
        ;;
      --name=*)
        NAME="${1#*=}"
        TASK_FAMILY="${1#*=}-task"
        ;;
      *)
        print_error "Invalid argument: $1"
        exit 1
        ;;
    esac
    shift
  done

  # Validate required parameters
  if [ -z "$NAME" ]; then
    print_error "Name is required. Use the --name flag"
    exit 1
  fi
}

ecr_repository() {
  print_info "Verifying ECR..."
  
  aws ecr describe-repositories --repository-name "$NAME" --region "$AWS_REGION" > /dev/null 2>&1 || {
    aws ecr create-repository --repository-name "$NAME" --region "$AWS_REGION" > /dev/null
    print_success "ECR repository $NAME created successfully"
  }
}

network() {
  print_info "Verifying network..."

  # Get default VPC
  VPC_ID=$(aws ec2 describe-vpcs \
    --filters Name=isDefault,Values=true \
    --query "Vpcs[0].VpcId" \
    --output text \
    --region "$AWS_REGION")

  if [ -z "$VPC_ID" ]; then
    print_error "No default VPC found"
    exit 1
  fi

  # RDS
  DB_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$NAME-rds" "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "$AWS_REGION")


  if [ -z "$DB_SECURITY_GROUP_ID" ] || [ "$DB_SECURITY_GROUP_ID" == "None" ]; then
    DB_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
      --group-name "$NAME-rds" \
      --description "Security group for RDS instance of $NAME" \
      --vpc-id "$VPC_ID" \
      --query "GroupId" \
      --output text \
      --region "$AWS_REGION")

    # Allow inbound PostgreSQL from anywhere
    aws ec2 authorize-security-group-ingress \
      --group-id "$DB_SECURITY_GROUP_ID" \
      --protocol tcp \
      --port $DB_PORT \
      --cidr "0.0.0.0/0" \
      --region "$AWS_REGION" > /dev/null
  else
    # If security group exists, ensure it has the correct inbound rule
    aws ec2 revoke-security-group-ingress \
      --group-id "$DB_SECURITY_GROUP_ID" \
      --protocol tcp \
      --port $DB_PORT \
      --cidr "0.0.0.0/0" \
      --region "$AWS_REGION" > /dev/null

    aws ec2 authorize-security-group-ingress \
      --group-id "$DB_SECURITY_GROUP_ID" \
      --protocol tcp \
      --port $DB_PORT \
      --cidr "0.0.0.0/0" \
      --region "$AWS_REGION" > /dev/null
  fi

  # ECS
  ECS_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$NAME-ecs" "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "$AWS_REGION") > /dev/null

  if [ -z "$ECS_SECURITY_GROUP_ID" ] || [ "$ECS_SECURITY_GROUP_ID" == "None" ]; then
    ECS_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
      --group-name "$NAME-ecs" \
      --description "Security group for ECS tasks of $NAME" \
      --vpc-id "$VPC_ID" \
      --query "GroupId" \
      --output text \
      --region "$AWS_REGION")

    # Allow inbound traffic to container port from anywhere
    aws ec2 authorize-security-group-ingress \
      --group-id "$ECS_SECURITY_GROUP_ID" \
      --protocol tcp \
      --port $CONTAINER_PORT \
      --cidr 0.0.0.0/0 \
      --region "$AWS_REGION"
  fi

  # ALB
  ALB_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$NAME-alb" "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "$AWS_REGION")

  if [ -z "$ALB_SECURITY_GROUP_ID" ] || [ "$ALB_SECURITY_GROUP_ID" == "None" ]; then
    ALB_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
      --group-name "$NAME-alb" \
      --description "Security group for ALB of $NAME" \
      --vpc-id "$VPC_ID" \
      --query "GroupId" \
      --output text \
      --region "$AWS_REGION")

    # Allow inbound HTTP from anywhere
    aws ec2 authorize-security-group-ingress \
      --group-id "$ALB_SECURITY_GROUP_ID" \
      --protocol tcp \
      --port 80 \
      --cidr 0.0.0.0/0 \
      --region "$AWS_REGION"
  fi

  # Get public subnets
  PUBLIC_SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=true" \
    --query "Subnets[*].SubnetId" \
    --output text \
    --region "$AWS_REGION")

  # format public subnets
  SUBNET_LIST=$(echo $PUBLIC_SUBNETS | tr ' ' ',')

  if [ -z "$PUBLIC_SUBNETS" ]; then
    print_error "No public subnets found in VPC $VPC_ID"
    exit 1
  fi
}

rds_instance() {
  print_info "Verifying RDS..."

  aws rds describe-db-instances --db-instance-identifier "$NAME" --region "$AWS_REGION" > /dev/null 2>&1 || {
    read -sp "Enter master database password: " DB_PASSWORD
    echo ""

    print_info "Creating RDS instance (this may take several minutes)..."
    aws rds create-db-instance \
      --db-instance-identifier "$NAME" \
      --db-instance-class "$DB_INSTANCE_TYPE" \
      --engine "$DB_ENGINE" \
      --allocated-storage 20 \
      --region "$AWS_REGION" \
      --master-username "$DB_USERNAME" \
      --master-user-password "$DB_PASSWORD" \
      --db-name "$DB_NAME" \
      --vpc-security-group-ids "$DB_SECURITY_GROUP_ID" \
      --publicly-accessible \
      --backup-retention-period 7 \
      --preferred-backup-window "03:00-04:00" \
      --copy-tags-to-snapshot true \
      --deletion-protection true \
      --auto-minor-version-upgrade true > /dev/null

    aws ssm put-parameter --region="$AWS_REGION" --name "/$NAME/DB_USERNAME" --type "SecureString" --value "$DB_PASSWORD" --overwrite > /dev/null
    aws ssm put-parameter --region="$AWS_REGION" --name "/$NAME/DB_PASSWORD" --type "SecureString" --value "$DB_PASSWORD" --overwrite > /dev/null
    aws ssm put-parameter --region="$AWS_REGION" --name "/$NAME/DB_NAME" --type "SecureString" --value "$DB_PASSWORD" --overwrite > /dev/null
    aws ssm put-parameter --region="$AWS_REGION" --name "/$NAME/DB_PORT" --type "SecureString" --value "$DB_PASSWORD" --overwrite > /dev/null

    print_success "RDS instance creation initiated"
  }

  # Wait for RDS host to be available (this can take a while)
  while true; do
    DB_HOST=$(aws rds describe-db-instances \
      --db-instance-identifier "$NAME" \
      --region "$AWS_REGION" \
      --query "DBInstances[0].Endpoint.Address" \
      --output text)

    if [[ "$DB_HOST" != "None" ]]; then
      print_success "RDS instance available at $DB_HOST"
      echo "$DB_HOST" > endpoints.txt
      break
    else
      print_info "Waiting for RDS endpoint to be available..."
      sleep 10  # Sleep for 10 seconds before retrying
    fi
  done
  
  # Build Database URL
  DB_PASSWORD=$(aws ssm get-parameter --name "/$NAME/DB_PASSWORD" --query "Parameter.Value" --region "$AWS_REGION" --with-decryption --output text)
  DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  
  # Save to SSM
  aws ssm put-parameter --region="$AWS_REGION" --name "/$NAME/DATABASE_URL" --type "SecureString" --value "$DATABASE_URL" --overwrite > /dev/null
  
}

migrations() {
  print_info "Running Prisma migrations..."

  # Get AWS Account ID
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

  # Get the DATABASE_URL from SSM
  DATABASE_URL=$(aws ssm get-parameter --name "/$NAME/DATABASE_URL" --query "Parameter.Value" --region "$AWS_REGION" --with-decryption --output text )
  # Run the Prisma migration deploy command inside the container
  docker run --rm --platform linux/amd64 -e DATABASE_URL="$DATABASE_URL" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$NAME:latest" npx prisma migrate deploy

  print_success "Prisma migrations completed successfully"
}

build_and_push_image() {
  print_info "Building and pushing Docker image..."

  # Get AWS Account ID
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

  # Build Docker image
  docker build -t "$NAME" --platform linux/amd64 --no-cache . || {
    print_error "Docker build failed"
    exit 1
  }

  # Login to AWS ECR
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com" || {
    print_error "ECR login failed"
    exit 1
  }

  # Tag and push image
  docker tag "$NAME:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$NAME:latest"
  docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$NAME:latest" || {
    print_error "Failed to push image to ECR"
    exit 1
  }

  print_success "Image pushed successfully"
}

iam() {
  print_info "Verifying IAM..."

  # Check if role exists
  aws iam get-role --role-name ecsTaskExecutionRole >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    print_info "ECS Task Execution Role already exists"
    return 0
  fi

  print_info "Creating ECS Task Execution Role..."

  # Create the role with proper trust relationship
  aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": [
                  "ecs.amazonaws.com",
                  "ecs-tasks.amazonaws.com"
                ]
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }' > /dev/null || {
      print_error "Failed to create ECS Task Execution Role"
      exit 1
    }

  # Attach the AWS managed policy for ECS task execution
  aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy || {
      print_error "Failed to attach ECS Task Execution policy"
      exit 1
    }

  # Add policy for SSM parameter access
  aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name AccessPolicyCustomECS \
    --policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "ssm:GetParameters",
            "ssm:GetParameter"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "*"
        }
      ]
    }' || {
      print_error "Failed to attach SSM access policy"
      exit 1
    }

  print_success "ECS Task Execution Role created and configured successfully"
}

ecs_cluster() {
  print_info "Verifying ECS Cluster..."

  # Check if cluster exists and is active
  CLUSTER_STATUS=$(aws ecs describe-clusters \
    --clusters "$NAME" \
    --region "$AWS_REGION" \
    --query "clusters[0].status" \
    --output text 2>/dev/null)

  if [ -z "$CLUSTER_STATUS" ] || [ "$CLUSTER_STATUS" != "ACTIVE" ]; then
    aws ecs create-cluster \
      --cluster-name "$NAME" \
      --region "$AWS_REGION" > /dev/null || {
      print_error "Failed to create ECS cluster"
      exit 1
    }
    print_success "ECS cluster created successfully"
  fi
}

task_definition() {
  print_info "Verifying Task Definition..."

  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  
  TASK_DEFINITION=$(aws ecs register-task-definition \
    --family "$TASK_FAMILY" \
    --network-mode awsvpc \
    --requires-compatibilities FARGATE \
    --cpu 256 \
    --memory 512 \
    --task-role-arn "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole" \
    --execution-role-arn "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole" \
    --container-definitions "[{
      \"name\": \"$NAME\",
      \"image\": \"$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$NAME:latest\",
      \"portMappings\": [{
        \"containerPort\": $CONTAINER_PORT,
        \"hostPort\": $CONTAINER_PORT,
        \"protocol\": \"tcp\"
      }],
      \"essential\": true,
      \"environment\": [
        {\"name\": \"NODE_ENV\", \"value\": \"production\"}
      ],
      \"secrets\": [
        {\"name\": \"DATABASE_URL\", \"valueFrom\": \"arn:aws:ssm:$AWS_REGION:$AWS_ACCOUNT_ID:parameter/$NAME/DATABASE_URL\"}
      ],
      \"logConfiguration\": {
        \"logDriver\": \"awslogs\",
        \"options\": {
          \"awslogs-group\": \"/ecs/$NAME\",
          \"awslogs-region\": \"$AWS_REGION\",
          \"awslogs-stream-prefix\": \"ecs\",
          \"awslogs-create-group\": \"true\"
        }
      }
    }]" --region "$AWS_REGION" ) || {
    print_error "Failed to create task definition"
    exit 1
  }

  TASK_REVISION=$(echo "$TASK_DEFINITION" | jq -r '.taskDefinition.revision')
}

ecs_service() {
  print_info "Verifying ECS service..."

  # Check if target group exists
  TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --names "$NAME-tg" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text \
    --region "$AWS_REGION" 2>/dev/null || \
    aws elbv2 create-target-group \
      --name "$NAME-tg" \
      --protocol HTTP \
      --port $CONTAINER_PORT \
      --vpc-id $VPC_ID \
      --target-type ip \
      --query 'TargetGroups[0].TargetGroupArn' \
      --output text \
      --region "$AWS_REGION") > /dev/null


  SUBNET_ARRAY=(${SUBNET_LIST//,/ }) 

  # Check if ALB exists
  LOAD_BALANCER_ARN=$(aws elbv2 describe-load-balancers \
    --names "$NAME-alb" \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text \
    --region "$AWS_REGION" 2>/dev/null || \
    aws elbv2 create-load-balancer \
      --name "$NAME-alb" \
      --subnets "${SUBNET_ARRAY[@]}" \
      --security-groups $ALB_SECURITY_GROUP_ID \
      --scheme internet-facing \
      --query 'LoadBalancers[0].LoadBalancerArn' \
      --output text \
      --region "$AWS_REGION")
  
  # Wait for ALB to be active
  print_info "Waiting for ALB to be active..."
  while true; do
    ALB_STATE=$(aws elbv2 describe-load-balancers \
      --load-balancer-arns $LOAD_BALANCER_ARN \
      --query 'LoadBalancers[0].State.Code' \
      --output text \
      --region "$AWS_REGION") > /dev/null
    
    if [ "$ALB_STATE" = "active" ]; then
      print_success "ALB is now active"
      break
    fi
    
    print_info "ALB not ready yet, waiting..."
    sleep 10
  done

  # Create and verify listener
  print_info "Creating and verifying listener..."
  LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $LOAD_BALANCER_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --query 'Listeners[0].ListenerArn' \
    --output text \
    --region "$AWS_REGION" || \
    aws elbv2 describe-listeners \
      --load-balancer-arn $LOAD_BALANCER_ARN \
      --query 'Listeners[0].ListenerArn' \
      --output text \
      --region "$AWS_REGION") > /dev/null

  # Wait for listener to be ready
  while true; do
    if aws elbv2 describe-listeners \
      --listener-arns $LISTENER_ARN \
      --region "$AWS_REGION" >/dev/null 2>&1; then
      print_success "Listener is ready"
      break
    fi
    
    print_info "Listener not ready yet, waiting..."
    sleep 10
  done

  # Check if service exists
  SERVICE_EXISTS=$(aws ecs describe-services \
    --cluster "$NAME" \
    --services "$NAME" \
    --region "$AWS_REGION" \
    --query "length(services[?status!='INACTIVE'])" \
    --output text) > /dev/null

  if [ "$SERVICE_EXISTS" -eq 0 ]; then
    # Create new service
    aws ecs create-service \
      --cluster "$NAME" \
      --service-name "$NAME" \
      --task-definition "$TASK_FAMILY:$TASK_REVISION" \
      --desired-count 1 \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$ECS_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
      --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=$NAME,containerPort=$CONTAINER_PORT" \
      --region "$AWS_REGION" > /dev/null || {
      print_error "Failed to create ECS service"
      exit 1
    }
    print_success "ECS service created successfully"
  else
    # Update existing service
    aws ecs update-service \
      --cluster "$NAME" \
      --service "$NAME" \
      --task-definition "$TASK_FAMILY:$TASK_REVISION" \
      --force-new-deployment \
      --region "$AWS_REGION" > /dev/null || {
      print_error "Failed to update ECS service"
      exit 1
    }
    print_success "ECS service updated successfully"
  fi
}

get_service_url() {
  print_info "Getting service URL..."
  
  ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names "$NAME-alb" \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region "$AWS_REGION")

  if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "None" ]; then
    print_success "Service is accessible at: http://$ALB_DNS/api"
    echo "$ALB_DNS" >> endpoints.txt
  else
    print_error "Could not get ALB DNS name"
  fi
}

main() {

    # Validate AWS setup and parse arguments
    parse_arguments "$@"
    validate_aws_setup
    
    print_info "Starting deployment for '$NAME'..."
    # Clear context
    rm -f endpoints.txt alb_dns.txt >/dev/null 2>&1
    
    # Setup infrastructure
    network
    ecr_repository
    rds_instance

    # Build and deploy application
    build_and_push_image
    migrations
    iam
    ecs_cluster
    task_definition
    ecs_service
    get_service_url
   

    print_success "Deployment completed successfully!"
}


main "$@"