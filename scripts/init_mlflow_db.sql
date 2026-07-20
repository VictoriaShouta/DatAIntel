-- postgres container ilk ayağa kalkışında çalışır (docker-entrypoint-initdb.d).
-- Ana POSTGRES_DB (datAIntel) dışında MLflow'un kendi backend store'u için
-- ayrı bir veritabanı oluşturur.
SELECT 'CREATE DATABASE mlflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mlflow')\gexec
