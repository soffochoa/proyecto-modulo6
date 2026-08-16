var db = db.getSiblingDB("proyecto_peliculas");
var peliculas = db.peliculas;

var total = peliculas.countDocuments({});
if (total !== 5487) {
  throw new Error("Carga primero los datos del proyecto (esperados 5487, encontrados " + total + ").");
}

// --- Pregunta 1: calificación promedio por género y década (2000-2019) ---

var pipelineGeneroDecada = [
  {
    $match: {
      fechaEstreno: {
        $gte: new Date("2000-01-01T00:00:00Z"),
        $lt: new Date("2020-01-01T00:00:00Z")
      }
    }
  },
  { $unwind: "$meta.generos" },
  {
    $addFields: {
      decada: {
        $concat: [
          { $substr: [{ $subtract: [{ $year: "$fechaEstreno" }, { $mod: [{ $year: "$fechaEstreno" }, 10] }] }, 0, 4] },
          "s"
        ]
      }
    }
  },
  {
    $group: {
      _id: { genero: "$meta.generos", decada: "$decada" },
      calificacionPromedio: { $avg: "$calificacion" },
      peliculas: { $sum: 1 }
    }
  },
  { $match: { peliculas: { $gte: 10 } } },
  { $sort: { "_id.genero": 1, "_id.decada": 1 } }
];

print("=== Pregunta 1: Calificación promedio por género y década ===");
var resultadoGeneroDecada = peliculas.aggregate(pipelineGeneroDecada).toArray();
printjson(resultadoGeneroDecada);

// --- Pregunta 2: cambio de popularidad por género (2000 vs 2019) ---

var pipelinePopularidad = [
  {
    $match: {
      fechaEstreno: {
        $gte: new Date("2000-01-01T00:00:00Z"),
        $lt: new Date("2020-01-01T00:00:00Z")
      }
    }
  },
  { $unwind: "$meta.generos" },
  {
    $addFields: {
      anio: { $year: "$fechaEstreno" }
    }
  },
  {
    $group: {
      _id: { genero: "$meta.generos", anio: "$anio" },
      peliculas: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: "$_id.genero",
      total2000: {
        $sum: { $cond: [{ $eq: ["$_id.anio", 2000] }, "$peliculas", 0] }
      },
      total2019: {
        $sum: { $cond: [{ $eq: ["$_id.anio", 2019] }, "$peliculas", 0] }
      }
    }
  },
  {
    $project: {
      _id: 0,
      genero: "$_id",
      total2000: 1,
      total2019: 1,
      cambioAbsoluto: { $subtract: ["$total2019", "$total2000"] },
      cambioRelativo: {
        $cond: [
          { $eq: ["$total2000", 0] },
          null,
          {
            $round: [
              { $multiply: [{ $divide: [{ $subtract: ["$total2019", "$total2000"] }, "$total2000"] }, 100] },
              1
            ]
          }
        ]
      }
    }
  },
  { $sort: { cambioAbsoluto: -1 } }
];

print("=== Pregunta 2: Cambio de popularidad por género (2000 vs 2019) ===");
var resultadoPopularidad = peliculas.aggregate(pipelinePopularidad).toArray();
printjson(resultadoPopularidad);

// --- Pregunta 3: duración promedio por año (2000-2019) ---

var pipelineDuracion = [
  {
    $match: {
      fechaEstreno: {
        $gte: new Date("2000-01-01T00:00:00Z"),
        $lt: new Date("2020-01-01T00:00:00Z")
      },
      duracionMinutos: { $ne: null }
    }
  },
  {
    $addFields: {
      anio: { $year: "$fechaEstreno" }
    }
  },
  {
    $group: {
      _id: "$anio",
      duracionPromedio: { $avg: "$duracionMinutos" },
      peliculas: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
];

print("=== Pregunta 3: Duración promedio por año ===");
var resultadoDuracion = peliculas.aggregate(pipelineDuracion).toArray();
printjson(resultadoDuracion);

// --- Pregunta 4: patrón de meses de estreno (2000-2019) ---

var pipelineMeses = [
  {
    $match: {
      fechaEstreno: {
        $gte: new Date("2000-01-01T00:00:00Z"),
        $lt: new Date("2020-01-01T00:00:00Z")
      }
    }
  },
  {
    $addFields: {
      mes: { $month: "$fechaEstreno" }
    }
  },
  {
    $group: {
      _id: "$mes",
      peliculas: { $sum: 1 },
      calificacionPromedio: { $avg: "$calificacion" }
    }
  },
  { $sort: { _id: 1 } }
];

print("=== Pregunta 4: Estrenos y calificación promedio por mes ===");
var resultadoMeses = peliculas.aggregate(pipelineMeses).toArray();
printjson(resultadoMeses);

// --- Validación final ---

if (
  resultadoGeneroDecada.length === 0 ||
  resultadoPopularidad.length === 0 ||
  resultadoDuracion.length !== 20 ||
  resultadoMeses.length !== 12
) {
  throw new Error("Los pipelines no produjeron los resultados esperados.");
}

print("=== Todas las consultas se ejecutaron correctamente ===");
