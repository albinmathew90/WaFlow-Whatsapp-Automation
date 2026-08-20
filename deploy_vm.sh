#!/bin/bash

cd /home/azureuser/convoreach/Frontend
npm run build

sudo sed -i 's/proxy_cache_bypass \$http_upgrade;/proxy_cache_bypass \$http_upgrade;\n        proxy_buffering off;\n        proxy_set_header X-Real-IP \$remote_addr;\n        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;/g' /etc/nginx/sites-available/waflow

grep -q "TRUSTED_PROXIES=127.0.0.1" /home/azureuser/convoreach/Backend/.env || echo "TRUSTED_PROXIES=127.0.0.1" >> /home/azureuser/convoreach/Backend/.env

sudo systemctl restart nginx
pm2 restart convoreach-api
