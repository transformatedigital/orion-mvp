# Agregar esto al main.py para servir las páginas

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Páginas disponibles
PAGES = {
    "solicitudes": "Solicitudes",
    "aprobaciones": "Aprobaciones", 
    "flota": "Flota Viva",
    "bitacora": "Bitácora Diaria",
    "evidencias": "Evidencias",
    "liquidaciones": "Liquidaciones",
    "reportes": "Reportes",
    "dashboard": "Dashboard"
}

@app.get("/page/{page_name}")
def get_page(page_name: str):
    """Servir página específica"""
    if page_name == "solicitudes":
        return FileResponse("solicitudes.html", media_type="text/html")
    elif page_name == "dashboard":
        return FileResponse("dashboard.html", media_type="text/html")
    else:
        # Para otras páginas, mostrar mensaje "próximamente"
        return FileResponse("coming-soon.html", media_type="text/html")
