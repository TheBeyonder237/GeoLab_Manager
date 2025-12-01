"""
Métriques Prometheus pour monitoring
"""
from prometheus_client import Counter, Histogram, Gauge
from typing import Optional
import time

# Compteurs
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

# Gauges
active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)

database_connections = Gauge(
    'database_connections',
    'Number of database connections'
)

essais_total = Gauge(
    'essais_total',
    'Total number of essais',
    ['type', 'statut']
)

users_total = Gauge(
    'users_total',
    'Total number of users',
    ['role']
)


def record_request(method: str, endpoint: str, status_code: int, duration: float):
    """Enregistre une requête HTTP"""
    http_requests_total.labels(method=method, endpoint=endpoint, status=status_code).inc()
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)


def increment_active_connections():
    """Incrémente le nombre de connexions actives"""
    active_connections.inc()


def decrement_active_connections():
    """Décrémente le nombre de connexions actives"""
    active_connections.dec()


def update_essais_metrics(essais_data: dict):
    """Met à jour les métriques des essais"""
    for type_essai, statuts in essais_data.items():
        for statut, count in statuts.items():
            essais_total.labels(type=type_essai, statut=statut).set(count)


def update_users_metrics(users_data: dict):
    """Met à jour les métriques des utilisateurs"""
    for role, count in users_data.items():
        users_total.labels(role=role).set(count)

