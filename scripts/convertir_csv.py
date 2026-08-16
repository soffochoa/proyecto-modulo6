import csv
import json

ENTRADA = "datos/IMDB Movies 2000 - 2020.csv"
SALIDA = "datos/peliculas.json"

def convertir_fecha(texto):
    # Formato esperado: DD/MM/YYYY
    if not texto:
        return None
    partes = texto.split("/")
    if len(partes) != 3:
        return None
    try:
        dia, mes, anio = int(partes[0]), int(partes[1]), int(partes[2])
        return f"{anio:04d}-{mes:02d}-{dia:02d}"
    except ValueError:
        return None

documentos = []
descartados = 0

with open(ENTRADA, newline="", encoding="utf-8") as archivo:
    lector = csv.DictReader(archivo)
    for fila in lector:
        fecha = convertir_fecha(fila.get("date_published"))
        if fecha is None:
            descartados += 1
            continue

        generos = [g.strip() for g in fila.get("genre", "").split(",") if g.strip()]

        documentos.append({
            "_id": fila.get("imdb_title_id"),
            "titulo": fila.get("title"),
            "fechaEstrenoTexto": fecha,
            "meta": {
                "generos": generos,
                "pais": fila.get("country"),
                "director": fila.get("director")
            },
            "duracionMinutos": int(fila["duration"]) if fila.get("duration") else None,
            "calificacion": float(fila["avg_vote"]) if fila.get("avg_vote") else None,
            "numeroVotos": int(fila["votes"]) if fila.get("votes") else None
        })

with open(SALIDA, "w", encoding="utf-8") as archivo:
    json.dump(documentos, archivo, ensure_ascii=False)

print(f"Documentos convertidos: {len(documentos)}")
print(f"Descartados por fecha inválida: {descartados}")
