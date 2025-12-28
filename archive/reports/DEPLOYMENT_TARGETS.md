# Deployment Targets

    ## Single-VM (Docker + Nginx)
    - Reverse proxy at `:80/:443` → FE `:3000`, API `:8000`
    - SSL via Let's Encrypt (certbot)

    ## Kubernetes (future)
    - Ingress, HPA for API, sticky sessions not required
    - External Postgres/Redis services
