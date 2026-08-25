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


### Pregunta 1: ¿Cómo cambió la calificación promedio por género en las décadas?

Solo se comparan géneros con al menos 10 películas en cada década (así lo filtra
el pipeline), para no comparar promedios con muestras muy chicas.

| Género | 2000s | 2010s | Cambio |
|---|---:|---:|---:|
| Sport | 6.46 (n=69) | 6.84 (n=50) | +0.38 |
| Family | 6.03 (n=145) | 6.40 (n=114) | +0.37 |
| Music | 6.55 (n=71) | 6.81 (n=68) | +0.26 |
| Sci-Fi | 6.10 (n=145) | 6.32 (n=242) | +0.22 |
| Adventure | 6.31 (n=390) | 6.51 (n=529) | +0.20 |
| Comedy | 6.21 (n=937) | 6.40 (n=1038) | +0.19 |
| Animation | 6.69 (n=120) | 6.87 (n=167) | +0.18 |
| Romance | 6.46 (n=470) | 6.53 (n=480) | +0.07 |
| Fantasy | 6.18 (n=192) | 6.23 (n=235) | +0.05 |
| Action | 6.37 (n=583) | 6.39 (n=865) | +0.02 |
| Horror | 5.90 (n=247) | 5.87 (n=413) | −0.03 |
| Musical | 6.69 (n=26) | 6.63 (n=16) | −0.06 |
| Crime | 6.58 (n=512) | 6.51 (n=534) | −0.07 |
| War | 6.97 (n=42) | 6.90 (n=45) | −0.07 |
| Drama | 6.85 (n=1293) | 6.75 (n=1785) | −0.10 |
| Mystery | 6.35 (n=247) | 6.24 (n=330) | −0.11 |
| Biography | 7.12 (n=143) | 7.01 (n=269) | −0.11 |
| Thriller | 6.49 (n=368) | 6.29 (n=579) | −0.20 |
| History | 7.17 (n=72) | 6.92 (n=111) | −0.25 |

**Interpretación:** los cambios son chicos en casi todos los géneros, la
mayoría se mueve menos de 0.2 puntos (de 10). Los que más se mueven
(`Sport`, `Family`, `Music`) son justo los géneros con menos películas por
década, así que probablemente es ruido de muestra chica y no un cambio
real. Los géneros grandes (`Drama`, `Comedy`, `Action`, `Crime`) casi no
cambian, lo cual tiene sentido: el tipo de público que califica en IMDb no
cambia mucho de década a década.

**Límite:** esto no dice si las películas "mejoraron" , el promedio
depende de quién decide votar en IMDb, no es una muestra representativa de
todo el público.

### Pregunta 2: ¿Qué géneros ganaron o perdieron popularidad con el tiempo?

Cuenta cuántas películas de cada género se estrenaron en 2000 contra 2019
(un año contra otro, no la década completa).

| Género | 2000 | 2019 | Cambio absoluto | Cambio relativo |
|---|---:|---:|---:|---:|
| Drama | 48 | 161 | +113 | +235.4% |
| Comedy | 42 | 85 | +43 | +102.4% |
| Action | 27 | 68 | +41 | +151.9% |
| Biography | 2 | 37 | +35 | +1750.0% |
| Mystery | 9 | 40 | +31 | +344.4% |
| Adventure | 23 | 52 | +29 | +126.1% |
| Crime | 23 | 52 | +29 | +126.1% |
| Horror | 12 | 39 | +27 | +225.0% |
| Thriller | 19 | 40 | +21 | +110.5% |
| Fantasy | 4 | 19 | +15 | +375.0% |
| Romance | 22 | 32 | +10 | +45.5% |
| Animation | 7 | 17 | +10 | +142.9% |
| Sci-Fi | 9 | 18 | +9 | +100.0% |
| History | 2 | 8 | +6 | +300.0% |
| Family | 5 | 11 | +6 | +120.0% |
| Music | 4 | 7 | +3 | +75.0% |
| Sport | 2 | 3 | +1 | +50.0% |
| Western | 1 | 2 | +1 | +100.0% |
| War | 2 | 2 | 0 | 0.0% |
| Musical | 2 | 0 | −2 | −100.0% |

*(`Adventure`/`Crime`, `Romance`/`Animation`, `History`/`Family` y `Sport`/`Western` empatan en cambio absoluto; el pipeline ordena solo por `cambioAbsoluto`, sin un segundo criterio de desempate, así que el orden entre esos pares puede variar entre corridas.)*

**Interpretación:** `Drama` es el que más creció en número absoluto (+113
películas). Tiene sentido: el catálogo completo casi se cuadriplicó en el
periodo (ver Pregunta 4), así que casi todos los géneros suman más
películas, no solo `Drama`. `Musical` es el único que desapareció entre los
dos años comparados.



### Pregunta 3: ¿Cambió la duración promedio de las películas por año?

| Año | Duración promedio (min) | Películas |
|---|---:|---:|
| 2000 | 108.8 | 99 |
| 2001 | 110.6 | 177 |
| 2002 | 109.1 | 196 |
| 2003 | 109.2 | 229 |
| 2004 | 110.0 | 221 |
| 2005 | 110.2 | 251 |
| 2006 | 109.5 | 270 |
| 2007 | 109.3 | 296 |
| 2008 | 106.1 | 307 |
| 2009 | 108.4 | 285 |
| 2010 | 106.5 | 278 |
| 2011 | 107.5 | 302 |
| 2012 | 108.8 | 297 |
| 2013 | 109.8 | 314 |
| 2014 | 109.2 | 334 |
| 2015 | 109.6 | 328 |
| 2016 | 109.8 | 312 |
| 2017 | 111.3 | 324 |
| 2018 | 112.4 | 298 |
| 2019 | 114.0 | 263 |

**Interpretación:** la duración no sube en línea recta: se mantiene estable
en los 2000s (~109 min), baja un poco en 2008-2010, y luego sube bastante
hasta 2019 (114 min, el máximo). La bajada de 2008-2010 coincide con la
crisis financiera global, es un contexto posible (presupuestos más chicos,
películas más cortas), aunque estos datos por sí solos no lo confirman. En
total, 2019 tiene 5.2 minutos más que 2000, pero casi toda la subida pasó
después de 2011.

**Límite:** con 20 puntos anuales se ve el patrón, pero no alcanza para
probar una causa ni para proyectar qué sigue después de 2019.

### Pregunta 4: ¿Hay un patrón de en qué meses se estrenan más películas?

| Mes | Películas | Calificación promedio |
|---|---:|---:|
| Enero | 399 | 6.61 |
| Febrero | 443 | 6.51 |
| Marzo | 451 | 6.53 |
| Abril | 477 | 6.45 |
| Mayo | 422 | 6.48 |
| Junio | 444 | 6.34 |
| Julio | 369 | 6.23 |
| Agosto | 462 | 6.29 |
| Septiembre | 486 | 6.47 |
| Octubre | 572 | 6.63 |
| Noviembre | 477 | 6.57 |
| Diciembre | 379 | 6.79 |

**Interpretación:** octubre tiene más estrenos que cualquier otro mes (572)
y también calificación alta (6.63) puede ser porque los estudios buscan
posicionarse antes de la temporada de premios. Julio es el mes con menos
estrenos y la calificación más baja. Diciembre es el caso curioso: pocos
estrenos pero la calificación más alta del año, un patrón típico de las
películas que se estrenan a fin de año buscando el Oscar.

**Límite:** esto describe el mes de estreno, no explica por qué los
estudios eligen esas fechas, y una calificación más alta en un mes no
significa que estrenar ahí "cause" mejores películas.


## 8. Alcances, limitaciones y posibles mejoras

**Lo que el proyecto sí permite describir:**
- Cómo se comportan la calificación promedio, la cantidad de estrenos y la duración de
  las películas a lo largo de casi 20 años, agrupando por género, año, década o mes.
- Patrones generales del catálogo de IMDb en ese periodo: por ejemplo, que el número de
  películas creció bastante entre 2000 y 2019, que octubre concentra más estrenos, o que
  la duración promedio subió más después de 2011.

**Lo que no permite afirmar:**
- No demuestra causalidad. Que la duración baje en 2008-2010 o que diciembre tenga
  mejor calificación no prueba que exista una causa directa detrás, solo se ve la
  coincidencia en el tiempo.
- No es una muestra representativa de "todo el cine" ni de la opinión del público en
  general. Son las películas que están en IMDb y las calificaciones de quien decide
  votar ahí, que no es lo mismo que el público completo.
- No sirve para predecir qué va a pasar después de 2019, porque el dataset no llega más
  allá de esa fecha y 20 puntos anuales no alcanzan para proyectar una tendencia futura.
- Los géneros con pocas películas por grupo (como `Sport`, `Music` o `Western`) dan
  resultados poco confiables, un cambio de 2-3 películas puede mover el porcentaje
  muchísimo aunque no signifique nada real.

**Limitaciones del dataset y del modelo:**
- El dataset cubre 2000-2020, pero nosotros usamos 2000-2019 porque 2020 estaba
  incompleto (pocas películas capturadas ese año).
- La Pregunta 2 compara solo dos años puntuales (2000 y 2019), no toda la serie
  completa; un género pudo haber subido y bajado varias veces en medio y eso no se ve
  en esta comparación.
- `avg_vote` es un promedio que ya viene calculado desde IMDb, no tenemos el detalle de
  cuántas personas votaron cada película ni su distribución, solo el número total de
  votos.
- Una película puede tener varios géneros a la vez (usamos `$unwind` para eso), así que
  una misma película se cuenta en más de un grupo, esto es correcto para responder
  "cuánto pesa cada género", pero significa que las cuentas por género no sí se pueden
  sumar entre sí para dar el total de películas.

**Posibles mejoras a futuro:**
- Extender el rango de años, cuando haya un dataset más actualizado, para ver qué pasó
  después de 2020.
- Cruzar esta colección con datos de taquilla o presupuesto (el dataset original trae
  `budget` y `worlwide_gross_income`, que no usamos), para relacionar calificación con
  éxito comercial.
- Comparar contra otra fuente de calificaciones (como Rotten Tomatoes o Letterboxd) para
  ver si el patrón se sostiene fuera de IMDb.


