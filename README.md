# ViviendaSeg — Sistema experto de riesgos de viviendas

**Versión 1.2 · Entrega académica desde Google AI Studio · 28/10/2026**

**Aplicación pública:** https://viviendaseg-sistema-experto-587532865330.europe-west3.run.app/

Este prototipo permite que propietarios de viviendas habituales, segundas residencias y viviendas propias desocupadas respondan a preguntas sobre construcción, instalaciones, conservación y ocupación. Devuelve una clasificación **orientativa y explicable**: **BAJO**, **MEDIO**, **ALTO**, o **MEDIO PROVISIONAL** cuando faltan datos esenciales. Quedan fuera del alcance los alquileres y los inmuebles no residenciales.

**Solo para uso académico.** No es un informe pericial, una evaluación actuarial ni una herramienta de decisión sobre seguros o habitabilidad.

## Arquitectura que se publica desde Google AI Studio

```text
Navegador: public/index.html, style.css, main.js
                 │
          /api/schema · /api/evaluate
                 ▼
Servidor HTTP: server.js (Node.js nativo)
                 │
Motor: functions/_shared/engine.js (JavaScript)
                 │
Base de conocimiento: functions/_shared/knowledge.js
     (generada desde knowledge.json mediante scripts/sync_knowledge.py)
                 │
Resultado: nivel, provisionalidad, reglas activadas,
           explicaciones, recomendaciones y datos faltantes
```

- **Interfaz:** cuestionario adaptativo con **19 preguntas potenciales**, ejemplos reproducibles, avisos y resultados imprimibles.
- **Hechos:** respuestas del usuario que se validan en servidor; las respuestas ocultas por condiciones se descartan.
- **Base de conocimientos:** `knowledge.json` contiene preguntas, **16 reglas SI–ENTONCES**, justificaciones y recomendaciones.
- **Motor de inferencia:** el motor JavaScript aplica reglas jerárquicas; un alto confirmado prevalece; si faltan datos esenciales sin alto confirmado, devuelve medio provisional.
- **Módulo de explicaciones:** identifica reglas activadas, su motivo, recomendaciones y respuestas desconocidas.
- **Almacenamiento:** sin base de datos ni cuentas; el prototipo no conserva las respuestas. El proveedor de alojamiento puede conservar registros técnicos.

**Python y Prolog se conservan como material académico de validación, pero no se ejecutan en producción.** El servidor `server.js` no depende de los binarios `python3` ni `swipl`. El proyecto anterior en Cloudflare Pages usaba Pages Functions; los archivos `functions/api/`, `GUIA_PUBLICACION.md` y `.github/workflows/preparar-cloudflare.yml` pertenecen a ese despliegue histórico y **no se utilizan para servir esta versión en Cloud Run**.

## Reproducir el servidor localmente

**Requisito:** Node.js 20 o superior. No requiere dependencias de terceros.

```bash
npm start
```

Abre http://localhost:8080. Se ejecuta `node server.js`, escucha en `0.0.0.0` y utiliza la variable de entorno `PORT` si existe (por defecto **8080**, como espera Cloud Run).

Para la vista previa de desarrollo, usa:

```bash
npm run dev
```

Abre http://localhost:3000. Los endpoints principales son `GET /api/schema` y `POST /api/evaluate` (JSON). No es necesario instalar Python ni Prolog para iniciar este servidor.

## Casos de prueba desde la interfaz

| Caso | Resultado esperado |
| --- | --- |
| Caso de riesgo bajo | BAJO, con datos esenciales completos y sin reglas de riesgo activadas |
| Caso de riesgo alto | ALTO, con reglas activadas y sus explicaciones |
| Datos desconocidos | MEDIO PROVISIONAL, indicando los campos pendientes |
| Vivienda destinada al alquiler | Fuera de alcance (sin evaluación) |

Las conclusiones dependen de los hechos declarados; el prototipo **no verifica** documentos, instalaciones ni condiciones reales de una vivienda.

## Pruebas automatizadas

```bash
npm test
```

Este comando ejecuta las pruebas JavaScript del motor que reutiliza el servidor Node.js. Se registraron **14 pruebas de integración JS** aprobadas durante el trabajo.

Para validación adicional se necesita Python (opcional para producción):

```bash
npm run test:python
npm run test:parity
python scripts/sync_knowledge.py --check
```

La validación académica anterior registró **40 pruebas Python** y **507 escenarios de paridad Python–JavaScript**. El cuaderno `notebooks/validacion_python_prolog.ipynb` y `docs/VALIDACION_PROLOG_2026-10-23.md` recogen **16 pruebas directas Prolog** y **514 comparaciones Python–Prolog** superadas en Google Colab. Los resultados se recogieron durante el desarrollo; no constituyen una evaluación técnica ni actuarial de riesgos reales.

Para reproducir Prolog localmente se requiere SWI-Prolog (comando `swipl`), o se puede ejecutar el cuaderno de Google Colab. El archivo `scripts/prolog_json.pl` transforma hechos normalizados en evaluaciones Prolog.

## Organización de archivos

```text
server.js                     Servidor de producción Node.js
public/                       Interfaz web y activos estáticos
functions/_shared/engine.js   Motor JavaScript del servidor
functions/_shared/knowledge.js Base de conocimientos generada
knowledge.json                Fuente editable de reglas, preguntas y explicaciones
engine.py                     Motor Python de referencia
rules.pl                      Reglas de inferencia en Prolog
scripts/                      Sincronización y pruebas de paridad
tests/                        Pruebas JavaScript, Python y Prolog
notebooks/                    Cuaderno de validación en Colab
docs/                         Capturas y registros de validación
```

Para cambiar reglas, editar `knowledge.json`, actualizar el artefacto generado con `python scripts/sync_knowledge.py` y ejecutar las pruebas. El motor JavaScript y las reglas deben quedar sincronizados.

## Protección, límites y mejoras futuras

- Las respuestas no se almacenan en una base de datos. No se solicita dirección ni referencia catastral.
- Un riesgo alto confirmado prevalece sobre factores medios o respuestas desconocidas.
- Una estructura de madera no se considera automáticamente de alto riesgo: la documentación técnica y las condiciones declaradas influyen en la evaluación.
- No se certifica la autenticidad de informes o inspecciones; las reglas son simplificaciones docentes.
- La política CSP del servidor limita la carga de recursos y los orígenes autorizados a incrustar la web; revisar los orígenes para despliegues externos.
- Posibles ampliaciones: consulta catastral, mapas oficiales, verificación documental, autenticación y persistencia de expedientes; **no están implementadas**.
- La comparación con un LLM, planificación, feedback docente y vídeo individual se preparan aparte conforme a la rúbrica.

## Repositorios y enlaces de referencia

- **Aplicación publicada desde Google AI Studio:** https://viviendaseg-sistema-experto-587532865330.europe-west3.run.app/
- **Este repositorio:** https://github.com/raineragoge/ViviendaSeg-AIStudio
- **Proyecto anterior e integración académica Python–Prolog:** https://github.com/raineragoge/ViviendaSeg-Sistema-Experto
- **Código Técnico de la Edificación, DB-SI:** https://www.codigotecnico.org/DocumentosCTE/SeguridadEnCasoDeIncendio.html
- **Real Decreto 314/2006 (BOE):** https://www.boe.es/eli/es/rd/2006/03/17/314/con

El repositorio permite reproducir el servidor Node.js de Google AI Studio. No implica que GitHub esté configurado para desplegar automáticamente cambios en Cloud Run; la publicación se gestiona desde Google AI Studio.
