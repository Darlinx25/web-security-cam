#!/bin/sh
# Instala Docker si falta y levanta toda la web (go2rtc + web + db + grabador).
# Uso: ./run.sh

set -e
cd "$(dirname "$0")"

# 1. Docker instalado?
if ! command -v docker >/dev/null 2>&1; then
    echo "==> Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    if command -v docker >/dev/null 2>&1; then
        sudo usermod -aG docker "$USER"
        echo "==> Docker instalado."
        echo "    Cierra sesion y volve a entrar, luego corre ./run.sh de nuevo."
        exit 0
    fi
    echo "==> No se pudo instalar Docker. Revisa arriba que fallo."
    exit 1
fi

# 2. Docker accesible sin sudo?
SUDO=
if ! docker info >/dev/null 2>&1; then
    echo "==> Docker no es accesible con tu usuario, probando con sudo..."
    if sudo -n true 2>/dev/null; then
        SUDO=sudo
    else
        echo "==> Necesitas permisos de docker. Hace una de estas:"
        echo "     1) cerrar sesion y volver a entrar (grupo docker), o"
        echo "     2) correr:  sudo usermod -aG docker \$USER   y re-logear"
        exit 1
    fi
fi

# 3. Compose disponible?
if ! $SUDO docker compose version >/dev/null 2>&1; then
    echo "==> Este sistema no tiene 'docker compose'. Actualizalo con:"
    echo "    sudo apt install docker-compose-plugin"
    exit 1
fi

# 4. .env creado?
if [ ! -f .env ]; then
    cp .env.example .env
    echo "==> Se creo el archivo .env. Revisalo si queres: nano .env"
fi

# 5. Levantar todo
echo "==> Levantando contenedores (la primera vez baja imagenes, tarda un rato)..."
$SUDO docker compose up -d --build

# 6. Info
PORT=$(grep '^WEB_PORT=' .env 2>/dev/null | head -1 | cut -d= -f2)
PORT=${PORT:-8080}
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo
echo "==> Listo!"
if [ -n "$IP" ]; then
    echo "    Web:   http://$IP:$PORT"
    echo "    Estado: $SUDO docker compose ps"
    echo "    Logs grabador: $SUDO docker compose logs -f recorder"
else
    echo "    Web:   http://<IP-de-esta-laptop>:$PORT"
fi
