from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

security = HTTPBearer()

# In production, this would be your Firebase Project ID or a custom secret
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Simultate real JWT / Firebase Token verification.
    In production, use firebase-admin or decode the JWT from your auth provider.
    """
    token = auth.credentials
    try:
        # If using regular JWT:
        # payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # return payload.get("sub")
        
        # For now, we'll accept the token as the user_id for development
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return token
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
