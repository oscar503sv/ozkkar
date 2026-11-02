---
title: 'Grabar la pantalla en Wayland: lo que aprendí construyendo Reelix'
description: 'Por qué en Wayland no puedes capturar la pantalla "como en X11" y cómo funciona el camino moderno con xdg-desktop-portal, PipeWire y GStreamer en Rust.'
pubDate: 2026-11-01
cover: ../../../assets/blog/wayland-screen-recording.webp
coverAlt: 'Diagrama del flujo de captura en Wayland: Reelix, xdg-desktop-portal, PipeWire y GStreamer'
tags: [linux, wayland, rust, gstreamer, gtk]
---

Cuando empecé [Reelix](https://github.com/oscar503sv/reelix), un grabador de pantalla nativo para GNOME, pensé que lo difícil sería la interfaz. Me equivoqué: lo difícil fue entender cómo se captura la pantalla en Wayland. Aquí resumo lo que aprendí.

## En Wayland no puedes leer la pantalla

En X11 cualquier aplicación podía leer el contenido de toda la pantalla. Cómodo, pero también un problema de seguridad: cualquier programa podía espiar lo que hacías.

Wayland cierra esa puerta. Una aplicación solo ve sus propias ventanas. Si quieres grabar la pantalla tienes que **pedir permiso**, y quien decide es el usuario, no tu app.

## El camino moderno: portal → PipeWire → GStreamer

El flujo tiene tres piezas:

1. **xdg-desktop-portal** (interfaz `ScreenCast`): muestra el selector de GNOME para que el usuario elija un monitor o una ventana.
2. **PipeWire**: cuando el usuario acepta, el portal te entrega un _file descriptor_ de PipeWire y un `node_id` con el stream de video.
3. **GStreamer**: el elemento `pipewiresrc` lee ese stream y desde ahí lo codificas como quieras.

Lo bueno es que nunca hablas directamente con el compositor. Por eso funciona igual dentro de Flatpak.

## Pedir la pantalla con ashpd

En Rust uso [ashpd](https://crates.io/crates/ashpd), que envuelve los portales de D-Bus. Simplificado, se ve así:

```rust
let proxy = Screencast::new().await?;
let session = proxy.create_session(Default::default()).await?;

proxy
    .select_sources(
        &session,
        SelectSourcesOptions::default()
            .set_cursor_mode(CursorMode::Embedded)
            .set_sources(SourceType::Monitor | SourceType::Window)
            .set_multiple(false)
            .set_persist_mode(PersistMode::DoNot),
    )
    .await?
    .response()?;

let streams = proxy.start(&session, None, Default::default()).await?.response()?;
let node_id = streams.streams()[0].pipe_wire_node_id();
let fd = proxy.open_pipe_wire_remote(&session, Default::default()).await?;
```

Un detalle importante: hay que mantener viva la sesión mientras grabas. Si el usuario pulsa "Detener" en el indicador de GNOME, el portal cierra la sesión y tu app tiene que reaccionar y terminar el archivo correctamente.

## El pipeline de grabación

Con el `fd` y el `node_id` armo el pipeline de GStreamer:

```text
pipewiresrc → videoconvert → videoscale → videorate → queue
  → codificador H.264 → h264parse → mp4mux → filesink
```

```rust
let source = gst::ElementFactory::make("pipewiresrc").build()?;
source.set_property("fd", fd.as_raw_fd());
source.set_property("path", node_id.to_string());
source.set_property("do-timestamp", true);
source.set_property("keepalive-time", 1000i32);
```

## Lo que no está en los tutoriales

**GNOME solo envía frames cuando algo cambia.** Si la pantalla está quieta, no llegan frames, solo un _keepalive_ cada segundo. Por eso el video sale con frame rate variable y uso `videorate` solo para descartar frames (nunca para duplicarlos). Así el CPU casi no trabaja con la pantalla quieta.

**Una cola que no crezca sin límite.** Si el codificador se atrasa, prefiero perder un frame a que la RAM se dispare. Por eso la `queue` es _leaky_ y tiene un tamaño máximo.

**MP4 fragmentado mientras grabas.** Un MP4 normal escribe su índice al final; si la app se cierra de golpe, pierdes todo. Grabo en fragmentos de un segundo y, al terminar, hago un _remux_ (sin recodificar) a un MP4 normal con _faststart_, que es el más compatible con navegadores y editores.

**Pausar sin pausar.** Mi primera versión pasaba el pipeline a `PAUSED` y luego a `PLAYING`. En el runtime de Flatpak de GNOME 50, `pipewiresrc` no se recuperaba. La solución fue dejar las fuentes corriendo y poner una "compuerta" (un _pad probe_) antes del codificador: descarta los buffers mientras está pausado y luego resta el tiempo pausado a los timestamps. El video queda sin huecos y el audio no se desfasa.

**El codificador depende de la distro.** Intento primero VA-API por hardware (`vah264lpenc`, `vah264enc`), luego `x264enc` y al final `openh264enc`, que es el que viene en Fedora sin repos extra.

## Conclusión

Wayland es más estricto, pero el modelo del portal es mejor: el usuario decide qué compartir y tu app funciona igual en cualquier escritorio que implemente el portal. Si quieres ver el código completo, [Reelix es open source](https://github.com/oscar503sv/reelix).
