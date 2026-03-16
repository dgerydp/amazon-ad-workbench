from __future__ import annotations

import base64
import hashlib
import json
import time
import urllib.parse

import httpx
from Crypto.Cipher import AES

from app.core.config import settings


class LingxingClient:
    def __init__(self, app_id: str | None = None, app_secret: str | None = None, base_url: str | None = None):
        self.app_id = app_id or settings.lingxing_app_id
        self.app_secret = app_secret or settings.lingxing_app_secret
        self.base_url = (base_url or settings.lingxing_base_url).rstrip("/")

    @staticmethod
    def _pkcs5_pad(data: bytes, block_size: int = 16) -> bytes:
        pad_len = block_size - len(data) % block_size
        return data + bytes([pad_len] * pad_len)

    def generate_sign(self, params: dict) -> str:
        sorted_items = sorted(
            [(key, value) for key, value in params.items() if value is not None and value != ""],
            key=lambda item: item[0],
        )
        query_string = "&".join(f"{key}={value}" for key, value in sorted_items)
        md5_hash = hashlib.md5(query_string.encode("utf-8")).hexdigest().upper()
        key = self.app_id.encode("utf-8")[:16].ljust(16, b"\0")
        cipher = AES.new(key, AES.MODE_ECB)
        encrypted = cipher.encrypt(self._pkcs5_pad(md5_hash.encode("utf-8")))
        return base64.b64encode(encrypted).decode("utf-8")

    async def get_access_token(self) -> dict:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/api/auth-server/oauth/access-token",
                data={"appId": self.app_id, "appSecret": self.app_secret},
            )
            response.raise_for_status()
            return response.json()

    async def test_connection(self) -> dict:
        if not self.app_id or not self.app_secret:
            return {"ok": False, "message": "Lingxing credentials are missing."}
        try:
            data = await self.get_access_token()
            return {
                "ok": str(data.get("code")) == "200",
                "message": data.get("msg") or "Connection tested.",
                "data": data.get("data"),
            }
        except Exception as exc:
            return {"ok": False, "message": str(exc)}

    def build_signed_url(self, path: str, access_token: str, body_params: dict | None = None) -> str:
        timestamp = str(int(time.time()))
        sign_params = {"access_token": access_token, "app_key": self.app_id, "timestamp": timestamp}
        if body_params:
            for key, value in body_params.items():
                if isinstance(value, (list, dict)):
                    sign_params[key] = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
                else:
                    sign_params[key] = value
        sign = urllib.parse.quote(self.generate_sign(sign_params), safe="")
        return f"{self.base_url}{path}?access_token={access_token}&app_key={self.app_id}&timestamp={timestamp}&sign={sign}"

    async def request(self, method: str, path: str, body_params: dict | None = None) -> dict:
        token_data = await self.get_access_token()
        token = (token_data.get("data") or {}).get("access_token")
        if not token:
            raise RuntimeError(f"Lingxing token missing: {token_data}")
        url = self.build_signed_url(path, token, body_params)
        async with httpx.AsyncClient(timeout=60) as client:
            if method.upper() == "GET":
                response = await client.get(url)
            else:
                response = await client.post(url, json=body_params or {}, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            return response.json()

    async def list_marketplaces(self) -> dict:
        return await self.request("GET", "/erp/sc/data/seller/allMarketplace")

    async def list_shops(self) -> dict:
        return await self.request("GET", "/erp/sc/data/seller/lists")

    async def list_listings(self, sid: int, offset: int = 0, length: int = 1000) -> dict:
        return await self.request(
            "POST",
            "/erp/sc/data/mws/listing",
            body_params={
                "sid": str(sid),
                "offset": offset,
                "length": length,
            },
        )
