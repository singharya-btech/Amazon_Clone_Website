from pymongo import MongoClient
from django.conf import settings

# MongoDB connection
client = MongoClient(
    settings.MONGODB_SETTINGS.get('host', 'mongodb://localhost:27017/amazon_clone'),
)

db = client[settings.MONGODB_SETTINGS.get('db', 'amazon_clone')]

# Collections
products_collection = db['products']
users_collection = db['users']
cart_collection = db['carts']
wishlist_collection = db['wishlists']
orders_collection = db['orders']
categories_collection = db['categories']
reviews_collection = db['reviews']


def get_db():
    """Get the MongoDB database instance."""
    return db


def get_collection(collection_name):
    """Get a specific collection by name."""
    return db[collection_name]
