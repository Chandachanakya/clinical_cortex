import os
import sys
import httpx
from dotenv import load_dotenv


def main() -> int:
    """
    Minimal connectivity check to Supabase (no DB password needed).
    Requires:
      - SUPABASE_URL
      - SUPABASE_ANON_KEY
    """
    load_dotenv(os.path.join("backend", ".env"))

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_anon_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env")
        return 1

    # Auth health endpoint is the simplest “is the project up” probe.
    url = supabase_url.rstrip("/") + "/auth/v1/health"
    headers = {"apikey": supabase_anon_key}

    try:
        r = httpx.get(url, headers=headers, timeout=20.0)
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return 1

    if 200 <= r.status_code < 300:
        print("✅ Supabase reachable (auth health OK).")
        return 0

    print(f"❌ Supabase health check failed: HTTP {r.status_code}")
    try:
        print(r.text[:500])
    except Exception:
        pass
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

