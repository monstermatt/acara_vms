# Demo/Test Deployment Setup Notes
1. Create instance and postgres db in Lightsail
- Instance 
    - Platform: Linux/Unix
    - Blueprint: OS Only, Ubuntu 24.04 LTS
    - Plan Type: General Purpose
    - Network Type: Dual-stack
    - Size: 2vCPU, 2GB RAM, 60GB SSD ($12 usd option)
    - Name: pulseup-deployment _(can be any name)_
- Postgres DB - 
    - PostgreSQL version 18.3
    - Select "specify login credentials" - username: vmsadmin, password: $psqlpwd
    - Database Plan: 2vCPU, 1GB RAM, 40GB SSD ($15 usd option)
    - name: pulseup-db _(can be any name)_
2. Connect to the instance (easiest through Lighsail "Connect using SSH" option)
3. Update the system using the following:
- `sudo apt update && sudo apt upgrade -y`
4. Install the necessary system packages (python, postgresql client, nginx):
- `sudo apt install -y python3-pip postgresql-client nginx git curl`
- `sudo apt install python3.12-venv`
5. Install pm2 and node packages:
- `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - `
- `sudo apt install -y nodejs`
- `sudo npm install -g pm2`
6. Create vms app directory:
- `sudo mkdir -p /var/www/vms`
- `sudo chown ubuntu:ubuntu /var/www/vms`
7. Clone vms repo:
- 7a) set up ssh key 
    - `ssh-keygen -t ed25519 -C "pulseup-deployment"`
- 7b) copy public key 
    - `cat ~/.ssh/id_ed25519.pub`
- 7c) set up ssh key with option "authentication key" in github account / settings / SSH and GPG keys
    - `paste the copied public key from step 7b`
- 7d) clone repo into the `/var/www/vms` directory
    - `git clone git@github.com:srinivasandharma/hes-pulseup.git`
- 7e) -OPTIONAL- delete the ssh key created in github account for security as it is provides full account access.
8. Set up the python virtual environment
- `cd ./hes-pulseup/vms`
    - The full path will be `cd /var/www/vms/hes-pulseup/vms` (this is referred to as "vms root directory" in later steps)
- `python3 -m venv venv`
- `source venv/bin/activate`
9. Install vms dependencies and gunicorn
- `pip install --upgrade pip`
- `pip install -r requirements.txt`
- `pip install gunicorn`
10. Copy .env.example file to create .env file and fill in missing variables:
- `cp .env.example .env`
- `nano .env`
- Example of .env file for deployment:
    - DB_NAME=`vms`
    - DB_USER=`vmsadmin`
    - DB_PASSWORD=`$psqlpwd`
    - DB_HOST=`{db_endpoint}`
    - DB_PORT=`5432`

    - DJANGO_SECRET_KEY=`{django_secret}`
    - ALLOWED_HOSTS=`{instance_public_ipv4},127.0.0.1,localhost` This line is added to simplify instance restarts

    - NEXTAUTH_SECRET=`{nextauth_secret}` 
    - NEXTAUTH_URL=`http://{instance_public_ipv4}`
    - NEXT_PUBLIC_BASE_URL=`http://{instance_public_ipv4}`
    - NEXTAUTH_BACKEND_URL=`http://127.0.0.1:8000`
- Where:
    - `{db_endpoint}` is the endpoint copied from the created database info page in AWS: 
        - e.g. `ls-d81d0e097e1555fefbee6c88eeaec4a7b9f12345.ccby8oum6kx7.us-east-1.rds.amazonaws.com`
    - `{django_secret}` is made using `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`:
        - e.g. `qSY9DUuzUamJvbrszS0S3udLkforDWtBsEgBzK2x-zLEA3PjyIkTv6ChCWnF4T12345`
    - `{nextauth_secret}` is made using `openssl rand -base64 32`:
        - e.g. `Jb72rRqy3/mUQFVSaHRZVBy90Zg8OVLrteLZ0C12345=`
    - `{instance_public_ipv4}` is found on instance info page in AWS:
        - e.g. `18.209.245.123`
- And in vms/vmsproject:
    - `nano settings.py`
    - Set ALLOWED HOSTS = `os.getenv('ALLOWED_HOSTS', '').split(',')`
    - Add to CORS_ALLOWED_ORIGINS: `http://{instance_public_ipv4}` in the line where the `# Replace in production` note is placed
    - In DATABASES, change 'HOST': 'localhost' to 'HOST': `os.environ.get('DB_HOST'),`
11. Set up vms DB:
- 11a) connect to the lightsail postgres db
    - `psql -h {db_endpoint} -U vmsadmin -d {postgres}`
    - where `{db_endpoint}` is the endpoint copied from the created database info section in AWS (e.g. `ls-d81d0e097e1555fefbee6c88eeaec4a7b9f12345.ccby8oum6kx7.us-east-1.rds.amazonaws.com`) and `{postgres}` is `postgres`
- 11b) after connecting, instructions are slightly different from those in vms/db/README.md:
    - `CREATE DATABASE vms;`
    - The vmsadmin user is already created during postgres_db setup -> skip creating user command
    - `GRANT ALL PRIVILEGES ON DATABASE vms TO vmsadmin;`
    - `GRANT ALL ON SCHEMA public TO vmsadmin;`
    - `ALTER DATABASE vms OWNER TO vmsadmin;`
- *Note:* After `vms` db is created, connect directly to the db if needed with:
    - `psql -h {db_endpoint} -U vmsadmin -d vms`
12. Run python migrations in vms root directory (ensure that venv is enabled)
- `python manage.py migrate`
13. Build the next.js app from vms root directory
- `rm -r .next` *Note:* this line is optional, but can mitigate looping during compilation
- `npm install`
- `npm run build`
14. Set up PM2:
- 14a) create config file in the root vms folder using:
    - `nano ecosystem.config.js`
- 14b) add the following content:
```
module.exports = {
  apps: [
    {
      name: 'django-app',
      script: '/var/www/vms/hes-pulseup/vms/venv/bin/gunicorn',
      args: 'vmsproject.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120',
      cwd: '/var/www/vms/hes-pulseup/vms',
      interpreter: 'none',
      watch: false,
      env: {
        DJANGO_SETTINGS_MODULE: 'vmsproject.settings',
        DJANGO_ENV: 'production',
      }
    },
    {
      name: 'nextjs-app',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/vms/hes-pulseup/vms/app',
      interpreter: 'none',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      }
    }
  ]
}
```
15. Setup vms NGINX:
- 15a) create the config for vms:
    - `sudo nano /etc/nginx/sites-available/vms`
- 15b) add the following content (please note any in line comments starting with REPLACE):
```
server {
    listen 80;
    server_name 18.209.245.123; # REPLACE with instance's public ipv4
    merge_slashes on; # ensuring 
    location /api/auth/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # django api
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }

    # next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
- 15c) Enable the vms site and restart NGINX:
    - `sudo ln -s /etc/nginx/sites-available/vms /etc/nginx/sites-enabled/`
    - `sudo rm /etc/nginx/sites-enabled/default` This line removes the default NGINX site
    - `sudo nginx -t` This line ensures vms NGINX config is good to go
    - `sudo systemctl enable nginx`
    - `sudo systemctl restart nginx`
16. Start PM2 (starts both the built next.js app and django app as per setup):
- `pm2 start ecosystem.config.js`
- `pm2 save`
17. Handling future upgrades to vms:
- `git pull` (See step 7 if the ssh key was deleted from github account and/or the instance)
- run python migrations (See step 12)
- rebuild the next.js app (See step 13)
- `pm2 restart all` to ensure new next.js build is captured
- `pm2 save`

**Disclaimer - HTTPS Certificates (via certbot) are not accounted for in these setup steps** 