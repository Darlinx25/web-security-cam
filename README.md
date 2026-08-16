# CamWeb - Camaras en vivo + grabaciones

Web simple para ver camaras en vivo y consultar clips grabados cada 30 segundos.
Pensada para la laptop con Ubuntu Server (Docker). Los clips de mas de 5 dias
se borran solos.

## Como funciona

```
Cámara patio (192.168.1.2) ──┐
                             ├─→  go2rtc (en la laptop, docker) → web + grabador
Cámara puerta (192.168.1.3) ─┘     (jala el RTSP de las camaras directo)
```

Todo corre en la laptop: go2rtc, la web, la base y el grabador. Es 100%
**independiente de la torre** (la laptop toma el video directo de las camaras).
La torre puede apagarse y esto sigue funcionando igual.

## Componentes (docker compose)

| Servicio | Imagen | Funcion |
|---|---|---|
| `go2rtc` | alexxit/go2rtc | Jala las camaras (RTSP) y las sirve en HLS/RTSP |
| `web` | php:8.2-apache | Pagina web + API (puerto 8080) |
| `db` | mariadb:11 | Registro de clips (busqueda rapida) |
| `recorder` | jrottenberg/ffmpeg | Graba la camara cada 30s y limpia clips viejos |

La lista de grabaciones usa la base de datos; si la base no esta, escanea la
carpeta `clips/` directamente (asi nunca se pierde el listado).

## Instalacion en la laptop

### Opcion simple (recomendada)

1. **Copiar esta carpeta** a la laptop (por USB, red o git).
2. Abrir una terminal en la carpeta y correr:

   ```
   ./run.sh
   ```

   El script instala Docker si falta, crea el `.env` y levanta todo.
   Si recien instalo Docker, te va a pedir cerrar sesion y volver a entrar,
   y despues correr `./run.sh` otra vez.

3. **Abrir en cualquier navegador**: `http://IP-de-la-laptop:8080` (el script
   te muestra la direccion).

### Opcion manual (paso a paso)

1. **Instalar Docker** (una sola vez):
   ```
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
   Cerrar sesion y volver a entrar (para que tome el grupo docker).

2. **Configurar**:
   ```
   cd cam-web
   cp .env.example .env
   nano .env
   ```
   Ahi se define:
   - `CAMERA` → camara que se graba (`patio` por ahora).
   - `API_TOKEN` → cambiarlo por una clave propia.
   - `WEB_PORT` → puerto de la web (8080).
   - `GO2RTC_HOST` → dejarlo vacio (usa la propia laptop).

   Las IP de las camaras estan en `go2rtc/go2rtc.yaml` (mismo formato que el
   go2rtc de la torre). Ahi agregas o cambias camaras.

3. **Levantar**:
   ```
   docker compose up -d --build
   ```

4. **Abrir en cualquier navegador**: `http://IP-de-la-laptop:8080`
   - **EN VIVO**: camara en grande al entrar.
   - **GRABACIONES**: elegir dia y camara, click para ver, boton para descargar.

5. **Ver el estado** (opcional):
   ```
   docker compose ps          # estado
   docker compose logs -f recorder   # grabaciones
   docker compose logs -f web        # web
   ```

## Agregar la camara de la puerta (mas adelante)

- En `go2rtc/go2rtc.yaml` la fuente `puerta` ya esta configurada.
- En `.env` poner `CAMERA=puerta` en el grabador (o agregar un segundo servicio)
  y `CAMERA_ENABLED_PUERTA=1` para que aparezca en la web.

## Como funcionan los clips

- El grabador se conecta a `rtsp://go2rtc:8554/CAMERA` (go2rtc local, por TCP) y
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

## Requisitos previos (en la laptop)

- Docker (paso 1). No hace falta ninguna otra maquina.
- La laptop debe poder llegar a las camaras `192.168.1.2` y `192.168.1.3`
  (misma red).

## Notas

- Si el video en vivo se corta, la pagina cae sola al reproductor de go2rtc
  (iframe) y se recupera sola.
- La laptop y las camaras deben estar en la misma red.
- Los clips se guardan en `./clips` (dentro del proyecto).
- La web usa por defecto el go2rtc local: no hace falta conocer la IP de la
  laptop. Si quisieras apuntar a otro go2rtc, pone su IP en `GO2RTC_HOST`.
- El go2rtc de la laptop no interfiere con el de la torre: las camaras aceptan
  varias conexiones a la vez.
