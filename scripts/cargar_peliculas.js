var db = db.getSiblingDB("proyecto_peliculas");
var destino = db.peliculas;

//  cat() 
var contenido;
if (typeof cat === "function") { 
  contenido = cat("datos/peliculas.json");
} else { 
  contenido = require("fs").readFileSync("datos/peliculas.json", "utf8");
} 
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
