#!/bin/bash
mkdir -p ./logs
#${DB_URL}
#mongodb://localhost:27017/itr-portal
node app.js --dbUrl=mongodb://127.0.0.1:27017/itr-portal