# Programación del blog Silhouette

Los artículos aprobados se guardan en `scheduled/` como archivos JSON. Cada artículo indica `publishAtMexico` en la zona `America/Mexico_City` y su instante UTC equivalente. El flujo de GitHub Actions revisa las fechas cada cinco minutos. Cuando vence una fecha, genera una página HTML, la agrega al blog y actualiza `sitemap.xml`.

Para cargar varios artículos, prepara un JSON con un arreglo de objetos que tengan `slug`, `title`, `excerpt`, `content` (HTML), `image` (HTTPS), `publishAtMexico` (`AAAA-MM-DDTHH:mm:ss`), `seoTitle` y `seoDescription`. Después ejecuta:

```sh
node scripts/import-silhouette-blog-batch.mjs ruta/al/lote.json
node scripts/publish-silhouette-blog.mjs --dry-run
```

El importador convierte la hora de Ciudad de México a UTC y rechaza fechas ambiguas o imposibles. La cola se confirma en el repositorio con una revisión normal. No se cargan borradores privados a GitHub: el repositorio es público. Para editar un artículo ya cargado, corrige su JSON antes de la hora programada.

La hora de publicación es el objetivo. GitHub Actions puede retrasar una ejecución programada; por eso el flujo se repite cada cinco minutos y ofrece ejecución manual como recuperación. La página estática y el sitemap aparecen cuando el flujo de publicación termina correctamente.
