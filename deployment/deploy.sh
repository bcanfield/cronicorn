#!/bin/bash
# docker compose -p cronicorn-cronicorn -f --env-file .env.production  ./deployment/docker-compose-deploy.yml up -d --build --remove-orphans 
docker compose -p cronicorn-cronicorn --env-file .env.production  -f ./deployment/docker-compose-deploy.yml up -d --build --remove-orphans 
