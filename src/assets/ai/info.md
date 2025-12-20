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

### Usar en Postman

**Opción 1: Importar desde cURL**
1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Selecciona la pestaña **Raw text**
4. Pega uno de estos comandos cURL:

```bash
curl -X GET http://localhost:4200/actuator/health
```

**Opción 2: Crear Request Manualmente**
1. Abre Postman
2. Click en **New** > **HTTP Request**
3. Método: **GET**
4. URL: `http://localhost:4200/actuator/health`
5. Click en **Send**

**Endpoints disponibles para Postman:**
- `GET http://localhost:4200/actuator/health` - Health check completo
- `GET http://localhost:4200/health` - Health check simplificado
- `GET http://localhost:4200/actuator/info` - Información de la app

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

### `/actuator/health` - Servicio Listo (HTTP 200)
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "service": {
    "name": "infinito-ai-front",
    "version": "17.0.0",
    "environment": "development",
    "readiness": "READY"
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

### `/actuator/health` - Servicio Iniciando (HTTP 503)
Cuando el servicio está iniciando (durante los primeros 10 segundos por defecto), devuelve:
```json
{
  "status": "STARTING",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 2.5,
  "service": {
    "name": "infinito-ai-front",
    "version": "17.0.0",
    "environment": "development",
    "readiness": "NOT_READY"
  },
  "system": {
    "nodeVersion": "v18.19.0",
    "platform": "win32",
    "memory": {
      "used": 8.57,
      "total": 10.31,
      "unit": "MB"
    }
  }
}
```
**Código HTTP:** `503 Service Unavailable`

### `/health` - Servicio Listo (HTTP 200)
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `/health` - Servicio Iniciando (HTTP 503)
```json
{
  "status": "STARTING",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```
**Código HTTP:** `503 Service Unavailable`

## Estado del Servicio

El endpoint de health check implementa un período de inicialización durante el cual:
- Devuelve **HTTP 503** (Service Unavailable) con `status: "STARTING"`
- Después del período de inicialización (por defecto 10 segundos), devuelve **HTTP 200** con `status: "UP"`

Esto permite a los sistemas de monitoreo y load balancers saber cuándo el servicio está realmente listo para recibir tráfico.

### Configurar el Tiempo de Inicialización

Puedes cambiar el tiempo de inicialización usando una variable de entorno:

```bash
# En Windows PowerShell
$env:STARTUP_TIME_MS=5000; npm start

# En Linux/Mac
STARTUP_TIME_MS=5000 npm start
```

El valor por defecto es **10000ms (10 segundos)**.

## Integración con Monitoreo

Cualquier herramienta de monitoreo (Prometheus, Grafana, Kubernetes liveness probes, etc.) puede consultar estos endpoints para verificar el estado del servicio.

## Integración con Aplicaciones Java

Si estás llamando al endpoint desde una aplicación Java y obtienes `Connection refused`, prueba las siguientes soluciones:

### Solución 1: Usar 127.0.0.1 en lugar de localhost

Java puede resolver `localhost` de manera diferente (IPv6 vs IPv4). Usa la dirección IP explícita:

```java
// ❌ No usar
String url = "http://localhost:4200/actuator/health";

// ✅ Usar esto
String url = "http://127.0.0.1:4200/actuator/health";
```

### Solución 2: Configurar Java para usar IPv4

Si tu aplicación Java está usando IPv6, fuerza IPv4:

```java
// Opción 1: System property
System.setProperty("java.net.preferIPv4Stack", "true");

// Opción 2: JVM argument al iniciar
// java -Djava.net.preferIPv4Stack=true -jar tu-aplicacion.jar
```

### Solución 3: Ejemplo completo con HttpClient (Java 11+)

```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class HealthCheckClient {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        // Usar 127.0.0.1 en lugar de localhost
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:4200/actuator/health"))
            .header("Accept", "application/json")
            .GET()
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        System.out.println("Status: " + response.statusCode());
        System.out.println("Body: " + response.body());
    }
}
```

### Solución 4: Ejemplo con RestTemplate (Spring)

```java
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;

RestTemplate restTemplate = new RestTemplate();

// Usar 127.0.0.1 en lugar de localhost
String url = "http://127.0.0.1:4200/actuator/health";

ResponseEntity<HashMap> response = restTemplate.getForEntity(
    url, 
    HashMap.class
);

System.out.println("Status: " + response.getStatusCode());
System.out.println("Body: " + response.getBody());
```

### Solución 5: Verificar que el servidor esté corriendo

Antes de hacer la petición desde Java, verifica que el servidor esté activo:

```bash
# Desde terminal
curl http://127.0.0.1:4200/actuator/health
```

Si este comando funciona pero Java no, entonces es un problema de configuración de red de Java.

## Notas

- El servidor Express se ejecuta en el puerto 3001 y escucha en todas las interfaces (0.0.0.0)
- Angular se ejecuta en el puerto 4200 y hace proxy de las peticiones a `/actuator/*` y `/health` al servidor Express
- Los endpoints están disponibles tanto en `localhost:4200` (vía proxy) como en `localhost:3001` (directo)
- Para aplicaciones Java, se recomienda usar `127.0.0.1` en lugar de `localhost`
- Muy ligero y sin dependencias pesadas
- Compatible con cualquier cliente HTTP (curl, wget, Postman, aplicaciones Java, etc.)
- Usa `concurrently` para ejecutar ambos servicios simultáneamente con `npm start`

