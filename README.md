## Temporal Codec Server
https://codec.tmprl-demo.cloud/

Based on the [Temporal Typescript Sample](https://github.com/temporalio/samples-typescript/blob/main/encryption/src/codec-server.ts)

### Install
- `cd server/`
- `npm install`

### Developer environment
- Requires nodemon and ts-node installed
- Open VSCode and hit 'start debugging' on the 'Codec Server' configuration

### Configuration
- `server/` contains `.env_example`. Copy it to `.env.development` and change settings to match your temporal installation.

### Docker (not implemented yet)

`cd server`

`docker build -t temporal-codec-server .`

`docker run -p 3000:3000 -e PORT=3000 -d --platform linux/amd64 temporal-codec-server`

### Kubernetes

- Edit the yaml files to ensure your environment variables are correct (e.g. namespace and address).

```
cd yaml/
kubectl apply -f deployments/server-deployment.yaml
kubectl apply -f services/server-service.yaml
kubectl apply -f ingress/server-ingress.yaml
kubectl apply -f certificates/certificate.yaml
```