from django.urls import path
from . import views  # <-- Aquí SÍ funciona el punto, porque views.py está en la misma carpeta eld_api

urlpatterns = [
    # Ruta para calcular el ELD (Llama a tu clase CalculateEldView)
    path('calculate-eld/', views.CalculateEldView.as_view(), name='calculate_eld'),
    path('stops/', views.stops_view, name='stops'),
    path('search-location/', views.search_location, name='search_location'),
]