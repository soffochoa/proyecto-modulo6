var db = db.getSiblingDB("proyecto_peliculas");

// --- Aplicar el validador ---

var resultado = db.runCommand({
  collMod: "peliculas",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titulo", "fechaEstreno", "meta", "duracionMinutos", "calificacion"],
      properties: {
        titulo: {
          bsonType: "string",
          minLength: 1,
          description: "debe ser texto no vacío"
        },
        fechaEstreno: {
          bsonType: "date",
          description: "debe ser una fecha BSON Date"
        },
        meta: {
          bsonType: "object",
          required: ["generos"],
          properties: {
            generos: {
              bsonType: "array",
              minItems: 1,
              items: { bsonType: "string" },
              description: "debe tener al menos un género"
            },
            pais: { bsonType: ["string", "null"] },
            director: { bsonType: ["string", "null"] }
          }
        },
        duracionMinutos: {
          bsonType: ["int", "double"],
          minimum: 1,
          description: "debe ser un número positivo"
        },
        calificacion: {
          bsonType: ["int", "double"],
          minimum: 0,
          maximum: 10,
          description: "debe estar entre 0 y 10"
        },
        numeroVotos: {
          bsonType: ["int", "double"],
          minimum: 0,
          description: "debe ser un número no negativo"
        }
      }
    }
  },
  validationLevel: "moderate"
});

print("Validador aplicado: " + JSON.stringify(resultado));

// --- Caso 1: debe fallar (calificación fuera de rango) ---

var falloCalificacion = false;
try {
  db.peliculas.insertOne({
    _id: "prueba-invalida-calificacion",
    titulo: "Prueba inválida",
    fechaEstreno: new Date("2020-01-01"),
    meta: { generos: ["Drama"] },
    duracionMinutos: 100,
    calificacion: 15
  });
} catch (error) {
  falloCalificacion = true;
  print("Caso 1 (calificación fuera de rango) rechazado correctamente.");
}

// --- Caso 2: debe fallar (duración negativa) ---

var falloDuracion = false;
try {
  db.peliculas.insertOne({
    _id: "prueba-invalida-duracion",
    titulo: "Prueba inválida 2",
    fechaEstreno: new Date("2020-01-01"),
    meta: { generos: ["Drama"] },
    duracionMinutos: -10,
    calificacion: 7
  });
} catch (error) {
  falloDuracion = true;
  print("Caso 2 (duración negativa) rechazado correctamente.");
}

// --- Caso 3: debe pasar ---

db.peliculas.insertOne({
  _id: "prueba-valida-01",
  titulo: "Prueba válida",
  fechaEstreno: new Date("2020-01-01"),
  meta: { generos: ["Drama"], pais: "MX", director: "Prueba" },
  duracionMinutos: 100,
  calificacion: 7.5,
  numeroVotos: 500
});
print("Caso 3 (documento válido) insertado correctamente.");

// --- Limpieza ---

db.peliculas.deleteMany({
  _id: { $in: ["prueba-invalida-calificacion", "prueba-invalida-duracion", "prueba-valida-01"] }
});
print("Casos de prueba eliminados.");

if (!falloCalificacion || !falloDuracion) {
  throw new Error("El validador no rechazó alguno de los casos inválidos esperados.");
}

print("=== Validador comprobado correctamente ===");
