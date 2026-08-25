# Análisis temporal de la industria cinematográfica (2000-2020)

Proyecto final - Conceptos avanzados de bases de datos NoSQL
Aldo Ramírez Alanís, Ana Sofía Ochoa Campos, José Manuel Cano Saucedo

## Qué hay en este repositorio

```
datos/                  CSV original de Kaggle y el JSON ya transformado
  REPORTE.md           el reporte inicial
scripts/
  convertir_csv.py      convierte el CSV a JSON (fechas y géneros listos para Mongo)
  iniciar_mongo.sh       levanta el servidor de MongoDB local del proyecto
  cargar_peliculas.js    inserta el JSON en la colección `peliculas`
  indice_genero_fecha.js crea el índice genero_fecha y mide antes/después con explain()
  validador_peliculas.js aplica el validador $jsonSchema y corre 3 casos de prueba
  pipeline_indicadores.js corre los 4 pipelines que responden las preguntas del proyecto
reporte_proyecto_nosql.pdf   reporte final
README.md
```

## Requisitos

- Python 3 instalado.
- Los binarios de MongoDB en `tools/bin/` (mongod, mongosh). No se incluyen en el
  repositorio por su tamaño; deben copiarse antes de correr los scripts.
- Ejecutar todo desde la raíz del repositorio.

## Orden de ejecución

Desde la terminal, en la raíz del proyecto:

### 1. Levantar el servidor de MongoDB del proyecto

```bash
bash scripts/iniciar_mongo.sh
```

Levanta un `mongod` local en el puerto **27018** (independiente del entorno del curso),
con sus datos en `data/db/`.

### 2. Convertir el CSV original a JSON

```bash
python3 scripts/convertir_csv.py
```

Lee `datos/IMDB Movies 2000 - 2020.csv`, convierte las fechas de `DD/MM/AAAA` a
`AAAA-MM-DD`, separa los géneros en un arreglo, y descarta filas con fecha inválida.
Genera `datos/peliculas.json`. Debe imprimir `Documentos convertidos: 5487` y
`Descartados por fecha inválida: 0`.

### 3. Cargar los datos a MongoDB

```bash
tools/bin/mongosh \
  "mongodb://127.0.0.1:27018/proyecto_peliculas?directConnection=true" \
  --quiet \
  scripts/cargar_peliculas.js
```

Inserta los 5,487 documentos en la colección `peliculas`, con `fechaEstreno` ya como
BSON `Date`. Muestra un documento de ejemplo al final.

### 4. Crear el índice y medir su efecto

```bash
tools/bin/mongosh \
  "mongodb://127.0.0.1:27018/proyecto_peliculas?directConnection=true" \
  --quiet \
  scripts/indice_genero_fecha.js
```

Crea el índice compuesto `{"meta.generos": 1, fechaEstreno: 1}` y compara
`explain("executionStats")` antes y después sobre la misma consulta (género Drama,
2010-2014). Termina con `=== Índice verificado correctamente ===`.

### 5. Aplicar y probar el validador

```bash
tools/bin/mongosh \
  "mongodb://127.0.0.1:27018/proyecto_peliculas?directConnection=true" \
  --quiet \
  scripts/validador_peliculas.js
```

Aplica el validador `$jsonSchema` y corre tres casos de prueba (dos que deben
rechazarse, uno que debe insertarse). Termina con
`=== Validador comprobado correctamente ===`.

### 6. Correr los pipelines de las 4 preguntas

```bash
tools/bin/mongosh \
  "mongodb://127.0.0.1:27018/proyecto_peliculas?directConnection=true" \
  --quiet \
  scripts/pipeline_indicadores.js
```

Corre, en orden, los pipelines de las cuatro preguntas del proyecto (calificación por
género y década, cambio de popularidad 2000 vs. 2019, duración promedio por año,
patrón de estrenos por mes). Termina con
`=== Todas las consultas se ejecutaron correctamente ===`.

## Evidencia adicional (seguridad y búsqueda)

Estos comandos no están en un script aparte; se corrieron directamente en la consola
como evidencia para el reporte, después del paso 6:

```javascript
// Búsqueda de texto (evaluada, no usada como parte central del proyecto)
db.peliculas.createIndex({ titulo: "text" }, { name: "titulo_texto" })
db.peliculas.find({ $text: { $search: "love" } }, { titulo: 1, calificacion: 1 }).limit(5)

// Consulta con proyección limitada, simulando el rol de "consulta"
db.peliculas.find(
  {},
  { titulo: 1, "meta.generos": 1, fechaEstreno: 1, calificacion: 1, _id: 0 }
).limit(5)
```