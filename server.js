const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración del período de inicialización (en milisegundos)
const STARTUP_TIME_MS = process.env.STARTUP_TIME_MS 
  ? parseInt(process.env.STARTUP_TIME_MS, 10) 
  : 10000; // Por defecto 10 segundos

// Estado del servicio
let serviceReady = false;
const serverStartTime = Date.now();

// Middleware para parsear JSON
app.use(express.json());

// Health check endpoint similar a Spring Actuator
app.get('/actuator/health', (req, res) => {
  const uptime = process.uptime();
  const elapsedTime = Date.now() - serverStartTime;
  const isReady = serviceReady && elapsedTime >= STARTUP_TIME_MS;

  const healthStatus = {
    status: isReady ? 'UP' : 'STARTING',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    service: {
      name: 'infinito-ai-front',
      version: require('./package.json').version,
      environment: process.env.NODE_ENV || 'development',
      readiness: isReady ? 'READY' : 'NOT_READY'
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB'
      }
    }
  };

  if (!isReady) {
    // Servicio aún iniciando - devolver 503 Service Unavailable
    return res.status(503).json(healthStatus);
  }

  // Servicio listo - devolver 200 OK
  res.status(200).json(healthStatus);
});

// Health check endpoint simplificado (alternativa más ligera)
app.get('/health', (req, res) => {
  const elapsedTime = Date.now() - serverStartTime;
  const isReady = serviceReady && elapsedTime >= STARTUP_TIME_MS;

  const healthStatus = {
    status: isReady ? 'UP' : 'STARTING',
    timestamp: new Date().toISOString()
  };

  if (!isReady) {
    // Servicio aún iniciando - devolver 503 Service Unavailable
    return res.status(503).json(healthStatus);
  }

  // Servicio listo - devolver 200 OK
  res.status(200).json(healthStatus);
});

// Info endpoint con detalles adicionales
app.get('/actuator/info', (req, res) => {
  res.status(200).json({
    app: {
      name: require('./package.json').name,
      version: require('./package.json').version,
      description: require('./package.json').description
    },
    build: {
      timestamp: new Date().toISOString()
    }
  });
});

// Iniciar servidor - escuchar en todas las interfaces (0.0.0.0) para permitir conexiones desde otras aplicaciones
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/actuator/health`);
  console.log(`Simple health: http://localhost:${PORT}/health`);
  console.log(`Server listening on all interfaces (0.0.0.0:${PORT}) - accessible from other applications`);
  console.log(`Startup time: ${STARTUP_TIME_MS}ms - Service will return 503 until ready`);
  
  // Simular inicialización del servicio
  // Aquí podrías agregar lógica real de inicialización (conexiones a BD, carga de configuración, etc.)
  
  // Después del período de inicialización, marcar el servicio como listo
  setTimeout(() => {
    serviceReady = true;
    console.log(`Service is now READY (startup time: ${STARTUP_TIME_MS}ms elapsed)`);
  }, STARTUP_TIME_MS);
});






