import os
import redis.asyncio as redis

redis_client: redis.Redis | None = None

def get_redis() -> redis.Redis:
    assert redis_client is not None, "Redis is not initialized"
    return redis_client

async def init_redis():
    global redis_client
    url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis.from_url(url, decode_responses=True)

async def close_redis():
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None