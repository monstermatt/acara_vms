Instructions to set up PostgreSQL in Linux(Ubuntu/Debian)

If the package postgresql-16 is not available, run these commands first:
    sudo apt install -y postgresql-common
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
    sudo apt update

sudo apt install postgresql-16
sudo systemctl start postgresql
sudo systemctl enable postgresql

For AI matching:
    sudo apt install postgresql-16-pgvector
    sudo -u postgres psql -d vms -c "CREATE EXTENSION vector;"


Validate
psql --version 

Instructions to connect to PostgreSQL (outside of the application APIs)
For database and user initialization

Connect
sudo -u postgres psql postgres

Create database
CREATE DATABASE vms;

Check if database was created
\list

Create user with password set from an environment variable
CREATE USER vmsadmin WITH PASSWORD '$psqlpwd';

Give the user access
GRANT ALL PRIVILEGES ON DATABASE vms TO vmsadmin;
GRANT ALL ON SCHEMA public TO vmsadmin;
ALTER DATABASE vms OWNER TO vmsadmin;

Connect as new user
psql -U vmsadmin -d vms


