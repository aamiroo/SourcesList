
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

HOST = "0.0.0.0"
PORT = 3000


class FrontendHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(
            *args,
            directory=str(FRONTEND_DIR),
            **kwargs
        )

    def log_message(self, format, *args):
        print(f"[Frontend] {args[0]}")


if __name__ == "__main__":
    if not FRONTEND_DIR.exists():
        raise FileNotFoundError(
            f"Frontend directory not found: {FRONTEND_DIR}"
        )

    server = ThreadingHTTPServer(
        (HOST, PORT),
        FrontendHandler
    )

    print(f"Frontend running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nFrontend stopped.")
        server.server_close()
