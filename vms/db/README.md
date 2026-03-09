Instructions to set up PostgreSQL 

Set up
brew install postgresql@16  
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
brew services start postgresql@16  

Validate
psql --version 

Instructions to connect to PostgreSQL (outside of the application APIs)
For database and user initialization

Connect
psql postgres

Create database
CREATE DATABASE vms;

Check if database was created
\list

Create user with password set from an environment variable
psql postgres -c "CREATE USER vmsadmin WITH PASSWORD '$psqlpwd';"

Give the user access
GRANT ALL PRIVILEGES ON DATABASE vms TO vmsadmin;
GRANT ALL ON SCHEMA public TO vmsadmin;
ALTER DATABASE vms OWNER TO vmsadmin;

Connect as new user
psql -U vmsadmin -d vms


