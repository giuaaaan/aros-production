FROM mcr.microsoft.com/devcontainers/typescript-node:18

# Installa PostgreSQL
RUN apt-get update && apt-get install -y postgresql postgresql-contrib && rm -rf /var/lib/apt/lists/*

# Configura PostgreSQL
RUN service postgresql start && \
    su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" && \
    su - postgres -c "psql -c \"CREATE DATABASE aros;\""

# Porta di PostgreSQL
EXPOSE 5432
