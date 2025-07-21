#!/bin/bash
docker compose -p cronicorn-cronicorn --env-file .env.production  -f ./docker/docker-compose.yml up -d --build --remove-orphans 
