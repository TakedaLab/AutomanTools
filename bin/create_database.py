#!/usr/bin/env python
import os
import pymysql

MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_DB_NAME = os.getenv('MYSQL_DB_NAME')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', "3306"))


if __name__ == '__main__':
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
    )
    conn.cursor().execute(f'create database if not exists {MYSQL_DB_NAME}')
