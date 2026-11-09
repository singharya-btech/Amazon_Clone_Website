"""
Database utilities for the PostgreSQL backend.

This module replaces the previous MongoDB connection helper. The project now
uses a single PostgreSQL database (configured in settings.py via the
``DATABASES`` setting) for both Django auth and all application data.
"""
from django.db import connection
from django.db.utils import OperationalError


def check_db_connection():
    """
    Verify that the application can reach the configured PostgreSQL database.

    Returns ``True`` if the connection is healthy, ``False`` otherwise.
    """
    try:
        connection.ensure_connection()
        return True
    except OperationalError:
        return False


def get_db():
    """
    Return the active Django database connection.

    This mirrors the old ``get_db()`` API so that any code that previously
    called ``config.db.get_db()`` continues to work, now backed by PostgreSQL
    instead of MongoDB.
    """
    return connection


def get_collection(collection_name):
    """
    Return a cursor for the given "collection" (table) name.

    The old MongoDB API used ``get_collection(name)`` to fetch a Mongo
    collection. With PostgreSQL we map that concept to a raw SQL cursor so
    that callers can still run queries by table name.
    """
    cursor = connection.cursor()
    return cursor
