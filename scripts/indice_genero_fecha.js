//  índice "genero_fecha" 
//  reproduce la comparación antes/después con explain("executionStats")

var db = db.getSiblingDB("proyecto_peliculas"); 
var peliculas = db.peliculas; 

var total = peliculas.countDocuments({}); 
if (total !== 5487) { 
  throw new Error("Carga primero los datos del proyecto (esperados 5487, encontrados " + total + ")."); 
} 

//  helper para leer el árbol del plan de ejecución
function reunirEtapas(nodo, etapas) { // mod:
  if (nodo === null || typeof nodo !== "object") { 
    return; 
  } 
  if (nodo.stage) { 
    etapas.push(nodo.indexName ? nodo.stage + "(" + nodo.indexName + ")" : nodo.stage); 
  } 
  Object.keys(nodo).forEach(function (clave) { 
    reunirEtapas(nodo[clave], etapas); 
  }); 
} 

function resumirExplicacion(explicacion) { 
  var etapas = []; 
  reunirEtapas(explicacion.queryPlanner.winningPlan, etapas); 
  return { 
    etapas: etapas.filter(function (etapa, posicion) { 
      return etapas.indexOf(etapa) === posicion; 
    }), 
    nReturned: explicacion.executionStats.nReturned, 
    totalKeysExamined: explicacion.executionStats.totalKeysExamined, 
    totalDocsExamined: explicacion.executionStats.totalDocsExamined, 
    executionTimeMillis: explicacion.executionStats.executionTimeMillis 
  }; 
} 

//la mayoría de nuestras consultas filtran primero por género (igualdad) y después por fecha (rango u orden)
var consultaGeneroFecha = { 
  "meta.generos": "Drama", 
  fechaEstreno: { 
    $gte: new Date("2010-01-01T00:00:00Z"), 
    $lt: new Date("2015-01-01T00:00:00Z") 
  } 
}; 

// se eliminan índices secundarios para medir un punto de partida limpio
peliculas.dropIndexes(); 

print("\n=== Consulta evaluada (género Drama, 2010-2014) ==="); 
printjson(consultaGeneroFecha); 

print("\n=== Antes de crear el índice ==="); 
var antes = peliculas.find(consultaGeneroFecha).explain("executionStats"); 
printjson(resumirExplicacion(antes)); 

print("\n=== Creación del índice ==="); 
var nombreIndice = peliculas.createIndex( 
  { "meta.generos": 1, fechaEstreno: 1 }, 
  { name: "genero_fecha" } 
); // mod:
print("Índice creado: " + nombreIndice); 
printjson(peliculas.getIndexes()); 

print("\n=== Después de crear el índice ==="); 
var despues = peliculas.find(consultaGeneroFecha).explain("executionStats"); 
printjson(resumirExplicacion(despues)); 

// el resultado lógico no debe cambiar; solo debe cambiar el trabajo registrado por el motor 
if (antes.executionStats.nReturned !== despues.executionStats.nReturned) { 
  throw new Error( 
    "El índice cambió la cantidad de resultados (antes " + 
    antes.executionStats.nReturned + ", después " + despues.executionStats.nReturned + 
    "): esto no debería pasar." 
  ); 
} 

// mod: segunda comprobación — reutilización de prefijo, una consulta que solo filtra por género debe poder usar el mismo índice compuesto aprovechando su prefijo "meta.generos"
print("\n=== Uso del prefijo (solo género, sin fecha) ==="); //
var planPrefijo = peliculas.find({ "meta.generos": "Comedy" }).explain("executionStats"); // 
printjson(resumirExplicacion(planPrefijo)); 

print("\n=== Resumen comparativo ==="); 
printjson({ 
  antes: { 
    etapas: resumirExplicacion(antes).etapas, 
    totalKeysExamined: antes.executionStats.totalKeysExamined,
    totalDocsExamined: antes.executionStats.totalDocsExamined 
  }, // mod:
  despues: { // mod:
    etapas: resumirExplicacion(despues).etapas, 
    totalKeysExamined: despues.executionStats.totalKeysExamined, 
    totalDocsExamined: despues.executionStats.totalDocsExamined 
  }, 
  nReturned: despues.executionStats.nReturned 
}); 

//  comprobacion final de que el plan realmente cambió a IXSCAN con el indice esperado y de que se examinaron menos documentos que antes
var etapasDespues = resumirExplicacion(despues).etapas; 
var usaIndiceEsperado = etapasDespues.some(function (etapa) { 
  return etapa.indexOf("IXSCAN(genero_fecha)") !== -1; 
}); 
if (!usaIndiceEsperado) { 
  throw new Error("El plan posterior no usó el índice genero_fecha: revisa el patrón de claves."); 
} 
if (despues.executionStats.totalDocsExamined >= antes.executionStats.totalDocsExamined) { 
  throw new Error("El índice no redujo los documentos examinados respecto al COLLSCAN inicial."); 
} 

print("\n=== Índice verificado correctamente ==="); // m
