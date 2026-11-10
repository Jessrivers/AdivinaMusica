# En tu playlist · Adivina la canción

Una aplicación pequeña para conocerse en una videollamada, usando canciones favoritas de YouTube o Spotify.

## Abrir

Abre `index.html` con Chrome, Edge o Firefox. No necesita instalación ni compilación. Los archivos deben permanecer juntos. Las fuentes usan Google Fonts; sin conexión se utiliza una fuente del sistema.

## Jugar

1. El anfitrión pide por chat el nombre, título, artista y enlace de dos canciones favoritas a cada persona.
2. Agrega los datos en **La playlist**. También puedes probar las tres canciones de ejemplo.
3. Se necesitan al menos dos personas con una canción cada una.
4. Inicia la partida y comparte **solo la ventana del juego** en tu llamada.
5. Pulsa **Abrir canción · anfitrión**. Se abrirá YouTube o Spotify en otra pestaña. Usa las opciones de audio de tu programa de llamadas para que todos escuchen sin ver el título. La app no captura ni transmite audio.
6. Reproduce un fragmento y, si quieres, inicia los 15 segundos. El temporizador no controla ni detiene el reproductor: pausa la música manualmente.
7. Los participantes responden por voz. Revela la canción y quién la eligió.
8. Elige quién acertó primero: canción = 2 puntos; persona = 1 punto. Quien aportó la canción no puntúa en esa ronda. Puedes dejar ambas opciones en “Nadie”.
9. Guarda los puntos para avanzar. Al terminar aparece el marcador; los empates comparten lugar.

## Alcance

- Esta versión es local y la controla el anfitrión. No hay cuentas, salas remotas ni sincronización entre dispositivos.
- El navegador conserva canciones, ronda y puntuación mediante localStorage. En modo privado o con almacenamiento bloqueado puede no conservarlas. No es una base de datos ni un control de acceso.
- Ocultar las respuestas es parte del juego, no una protección de secretos. Los datos se encuentran en el navegador del anfitrión.
- Exportar genera un JSON con canciones e historias (sin puntuación). Importar combina las canciones y omite títulos/artistas duplicados. Cambiar la playlist reinicia la partida, previa confirmación.
- Los participantes pueden recibir una copia de esta carpeta, preparar sus canciones y enviar el JSON exportado al anfitrión.
- Los enlaces admitidos son videos de YouTube y canciones de open.spotify.com. Para Spotify, usa el enlace completo de la canción si recibes uno acortado.
- La reproducción ocurre en YouTube o Spotify y depende de disponibilidad, cuenta y región. No se descargan canciones ni se usan APIs de reproducción.
- Para alojarla como web estática, publica los archivos `index.html`, `styles.css`, `core.js` y `app.js` juntos. Publicarla no añade sincronización.

## Archivos

- `index.html`: interfaz en español.
- `styles.css`: diseño adaptable a computadora y celular.
- `core.js`: validación de enlaces, sorteo, puntuación y recuperación.
- `app.js`: formularios, almacenamiento, temporizador y pantallas.
- `core.test.cjs`: pruebas de las reglas del juego.

## Validar

Con Node.js instalado:

```text
node --check core.js
node --check app.js
node --test core.test.cjs
```

## Desplegar en Vercel

1. En Vercel, elige **Add New > Project** e importa `Jessrivers/AdivinaMusica`.
2. Usa la rama `main` y la raíz del repositorio (`./`).
3. El preset es **Other**, sin comando de compilación ni instalación, y con salida `.`. El archivo `vercel.json` ya incluye estos valores.
4. No necesitas variables de entorno. Pulsa **Deploy**.

La web se publica como archivos estáticos. Cada navegador conserva su propia playlist; el anfitrión sigue controlando la partida durante la videollamada.

Documentación: https://vercel.com/docs/builds/configure-a-build