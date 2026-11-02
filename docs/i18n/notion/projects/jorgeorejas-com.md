# [jorgeorejas.com](http://jorgeorejas.com/)

- **Nota al margen:** la estás leyendo →
  - _en:_ you're reading it →
- **Descripción:** Mi web personal: un blog, proyectos, mi trayectoria, un recetario y una lista de deseos. Lo escribo todo en Notion y tiene pinta de cuaderno, con notas al margen.
  - _en:_ My personal site: a blog, projects, a work timeline, a cookbook and a wishlist, written in Notion and laid out like a notebook with notes in the margin.

---


### Qué es


El sitio donde acaba todo lo que hago: lo que escribo, lo que construyo, dónde trabajé, lo que cocino y lo que me gustaría que me regalaran. Empezó siendo una sola columna de texto y lo sigue siendo, con un margen al lado para lo que apuntaría a boli en un papel.


### Cómo está hecha

- **Astro 7** en modo servidor, desplegado en Vercel.
- **Notion es el CMS.** Los posts, los proyectos, las recetas, la trayectoria, la lista de deseos y hasta los títulos de las páginas viven en Notion. Las live collections de Astro lo leen en cada petición, la CDN guarda cada página una hora y un webhook de Notion limpia la caché en cuanto edito algo.
- El contenido de cada página pasa de bloques de Notion a Markdown y por el mismo pipeline de antes, así que las correcciones a mano siguen funcionando.
- Detalles personales: lo que estoy escuchando en Spotify, una firma animada e imágenes Open Graph que se dibujan al vuelo.

### El rediseño Margin

- La página se lee como un cuaderno: un índice numerado, notas a boli azul en el margen izquierdo, una regla fina, el texto en fuente mono, títulos con serifa y colores Flexoki.
- Las notas al margen y los ◆ destacados también los escribo en Notion, así que para cambiarlos no hace falta ningún deploy.
- El recetario y la lista de deseos son cuadrículas de fotos, y las recetas se ajustan al número de raciones.

### Lo que viene

- Anotaciones dibujadas encima del texto, como un trazo de fosforito y un corchete que apunta a la nota.
- Tablas trazadas a estilógrafo, como en un plano de arquitecto, en vez de con bordes rectos de CSS.
