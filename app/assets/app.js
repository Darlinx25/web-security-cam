// Reproduccion en vivo via HLS (hls.js), con fallback al reproductor de go2rtc
// si el video no avanza (corte de se�al, navegador sin soporte, etc).

window.playingSince = {};

document.addEventListener('DOMContentLoaded', function () {
  for (var id in window.CAMERAS) {
    if (Object.prototype.hasOwnProperty.call(window.CAMERAS, id)) {
      iniciar(id, window.CAMERAS[id]);
    }
  }
});

function iniciar(id, cam) {
  var video = document.getElementById('v-' + id);
  var off = document.getElementById('off-' + id);
  var dot = document.getElementById('dot-' + id);

  function marcar(ok) {
    if (off) off.style.display = ok ? 'none' : 'block';
    if (dot) dot.classList.toggle('on', !!ok);
    if (ok) window.playingSince[id] = Date.now();
  }

  function enReproduccion() {
    marcar(true);
  }

  var hayHlsJs = window.Hls && Hls.isSupported();
  var hayNativo = video.canPlayType('application/vnd.apple.mpegurl');

  if (hayNativo) {
    // Safari / iOS
    video.src = cam.hls;
    video.addEventListener('playing', enReproduccion);
    video.addEventListener('error', function () { marcar(false); });
    marcar(false);
  } else if (hayHlsJs) {
    var hls = new Hls({
      liveDurationInfinity: true,
      liveSyncDurationCount: 2
    });
    hls.on(Hls.Events.MANIFEST_PARSED, enReproduccion);
    hls.on(Hls.Events.ERROR, function (_e, data) {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else {
        marcar(false);
      }
    });
    video.addEventListener('playing', enReproduccion);
    hls.loadSource(cam.hls);
    hls.attachMedia(video);
    marcar(false);
  } else {
    if (off) off.textContent = 'Tu navegador no soporta video';
    marcar(false);
    return;
  }

  // Vigilante: si en ~12s el video no avanzo, pasar al reproductor de go2rtc.
  var ultimo = 0;
  var contador = 0;
  var vigilante = setInterval(function () {
    var actual = video.currentTime || 0;
    var avanzo = actual !== ultimo;
    ultimo = actual;
    contador++;
    if (contador >= 3 && !avanzo) {
      clearInterval(vigilante);
      // dar 4s mas de margen por si esta buffereando
      setTimeout(function () {
        var a2 = video.currentTime || 0;
        if (Math.abs(a2 - actual) < 0.01) {
          fallbackGo2rtc(id, cam);
        }
      }, 4000);
    }
  }, 4000);
}

function fallbackGo2rtc(id, cam) {
  var sec = document.querySelector('.cam[data-cam="' + id + '"]');
  if (!sec || sec.dataset.fallback) return;
  sec.dataset.fallback = '1';

  var video = document.getElementById('v-' + id);
  var off = document.getElementById('off-' + id);
  var dot = document.getElementById('dot-' + id);

  var ifr = document.createElement('iframe');
  ifr.src = cam.stream_html;
  ifr.setAttribute('allow', 'autoplay; fullscreen');
  ifr.allowFullscreen = true;
  ifr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;';

  if (off) off.style.display = 'none';
  if (dot) dot.classList.add('on');
  if (video) video.replaceWith(ifr);
}
