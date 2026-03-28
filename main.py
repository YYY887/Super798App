from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import httpx
import sqlite3
import time
import os
from contextlib import contextmanager

app = FastAPI(title="drink_798_web_api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://i.ilife798.com/api/v1"
DB_PATH = "drink_records.db"

# ── 数据库初始化 ──────────────────────────────────────────
def init_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS records (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                uid       TEXT NOT NULL,
                did       TEXT NOT NULL,
                dname     TEXT,
                ep        TEXT,
                start_at  INTEGER NOT NULL,
                end_at    INTEGER,
                out_ml    REAL DEFAULT 0,
                score     TEXT
            )
        """)

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

init_db()

# ── 代理工具 ──────────────────────────────────────────────
async def proxy_get(path: str, params: dict | None = None, token: str | None = None):
    headers = {"Authorization": token} if token else {}
    async with httpx.AsyncClient(timeout=15, trust_env=False) as client:
        r = await client.get(f"{BASE_URL}{path}", params=params, headers=headers)
    return r

async def proxy_post(path: str, data: dict | None = None, token: str | None = None):
    headers = {"Authorization": token} if token else {}
    async with httpx.AsyncClient(timeout=15, trust_env=False) as client:
        r = await client.post(f"{BASE_URL}{path}", json=data, headers=headers)
    return r

# ── 基础接口 ──────────────────────────────────────────────
@app.get("/captcha")
async def get_captcha(s: str, r: str):
    resp = await proxy_get("/captcha/", params={"s": s, "r": r})
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    content_type = resp.headers.get("content-type", "image/png")
    return StreamingResponse(iter([resp.content]), media_type=content_type)

@app.post("/login/code")
async def send_sms_code(payload: dict):
    resp = await proxy_post("/acc/login/code", data=payload)
    return resp.json()

@app.post("/login")
async def login(payload: dict):
    resp = await proxy_post("/acc/login", data=payload)
    return resp.json()

@app.get("/devices")
async def get_devices(token: str):
    resp = await proxy_get("/ui/app/master", token=token)
    return resp.json()

@app.get("/device/favo")
async def toggle_favo(did: str, remove: bool, token: str):
    resp = await proxy_get("/dev/favo", params={"did": did, "remove": remove}, token=token)
    return resp.json()

@app.get("/device/status")
async def device_status(did: str, token: str):
    resp = await proxy_get("/ui/app/dev/status", params={"did": did, "more": True, "promo": False}, token=token)
    return resp.json()

# ── 接水控制（带记录） ────────────────────────────────────
@app.get("/device/start")
async def start_device(did: str, token: str, uid: str = "", dname: str = "", ep: str = ""):
    resp = await proxy_get("/dev/start", params={"did": did, "upgrade": True, "rcp": False, "stype": 5}, token=token)
    data = resp.json()
    if data.get("code") == 0:
        with get_db() as db:
            db.execute(
                "INSERT INTO records (uid, did, dname, ep, start_at) VALUES (?,?,?,?,?)",
                (uid, did, dname, ep, int(time.time() * 1000))
            )
    return data

@app.get("/device/end")
async def end_device(did: str, token: str, uid: str = "", out_ml: float = 0, score: str = ""):
    resp = await proxy_get("/dev/end", params={"did": did}, token=token)
    data = resp.json()
    with get_db() as db:
        if uid:
            db.execute("""
                UPDATE records SET end_at=?, out_ml=?, score=?
                WHERE id = (
                    SELECT id FROM records
                    WHERE uid=? AND did=? AND end_at IS NULL
                    ORDER BY start_at DESC
                    LIMIT 1
                )
            """, (int(time.time() * 1000), out_ml, score, uid, did))
        else:
            db.execute("""
                UPDATE records SET end_at=?, out_ml=?, score=?
                WHERE id = (
                    SELECT id FROM records
                    WHERE did=? AND end_at IS NULL
                    ORDER BY start_at DESC
                    LIMIT 1
                )
            """, (int(time.time() * 1000), out_ml, score, did))
    return data

# ── 接水记录接口 ──────────────────────────────────────────
@app.get("/records")
async def get_records(uid: str, page: int = 1, page_size: int = 20):
    offset = (page - 1) * page_size
    with get_db() as db:
        total = db.execute("SELECT COUNT(*) FROM records WHERE uid=?", (uid,)).fetchone()[0]
        rows = db.execute(
            "SELECT * FROM records WHERE uid=? ORDER BY start_at DESC LIMIT ? OFFSET ?",
            (uid, page_size, offset)
        ).fetchall()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [dict(r) for r in rows]
    }

@app.delete("/records/{record_id}")
async def delete_record(record_id: int):
    with get_db() as db:
        db.execute("DELETE FROM records WHERE id=?", (record_id,))
    return {"ok": True}

# ── SPA 兜底（必须放最后）────────────────────────────────
@app.get("/")
def root():
    dist_index = os.path.join(os.path.dirname(__file__), "dist", "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    return {"ok": True}

@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    dist_dir = os.path.join(os.path.dirname(__file__), "dist")
    file_path = os.path.join(dist_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    index = os.path.join(dist_dir, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7981, reload=True)
