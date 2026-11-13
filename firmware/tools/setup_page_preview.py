#!/usr/bin/env python3
"""Serve the shore station's WiFi setup page (src/shore_rx/setup-page.html, SCO-310) with a fake
station behind it, so the page can be designed and checked without hardware.

    python3 firmware/tools/setup_page_preview.py            # http://localhost:8823
    python3 firmware/tools/setup_page_preview.py --saved    # a station that already has a network

The fake station answers the same /api/scan, /api/status and /api/save calls as shore_wifi.cpp.
Saving with the password "wrongpass" fails as a wrong password; a network named "Far away" or any
name not in the list is not found; anything else joins after 4 seconds.
"""
import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

PAGE = Path(__file__).resolve().parent.parent / "src" / "shore_rx" / "setup-page.html"
NETWORKS = [
    {"ssid": "David’s iPhone", "rssi": -48, "secured": True},
    {"ssid": "BroncoFi-Devices", "rssi": -61, "secured": True},
    {"ssid": "Bannan Lab 2.4", "rssi": -70, "secured": True},
    {"ssid": "SCU-Guest", "rssi": -82, "secured": False},
]


class FakeStation:
    def __init__(self, saved):
        self.saved = "Bannan Lab 2.4" if saved else ""
        self.has_token = saved
        self.state = "connected" if saved else "idle"
        self.reason = ""
        self.join_at = 0.0
        self.scan_ready_at = time.time() + 1.5

    def status(self):
        if self.state == "joining" and time.time() >= self.join_at:
            self.state = "connected"
        return {
            "station": "SCOUT-Setup-1A2B",
            "saved": self.saved,
            "has_token": self.has_token,
            "state": self.state,
            "reason": self.reason,
            "ip": "172.20.10.4" if self.state == "connected" else "",
            "rssi": -52 if self.state == "connected" else 0,
        }

    def save(self, ssid, password, token):
        if not ssid:
            return 400, {"error": "Pick a network or type its name."}
        if 0 < len(password) < 8:
            return 400, {"error": "WiFi passwords are at least 8 characters."}
        token = token.strip()
        if not token and not self.has_token:
            return 400, {"error": "Paste the station token from the console's Stations page."}
        if token and not token.startswith("scd_"):
            return 400, {"error": "That is not a station token. It starts with scd_ and comes from the Stations page."}
        self.saved, self.has_token = ssid, True
        known = any(n["ssid"] == ssid for n in NETWORKS)
        if password == "wrongpass":
            self.state, self.reason = "failed", "wrong_password"
        elif ssid == "Far away" or not known:
            self.state, self.reason = "failed", "not_found"
        else:
            self.state, self.reason, self.join_at = "joining", "", time.time() + 4
        return 200, {"ok": True}


def make_handler(station):
    class Handler(BaseHTTPRequestHandler):
        def send(self, code, body, kind="application/json"):
            data = body if isinstance(body, bytes) else json.dumps(body).encode()
            self.send_response(code)
            self.send_header("Content-Type", kind)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path == "/":
                self.send(200, PAGE.read_bytes(), "text/html; charset=utf-8")
            elif self.path == "/api/scan":
                scanning = time.time() < station.scan_ready_at
                self.send(200, {"scanning": scanning, "networks": [] if scanning else NETWORKS})
            elif self.path == "/api/status":
                self.send(200, station.status())
            else:
                self.send(404, {"error": "not found"})

        def do_POST(self):
            if self.path != "/api/save":
                self.send(404, {"error": "not found"})
                return
            length = int(self.headers.get("Content-Length", "0"))
            form = parse_qs(self.rfile.read(length).decode(), keep_blank_values=True)
            field = lambda name: form.get(name, [""])[0]
            code, body = station.save(field("ssid"), field("password"), field("token"))
            self.send(code, body)

        def log_message(self, *_):
            pass

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--port", type=int, default=8823)
    parser.add_argument("--saved", action="store_true", help="start as a station that is already online")
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(FakeStation(args.saved)))
    print(f"setup page preview on http://localhost:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
