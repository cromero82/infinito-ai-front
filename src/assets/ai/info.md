# Health Check Endpoint - Spring Actuator Style

## Tecnología

Se ha implementado un servidor **Express.js** ligero que proporciona endpoints de health check similares a Spring Actuator.

## Endpoints Disponibles

1. **`/actuator/health`** - Health check completo con información detallada
2. **`/health`** - Health check simplificado (más ligero)
3. **`/actuator/info`** - Información sobre la aplicación

## Iniciar el Servidor

**IMPORTANTE:** Asegúrate de detener cualquier proceso de Angular que esté corriendo antes de iniciar.

Para iniciar la aplicación completa (Angular + Health Check Server), ejecuta:

```bash
npm start
```

Esto iniciará:
- El servidor Express de health check en el puerto **3001** (debe iniciarse primero)
- El servidor Angular en el puerto **4200** (esperará a que Express esté listo)

Los endpoints de health check estarán disponibles a través del puerto **4200** gracias al proxy de Angular.

### Verificar que el servidor Express está corriendo

Antes de usar el proxy, verifica que el servidor Express esté activo:

```bash
curl http://localhost:3001/health
```

Si obtienes una respuesta JSON con `"status": "UP"`, el servidor Express está funcionando correctamente.

## Comandos para Consultar el Estado

### Importar en Postman

Copia y pega este curl en Postman (File > Import > Raw text):

```bash
curl -X GET http://localhost:4200/actuator/health -H "Accept: application/json"
```

### Health Check Completo (actuator/health)

**A través del proxy Angular (puerto 4200):**
```bash
curl http://localhost:4200/actuator/health
```

**Directo al servidor Express (puerto 3001):**
```bash
curl http://localhost:3001/actuator/health
```

**En Windows PowerShell (puerto 4200):**
```powershell
Invoke-WebRequest -Uri http://localhost:4200/actuator/health | Select-Object -ExpandProperty Content
```

**Con formato JSON (requiere jq en Linux/Mac):**
```bash
curl http://localhost:4200/actuator/health | jq
```

### Health Check Simplificado (health)

**A través del proxy Angular (puerto 4200):**
```bash
curl http://localhost:4200/health
```

**Directo al servidor Express (puerto 3001):**
```bash
curl http://localhost:3001/health
```

**En Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:4200/health | Select-Object -ExpandProperty Content
```

### Información de la Aplicación (actuator/info)

**A través del proxy Angular (puerto 4200):**
```bash
curl http://localhost:4200/actuator/info
```

**Directo al servidor Express (puerto 3001):**
```bash
curl http://localhost:3001/actuator/info
```

**En Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:4200/actuator/info | Select-Object -ExpandProperty Content
```

## Respuesta de Ejemplo

### `/actuator/health`
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "service": {
    "name": "infinito-ai-front",
    "version": "17.0.0",
    "environment": "development"
  },
  "system": {
    "nodeVersion": "v18.19.0",
    "platform": "win32",
    "memory": {
      "used": 45.23,
      "total": 128.45,
      "unit": "MB"
    }
  }
}
```

### `/health`
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Integración con Monitoreo

Cualquier herramienta de monitoreo (Prometheus, Grafana, Kubernetes liveness probes, etc.) puede consultar estos endpoints para verificar el estado del servicio.

## Notas

- El servidor Express se ejecuta en el puerto 3001
- Angular se ejecuta en el puerto 4200 y hace proxy de las peticiones a `/actuator/*` y `/health` al servidor Express
- Los endpoints están disponibles tanto en `localhost:4200` (vía proxy) como en `localhost:3001` (directo)
- Muy ligero y sin dependencias pesadas
- Compatible con cualquier cliente HTTP (curl, wget, Postman, etc.)
- Usa `concurrently` para ejecutar ambos servicios simultáneamente con `npm start`

