# Proyecto final - Evolución del cine (2000-2019)

## 1. Problema y preguntas

La idea del proyecto es ver cómo ha cambiado el cine en los últimos 20 años, por género,
calificación y duración, para responder preguntas que le puedan servir a alguien que
programa una cartelera o hace curaduría de contenido, como un club de cine o una
plataforma de streaming.

Las preguntas que nos planteamos son:
1. ¿Cómo cambió la calificación promedio por género en las décadas?
2. ¿Qué géneros ganaron o perdieron popularidad con el tiempo?
3. ¿Cambió la duración promedio de las películas por año?
4. ¿Hay un patrón de en qué meses se estrenan más películas?

## 2. Datos y procedencia

Usamos el dataset "IMDb Movies from 2000-2020" de Kaggle (chenyanglim/imdb-v2). Tiene
5,487 películas con título, fecha de estreno, género, duración, país, director,
calificación promedio y número de votos.

Son datos públicos, no manejamos información personal de nadie.

## 3. Modelo documental

Trabajamos con una sola colección, `peliculas`, donde cada documento es una película:

```javascript
{
  _id: "tt0035423",
  titulo: "Kate & Leopold",
  fechaEstreno: ISODate("2002-03-01"),
  meta: {
    generos: ["Comedy", "Fantasy", "Romance"],
    pais: "USA",
    director: "James Mangold"
  },
  duracionMinutos: 118,
  calificacion: 6.4,
  numeroVotos: 77852
}
```

`fechaEstreno` es la marca temporal (BSON Date). Dentro de `meta` dejamos lo que no
cambia de la película (géneros, país, director). Y `duracionMinutos`, `calificacion` y
`numeroVotos` son las mediciones.

El componente especializado que elegimos fue el temporal. No usamos componente
geoespacial porque no había una geometría real en los datos que sirviera para algo -
el país de origen no cuenta como una ubicación para hacer una consulta espacial.

## 4. Índice

```javascript
db.peliculas.createIndex(
  { "meta.generos": 1, fechaEstreno: 1 },
  { name: "genero_fecha" }
)
```

Lo hicimos así porque la mayoría de nuestras consultas filtran primero por género
(igualdad) y después por fecha (rango u orden).

## 5. Validación de datos

Le pusimos un validador `$jsonSchema` a la colección `peliculas`, con `validationLevel:
"moderate"` para no romper los documentos que ya estaban cargados. Las reglas que
pusimos:

- `titulo`: texto, no puede estar vacío.
- `fechaEstreno`: tiene que ser BSON Date.
- `meta.generos`: arreglo con al menos un género.
- `duracionMinutos`: número positivo.
- `calificacion`: número entre 0 y 10.
- `numeroVotos`: número no negativo.

Lo probamos con tres casos (está en `scripts/validador_peliculas.js`):

| Caso | Lo que esperábamos | Lo que pasó |
|---|---|---|
| Calificación = 15 (fuera de rango) | Que lo rechazara | Lo rechazó |
| Duración = -10 (negativa) | Que lo rechazara | Lo rechazó |
| Documento con todo bien | Que lo insertara | Lo insertó |

## 6. Seguridad y protección de datos

Los datos que usamos son públicos de películas (título, fecha de estreno, género,
duración, calificación, director), no manejamos información personal de usuarios ni
nada sensible de personas.

Vienen de Kaggle, del dataset "IMDb Movies from 2000-2020", que es de acceso público.
No cambiamos el contenido ni ocultamos de dónde salió.

El servidor de MongoDB que usamos para el proyecto solo corre en 127.0.0.1 (local), no
está expuesto a internet ni a otras redes, y vive dentro del Learner Lab.

No creamos ni guardamos ningún usuario o contraseña para esto, porque al ser un entorno
local de práctica no hace falta. Si esto se fuera a usar de verdad, en producción, lo
correcto sería meter autenticación (SCRAM), cifrado en tránsito (TLS) y separar los
permisos de lectura y escritura según quién esté accediendo.

En el `.gitignore` dejamos fuera las carpetas `tools/` y `data/`, porque ahí están los
binarios de MongoDB y los archivos internos del servidor. No tiene sentido subir eso al
repo, pesa mucho y cada quien lo puede generar de nuevo corriendo los scripts.

## 7. Resultados e interpretación

(pendiente - aquí van las tablas y conclusiones de las 4 preguntas)

## 8. Alcances, limitaciones y posibles mejoras

(pendiente)
