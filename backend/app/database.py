import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "smart_bill_manager")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        # Verify connection by pinging
        await db.client.admin.command('ping')
        db.db = db.client[DB_NAME]
        print(f"Successfully connected to MongoDB at {MONGODB_URL}")
    except Exception as e:
        print(f"CRITICAL: Could not connect to MongoDB. Error: {e}")
        print("Note: Please ensure MongoDB is running or update MONGODB_URL in .env")
        # In a real app, you might want to exit here, 
        # but for development we'll allow startup with a warning.
        db.db = None

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    return db.db
