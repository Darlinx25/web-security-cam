# CamWeb - Camaras en vivo + grabaciones

Web para ver camaras en vivo y consultar clips grabados cada 3 minutos.
Funciona en celular y compu. Las dos camaras (patio y puerta) se graban
y se ven simultaneamente.

## Como funciona

```
Cámara patio (192.168.1.x) ──┐
                             ├─→  go2rtc (en el servidor) → web + 2 grabadores
Cámara puerta (192.168.1.x) ─┘
```
## Componentes (docker compose)

| Servicio | Imagen | Funcion |
|---|---|---|
| `go2rtc` | alexxit/go2rtc | Jala las camaras (RTSP) y las sirve en HLS/RTSP |
| `web` | php:8.2-apache | Pagina web + API (puerto 8080) |
| `db` | mariadb:11 | Registro de clips (busqueda rapida) |
| `recorder-patio` | jrottenberg/ffmpeg | Graba clips de patio cada 30s |
| `recorder-puerta` | jrottenberg/ffmpeg | Graba clips de puerta cada 30s |

## Instalacion en la laptop

### Opcion simple (recomendada)

1. **Copiar esta carpeta** a la laptop (por USB, red o git).
2. Abrir una terminal en la carpeta y correr:

   ```
   ./run.sh
   ```

   El script instala Docker si falta, crea el `.env` y levanta todo.

3. **Abrir en el navegador**: `http://IP-de-la-laptop:8080`
   En celular: agregar a pantalla de inicio para usar como app.

### Opcion manual

1. Instalar Docker:
   ```
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
   Cerrar sesion y volver a entrar.

2. Configurar:
   ```
   cd cam-web
   cp .env.example .env
   nano .env
   ```

3. Levantar:
   ```
   docker compose up -d --build
   ```

## Que muestra la web

- **EN VIVO**: las dos camaras en vivo, apiladas en celular o lado a lado en
  compu. Cada una tiene boton de pantalla completa. Si el video se corta, cae
  solo al reproductor de go2rtc (iframe).
- **GRABACIONES**: buscar por dia y camara, ver inline, descargar.

## Como funcionan los clips

- Cada grabador se conecta a `rtsp://go2rtc:8554/patio` o `/puerta` (por TCP)
  y guarda 30 segundos por clip: `clips/YYYY/MM/DD/cam_AAAAMMDD_HHMMSS.mp4`
  mas su miniatura `.jpg`.
- Registra cada clip en la web (POST `api/register.php` con token).
- Cada ~1 hora borra los clips con mas de 5 dias (filesystem + base).

## Endpoints

| Ruta | Metodo | Uso |
|---|---|---|
| `/live.php` | GET | Camaras en vivo |
| `/clips.php` | GET | Lista de grabaciones |
| `/api/clips.php?date=YYYY-MM-DD&cam=patio` | GET | JSON con clips del dia |
| `/api/register.php` | POST | El grabador registra un clip (token) |
| `/api/cleanup.php` | POST | El grabador avisa limpieza (token) |

## Notas

- El server debe estar en la misma red que las camaras (192.168.1.x).
- `go2rtc/go2rtc.yaml` tiene las IP y credenciales de las camaras.
- La web usa por defecto el go2rtc local; si queres apuntar a otro, hay que la
  IP en `GO2RTC_HOST`.
