## Temporal Codec Server
TODO URL

- TODO, coherent instructions!

### Install
- `cd server/`
- `npm install`

- `cd ui/`
- `npm install`

### Developer environment
- Requires nodemon and ts-node installed
- Open VSCode and hit 'start debugging' on the 'Launch' configuration

### Configuration
- `server/` contains `.env_example`. Copy it to `.env.development` and change settings to match your temporal installation.

### Docker (not implemented yet)

`cd server`

`docker build -t temporal-codec-server .`

`docker run -p 3000:3000 -e CERT_CONTENT="$(cat /path/to/cert.pem)" -e KEY_CONTENT="$(cat /path/to/cert.key)" -e PORT=3000 -d --platform linux/amd64 temporal-codec-server`

### Kubernetes (not implemented yet)

- Edit the yaml files to ensure your environment variables are correct (e.g. namespace and address).

```
cd yaml/
kubectl apply -f deployments/server-deployment.yaml
kubectl apply -f services/server-service.yaml
kubectl apply -f ingress/server-ingress.yaml
```