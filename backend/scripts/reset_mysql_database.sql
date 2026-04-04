-- Destroys ALL data in the finance_dashboard database and recreates it empty.
-- Use when Django migrations were never applied to MySQL, or the schema is broken
-- (missing transactions_category, missing type column, etc.).
--
-- Run from a terminal (adjust user/password):
--   mysql -u root -p < scripts/reset_mysql_database.sql
--
-- Then from the backend folder:
--   python manage.py migrate
--   python manage.py createsuperuser   (optional)

DROP DATABASE IF EXISTS finance_dashboard;
CREATE DATABASE finance_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
