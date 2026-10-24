#!/usr/bin/env python3
"""Launch the local Warhammer 40,000 Solo RPG on a free loopback port."""
from __future__ import annotations
import http.server
import os
import socket
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, fmt, *args):
        print("[HTTP] " + (fmt % args))

def main() -> None:
    os.chdir(ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    server.daemon_threads = True
    url = f"http://127.0.0.1:{server.server_port}/"
    print("=" * 64)
    print("WARHAMMER 40,000 — ИМПЕРСКИЙ АРХИВ")
    print("Локальный сервер запущен. Внешнее подключение не используется.")
    print(f"Адрес: {url}")
    print("Для остановки закрой это окно или нажми Ctrl+C.")
    print("=" * 64, flush=True)
    if os.environ.get("WH40K_NO_BROWSER") != "1":
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
