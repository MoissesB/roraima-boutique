"""Servidor local de revisión para la copia aislada de Roraima.

No es un servidor de producción. Expone solamente las rutas de revisión y
niega los catálogos desactivados y los árboles de código fuente.
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
BLOCKED_ROOTS = {
    "alfred-kerbs-roraima-source",
    "balmain",
    "silhouette-catalog-source",
    "silhouette-wrapper-legacy",
}


class ReviewHandler(SimpleHTTPRequestHandler):
    def _is_blocked(self) -> bool:
        path = unquote(urlparse(self.path).path).lstrip("/")
        parts = [part for part in path.split("/") if part]
        if not parts:
            return False
        if parts[0] in BLOCKED_ROOTS:
            return True
        return any(part in {".git", ".openai", "node_modules", "source"} for part in parts)

    def _deny(self) -> None:
        self.send_error(404, "Ruta no disponible en la revisión local")

    def do_GET(self) -> None:
        if self._is_blocked():
            self._deny()
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        if self._is_blocked():
            self._deny()
            return
        super().do_HEAD()

    def list_directory(self, path: str):
        self._deny()
        return None

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8766), ReviewHandler)
    print("Roraima local review: http://127.0.0.1:8766/", flush=True)
    server.serve_forever()
