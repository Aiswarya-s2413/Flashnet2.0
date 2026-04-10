#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "Abacus@2026" | sudo -S apt-get update -y
echo "Abacus@2026" | sudo -S apt-get install -y python3-venv python3-pip docker.io docker-compose git libpq-dev postgresql-client nginx supervisor python3-dev

cd /home/mohit
if [ ! -d "Flashnet2.0" ]; then
    git clone https://github.com/Aiswarya-s2413/Flashnet2.0.git
fi

cd Flashnet2.0
git fetch origin
git reset --hard origin/main
cd backend

# Ensure permissions
chown -R mohit:mohit .

# Start postgres DB strictly natively
echo "Abacus@2026" | sudo -S docker-compose down || true
echo "Abacus@2026" | sudo -S docker-compose up -d
sleep 5

# Build Python layer
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
python manage.py makemigrations
python manage.py migrate

# Setup highly robust Gunicorn Daemon through supervisor
echo "Abacus@2026" | sudo -S bash -c 'cat > /etc/supervisor/conf.d/gunicorn.conf <<EOF
[program:gunicorn]
directory=/home/mohit/Flashnet2.0/backend
command=/home/mohit/Flashnet2.0/backend/venv/bin/gunicorn --workers 3 --bind unix:/home/mohit/Flashnet2.0/backend/app.sock config.wsgi:application
autostart=true
autorestart=true
stderr_logfile=/var/log/gunicorn/gunicorn.err.log
stdout_logfile=/var/log/gunicorn/gunicorn.out.log
user=mohit
environment=LANG=en_US.UTF-8,LC_ALL=en_US.UTF-8
EOF'

echo "Abacus@2026" | sudo -S mkdir -p /var/log/gunicorn
echo "Abacus@2026" | sudo -S supervisorctl reread || true
echo "Abacus@2026" | sudo -S supervisorctl update || true
echo "Abacus@2026" | sudo -S supervisorctl restart gunicorn || true

# Setup Nginx Proxy Pass gracefully
echo "Abacus@2026" | sudo -S bash -c 'cat > /etc/nginx/sites-available/flashnet <<EOF
server {
    listen 80;
    server_name 168.144.27.187 flashnet.aiswaryasathyan.space;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location / {
        include proxy_params;
        proxy_pass http://unix:/home/mohit/Flashnet2.0/backend/app.sock;
    }
}
EOF'

echo "Abacus@2026" | sudo -S ln -sf /etc/nginx/sites-available/flashnet /etc/nginx/sites-enabled
echo "Abacus@2026" | sudo -S rm -f /etc/nginx/sites-enabled/default
echo "Abacus@2026" | sudo -S systemctl restart nginx

echo "====== BOOTSTRAP COMPETED ======"
