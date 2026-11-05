# Margin para Obsidian

El tema de la web (Margin) llevado a Obsidian: papel Flexoki, libreta punteada, regla, mono para el texto, Instrument Serif para los títulos y boli azul para las notas a mano.

## Instalar

```bash
node obsidian-theme/build.mjs --install "<carpeta de la bóveda>"
```

Luego, en Obsidian: Ajustes → Apariencia → Temas → **Margin**. Funciona en claro y en oscuro.

## Lo que trae

- **Cuadrícula**: puntos cada fila y regla junto al texto. Una fila = tamaño de letra × 1,8, así que cuadra con cualquier tamaño.
- **Títulos**: `#` a `####` en serif, `#####` es una etiqueta de sección (mayúsculas naranjas) y `######` va a boli.
- `~~tachado~~` en azul, como las correcciones de la web, y `==subrayado==` de rotulador.
- **Notas al margen**: `> [!margen] esto lo escribí a mano`. Al editar va en línea; en lectura se sale al margen si la ventana es ancha.
- **Tareas**: la marca y el tachado, a boli.
- **Explorador y pestañas numerados** (`01 Nota`), el actual en naranja.

Con el plugin Style Settings se pueden quitar los puntos, la regla, el grano o los números.
