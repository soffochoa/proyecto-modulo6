var db = db.getSiblingDB("proyecto_peliculas");
var destino = db.peliculas;

var contenido = cat("datos/peliculas.json");
var documentos = JSON.parse(contenido);

print("Documentos leídos del JSON: " + documentos.length);

destino.drop();

var transformados = documentos.map(function (doc) {
  doc.fechaEstreno = new Date(doc.fechaEstrenoTexto + "T00:00:00Z");
  delete doc.fechaEstrenoTexto;
  return doc;
});

destino.insertMany(transformados);

print("Documentos insertados: " + destino.countDocuments({}));
print("Verificación de tipo Date: " + destino.countDocuments({ fechaEstreno: { $type: "date" } }));
print("Ejemplo:");
printjson(destino.findOne());
