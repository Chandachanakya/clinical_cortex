from __future__ import annotations

from typing import Optional

from supabase import Client, create_client

from app.config import settings


_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Lazy-init Supabase client for Auth/PostgREST/Storage calls.
    Requires:
      - SUPABASE_URL
      - SUPABASE_ANON_KEY (publishable/anon key)
    """
    global _client
    if _client is not None:
        return _client

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env"
        )

    _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    return _client

