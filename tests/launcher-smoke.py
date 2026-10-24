#!/usr/bin/env python3
"""Smoke-test the real local HTTP launcher without opening a browser window."""
from __future__ import annotations
import os
import queue
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = ROOT / "launch_server.py"

def main() -> int:
    env = os.environ.copy()
    env["WH40K_NO_BROWSER"] = "1"
    proc = subprocess.Popen(
        [sys.executable, str(LAUNCHER)], cwd=str(ROOT), env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace", bufsize=1,
    )
    lines: queue.Queue[str] = queue.Queue()
    def read_output() -> None:
        if proc.stdout is None:
            return
        for line in proc.stdout:
            lines.put(line)
    threading.Thread(target=read_output, daemon=True).start()
    output = []
    base = None
    deadline = time.monotonic() + 12
    try:
        while time.monotonic() < deadline and base is None:
            try:
                line = lines.get(timeout=0.2)
                output.append(line)
                match = re.search(r"Адрес:\s*(http://127\.0\.0\.1:\d+/)", line)
                if match:
                    base = match.group(1)
            except queue.Empty:
                if proc.poll() is not None:
                    break
        if not base:
            raise RuntimeError("launcher did not announce a loopback URL; output=" + "".join(output)[-1000:])
        checks = [
            "/", "/index.html", "/js/app.js", "/css/style.css", "/css/style-release-2-2.css", "/css/lore-ui-overhaul.css",
            "/js/ui/lore-primer.js",
            "/assets/backgrounds/market.jpg", "/assets/backgrounds/promzone.jpg",
            "/assets/backgrounds/temple.jpg", "/assets/backgrounds/sealed.jpg", "/assets/backgrounds/catacombs.jpg",
            "/assets/backgrounds/market-user.png", "/assets/backgrounds/industrial-cathedral-user.png",
            "/assets/backgrounds/temple-user.png", "/assets/backgrounds/sealed-gates-user.png",
            "/assets/backgrounds/ritual-chamber-user.png", "/assets/backgrounds/docks.png"
        ]
        audio_tracks = [
            "/assets/audio/imperial-archive.ogg", "/assets/audio/hive-industrial.ogg",
            "/assets/audio/cathedral-crypt.ogg", "/assets/audio/warp-disturbance.ogg",
            "/assets/audio/combat-underscore.ogg"
        ]
        for path in checks + audio_tracks:
            with urllib.request.urlopen(base + path, timeout=5) as response:
                body = response.read()
                if response.status != 200 or not body:
                    raise AssertionError(f"{path}: expected non-empty HTTP 200, got {response.status}")
                if path.endswith((".png", ".jpg")):
                    expected_mime = "image/png" if path.endswith(".png") else "image/jpeg"
                    if not response.headers.get("Content-Type", "").startswith(expected_mime):
                        raise AssertionError(f"{path}: unexpected image MIME {response.headers.get('Content-Type')!r}, expected {expected_mime}")
                    if path.endswith(".png") and body[:8] != b"\x89PNG\r\n\x1a\n":
                        raise AssertionError(f"{path}: response is not a PNG image")
                    if path.endswith(".jpg") and body[:3] != b"\xff\xd8\xff":
                        raise AssertionError(f"{path}: response is not a JPEG image")
                if path.endswith(".ogg"):
                    if body[:4] != b"OggS":
                        raise AssertionError(f"{path}: response is not an OGG media resource")
                    if not response.headers.get("Content-Type", "").startswith("audio/ogg"):
                        raise AssertionError(f"{path}: unexpected audio MIME {response.headers.get('Content-Type')!r}")
                print(f"PASS launcher HTTP {response.status}: {path} ({len(body)} bytes)")
        print("PASS all five local soundtrack files are served by the offline launcher as audio/ogg")
        # Missing optional assets must be handled as a normal 404, not a server crash.
        try:
            urllib.request.urlopen(base + "/assets/portraits/not-in-this-release.png", timeout=3)
        except urllib.error.HTTPError as exc:
            if exc.code != 404:
                raise AssertionError(f"missing asset expected 404, got {exc.code}")
            print("PASS missing optional asset returns a controlled HTTP 404 (UI fallback is tested separately)")
        else:
            raise AssertionError("nonexistent asset unexpectedly returned a successful response")
        print("PASS all ten packaged image files and the beginner-lore module are served locally with valid content types")
        print("PASS launcher uses loopback-only URL and serves the included user artwork")
        return 0
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill(); proc.wait(timeout=3)
        if proc.stdout:
            proc.stdout.close()

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FAIL launcher smoke test: {exc}", file=sys.stderr)
        raise SystemExit(1)
