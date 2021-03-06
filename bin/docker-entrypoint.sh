#! /bin/bash
set -ex

until mysqladmin ping -h ${MYSQL_HOST} -P ${MYSQL_PORT:-3306} --silent; do
    echo 'waiting for mysqld to be connectable...'
    sleep 3
done

python bin/create_database.py
cd automan/
python manage.py makemigrations
python manage.py migrate

exec "$@"
