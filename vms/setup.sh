#!/bin/bash

python -m venv vms-venv
source vms-venc/bin/activate
pip install -r requirements.txt

if [ ! -f .env ]; then
  echo "Env file is missing. Env variables are needed from this file to connect to the DB, Copy the .env.example as .env and add values and then run python manage.py migrate"
  exit 1
fi

python manage.py migrate
