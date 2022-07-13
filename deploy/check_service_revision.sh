re='^[0-9]+$'
REVISION=${1?Error: please define task definition revision}
ECS_SERVICE=${2?Error: please define ecs service}
ECS_CLUSTER=${3?Error: please define ecs cluster}
ACTIVE_REVISION=$(aws ecs describe-services --services $ECS_SERVICE --cluster $ECS_CLUSTER | jq -r '.services | .[0] | .taskDefinition' | grep -o '.\{'${#REVISION}'\}$')

if ! [[ $ACTIVE_REVISION =~ $re ]] ; then
   echo "error: Not a number" >&2; 
   exit 1
fi

if [ $ACTIVE_REVISION -ne $REVISION ]; then
  echo "Deployed revision task definition $ACTIVE_REVISION not $REVISION. Please check ECS service $ECS_SERVICE events and logs.";
  exit 1
else 
  echo "Revision number $REVISION for service $ECS_SERVICE deployed successfully."
  exit 0
fi