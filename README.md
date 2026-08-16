# CamWeb - Camaras en vivo + grabaciones

Web simple para ver camaras en vivo y consultar clips grabados cada 30 segundos.
Pensada para la laptop con Ubuntu Server (Docker). Los clips de mas de 5 dias
se borran solos.

Se conecta a **go2rtc** (el router que sirve las camaras por RTSP/HLS). Solo
cambia la IP en `.env` y anda.

## Componentes (docker compose)

| Servicio | Imagen | Funcion |
|---|---|---|
| `web` | php:8.2-apache | Pagina web + API (puerto 8080) |
| `db` | mariadb:11 | Registro de clips (busqueda rapida) |
| `recorder` | jrottenberg/ffmpeg | Graba la camara cada 30s y limpia clips viejos |

La lista de grabaciones usa la base de datos; si la base no esta, escanea la
carpeta `clips/` directamente (asi nunca se pierde el listado).

## Instalacion en la laptop

1. **Instalar Docker** (una sola vez):
   ```
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
   Cerrar sesion y volver a entrar (para que tome el grupo docker).

2. **Copiar esta carpeta** a la laptop (por USB, red o git).

3. **Configurar**:
   ```
   cd cam-web
   cp .env.example .env
   nano .env
   ```
   Ahi se define:
   - `GO2RTC_HOST` → IP del router con go2rtc (la de la laptop NO).
   - `CAMERA` → camara que se graba (`patio` por ahora).
   - `API_TOKEN` → cambiarlo por una clave propia.
   - `WEB_PORT` → puerto de la web (8080).

4. **Levantar**:
   ```
   docker compose up -d --build
   ```

5. **Abrir en cualquier navegador**: `http://IP-de-la-laptop:8080`
   - **EN VIVO**: camara en grande al entrar.
   - **GRABACIONES**: elegir dia y camara, click para ver, boton para descargar.

6. **Ver el estado** (opcional):
   ```
   docker compose ps          # estado
   docker compose logs -f recorder   # grabaciones
   docker compose logs -f web        # web
   ```

## Agregar la camara de la puerta (mas adelante)

- En go2rtc del router la fuente `puerta` ya esta configurada.
- En `.env` poner `CAMERA=puerta` en el grabador (o agregar un segundo servicio)
  y `CAMERA_ENABLED_PUERTA=1` para que aparezca en la web.

## Como funcionan los clips

- El grabador se conecta a `rtsp://GO2RTC_HOST:8554/CAMERA` (por TCP) y
  descarga 30 segundos por clip: `clips/YYYY/MM/DD/cam_AAAAMMDD_HHMMSS.mp4`
  mas su miniatura `.jpg`.
- Registra cada clip en la web (POST `api/register.php` con token).
- Cada ~1 hora borra los clips con mas de `RETENTION_DAYS` dias y avisa a la web
  (`api/cleanup.php`) para que tambien los saque de la base.

## Endpoints

| Ruta | Metodo | Uso |
|---|---|---|
| `/live.php` | GET | Camara en vivo |
| `/clips.php` | GET | Lista de grabaciones |
| `/api/clips.php?date=YYYY-MM-DD&cam=patio` | GET | JSON con clips del dia |
| `/api/register.php` | POST | El grabador registra un clip (token) |
| `/api/cleanup.php` | POST | El grabador avisa limpieza (token) |

## Requisitos previos (en el router)

- go2rtc sirviendo el stream `patio` en `:1984` (HLS en
  `/api/stream.m3u8?src=patio` y RTSP en `:8554/patio`).

## Notas

- Si el video en vivo se corta, la pagina cae sola al reproductor de go2rtc
  (iframe) y se recupera sola.
- La laptop y el router deben estar en la misma red.
- Los clips se guardan en `./clips` (dentro del proyecto).
