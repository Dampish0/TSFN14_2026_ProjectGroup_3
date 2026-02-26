### We used a combination of AKS and minikube.
Today we managed to get azure working and tried the terrform commands there which worked like normal. For everything else, we have already done it in minikube.

### To deploy our application please head to DockerHub and pick the correct image
Go to https://hub.docker.com/repository/docker/dampish0/prodimage/general and pick the image tag you want (we recommend `dampish0/prodimage:latest`). If you want a different tag than `latest`, update the `image:` field in [deployment.yaml](deployment.yaml).

### For Terraform (AKS)
Terraform in this repo provisions the Azure infrastructure (Resource Group, AKS, ACR). After `terraform apply`, you still deploy the application by applying the Kubernetes manifests to the cluster (for example: `kubectl apply -f deployment.yaml` and `kubectl apply -f service.yaml`).

# for minikube
however since we use minikube, if you already have a minikube deployment, usually you only need to restart it. If you want to create a deployment, you can run these commands

"minikube start"

"minikube dashboard"

then your browser should open up and you can hit the "+" in the top right and copy paste the deployment.yaml and run and then repeat the same thing for the service.yaml

### where replicas are configured

Replicas are configured in the Kubernetes Deployment manifest, in [deployment.yaml](deployment.yaml) under `spec.replicas` (currently `replicas: 2`). To scale, either change that number and re-apply the manifest, or run `kubectl scale deployment fogis-backend --replicas=<N>`.


### How kubernetes performs load balance in our setup
Kubernetes load-balances traffic at the Service level by distributing requests across the matching Pod endpoints. We expose the Service using `type: LoadBalancer`; on Minikube this requires running `minikube tunnel` in another terminal aswell or the external IP can stay in a pending state and the instance will be unreachable.

### We also provided a Task3Report.pdf for some images when we run the service on minikube.