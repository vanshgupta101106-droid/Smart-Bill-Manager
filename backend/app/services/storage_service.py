import os
import shutil
from uuid import uuid4

UPLOAD_DIR = "uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class StorageService:
    @staticmethod
    async def upload_file(file):
        file_extension = os.path.splitext(file.filename)[1]
        file_id = str(uuid4())
        filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # In real use, this would return a cloud URL
        return filename, f"/uploads/{filename}"

    @staticmethod
    async def delete_file(filename):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
