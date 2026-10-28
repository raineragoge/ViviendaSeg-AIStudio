"""Servidor web sin dependencias de terceros. Ejecutar: py app.py"""
import json
import os
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
from engine import KB, evaluate

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / 'public'
FILE_MAP = {
    '/': ('index.html','text/html; charset=utf-8'),
    '/index.html': ('index.html','text/html; charset=utf-8'),
    '/style.css': ('style.css','text/css; charset=utf-8'),
    '/main.js': ('main.js','text/javascript; charset=utf-8'),
}

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, content, typ='application/json; charset=utf-8'):
        self.send_response(code)
        self.send_header('Content-Type',typ)
        self.send_header('Content-Length',str(len(content)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        allowed_ancestors = os.environ.get(
            'FRAME_ANCESTORS',
            "'self' https://*.google.com https://*.googleusercontent.com https://*.run.app"
        )
        csp = (
            "default-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "script-src 'self'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "base-uri 'none'; "
            f"frame-ancestors {allowed_ancestors}"
        )
        self.send_header('Content-Security-Policy', csp)
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        path=urlsplit(self.path).path
        if path=='/api/schema':
            data=json.dumps({"questions":KB["questions"],"name":KB["model_name"],"version":KB["version"],"references":KB["references"],"disclaimer":KB["disclaimer"]},ensure_ascii=False).encode()
            return self._send(200,data)
        if path in FILE_MAP:
            filename, typ=FILE_MAP[path]
            return self._send(200,(STATIC/filename).read_bytes(),typ)
        return self._send(404,b'{"error":"No encontrado"}')

    def do_POST(self):
        if urlsplit(self.path).path!='/api/evaluate':
            return self._send(404,b'{"error":"No encontrado"}')
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not (1 <= length <= 30000):
                return self._send(413,b'{"error":"Formulario demasiado grande o vacio"}')
            payload=json.loads(self.rfile.read(length))
            output=evaluate(payload)
            return self._send(200,json.dumps(output,ensure_ascii=False).encode())
        except (ValueError,UnicodeError,json.JSONDecodeError) as exc:
            return self._send(400,json.dumps({'error':str(exc)},ensure_ascii=False).encode())

if __name__ == '__main__':
    import argparse
    import os
    arg=argparse.ArgumentParser()
    arg.add_argument('--port',type=int,default=int(os.environ.get('PORT', 3000)))
    arg.add_argument('--host',type=str,default='0.0.0.0')
    args=arg.parse_args()
    server=ThreadingHTTPServer((args.host,args.port),Handler)
    print(f'Abre http://{args.host}:{args.port} en tu navegador. Ctrl+C para salir.')
    try: server.serve_forever()
    except KeyboardInterrupt: print('\nServidor detenido')
    finally: server.server_close()
