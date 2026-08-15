# Auditoría local — Roraima Distribuciones

Fecha de revisión: 2026-08-14

## Límites aplicados

- Origen preservado y sin publicar: `C:\Users\moiss\OneDrive\Trabajo\Innova Boutique\apps\portal`.
- Copia aislada de trabajo: esta carpeta `roraima-boutique`.
- No se publicó, desplegó, subió a GitHub, modificó DNS, dominio, hosting ni el origen.
- Datos comerciales de Roraima: `ventas@roraimamx.net`, `+52 1 56 1008 4344` y `Av. Jaime Balmes 11, Torre A, Piso 1, Int. B, C.P. 11510, Miguel Hidalgo, Col. Polanco I Sección, CDMX (Plaza Polanco)`.

## Componentes de revisión

| Superficie | Ruta local | Estado |
| --- | --- | --- |
| Portal Nautic para Roraima | `http://127.0.0.1:8766/` | Disponible |
| Catálogo Alfred Kerbs | `http://127.0.0.1:8766/alfred-kerbs/` | Disponible |
| Catálogo Balmain | `http://127.0.0.1:8766/balmain/` | Disponible |
| Catálogo Silhouette | `http://127.0.0.1:8766/silhouette/#/catalogo` | Disponible |

## Protección de superficies sensibles

- Los tres catálogos están habilitados desde el portal y conservan su selección multimarcas en el pedido local.
- `/admin` y `/admin/login` del catálogo Alfred responden `404`.
- El servidor de revisión también niega los árboles de código fuente y no muestra listados de directorios.

## Evidencia de aislamiento de la fuente

Se conservaron los hashes SHA-256 de control de tres archivos canónicos del origen:

- `silhouette-catalog.json`: `13B9CD36A50AF49E55A3DCE9784B39D3D64C86C814D437E9DBBE6C600B068AD4`
- `GlobalInnovaHeader.vue`: `FA91B4EBA1FAE8AB9784483384BC24AD49754CAB1C6D53F88671E6A9A032E5B2`
- `ProfessionalOrder.vue`: `80B56AD9AA5D5F4DD20A3C2098950063BA96F54A5EDCBC68C48B27C03571BC3B`

## Validación completada

- Las verificaciones de sintaxis de JavaScript y Python fueron correctas.
- Portal y los tres catálogos devuelven HTTP 200 localmente.
- La revisión visual confirmó el portal Nautic completo, Roraima como identidad comercial, las tres entradas de catálogo y los enlaces locales entre ellas.
- Alfred Kerbs y Silhouette fueron contrastados con las rutas vigentes de Innova: Alfred Kerbs se conserva como marco de catálogo y Silhouette fue recompilado desde su fuente Roraima.
- Alfred Kerbs, Balmain y Silhouette comparten la misma cabecera negra de distribución: Roraima Distribuciones, contexto de marca, menú con las tres firmas y pedido global.
- Se verificaron correo, teléfono, WhatsApp y dirección oficial de Roraima en el portal y Balmain.
- No hubo publicación ni cambio en el origen de Innova/Nautic.

## Corte de publicación

La copia está lista para revisión local. Antes de publicar debe crearse o seleccionarse infraestructura propia de Roraima y obtener aprobación específica para hosting, dominio, DNS, analítica y el despliegue.
