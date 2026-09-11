const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Período antes de marcar /health como listo (503 → 200). En dev, 10s retrasaba innecesariamente
// el arranque de `ng serve` (wait-on). Subir en CI/prod: STARTUP_TIME_MS=10000 npm run health:server
const STARTUP_TIME_MS = process.env.STARTUP_TIME_MS
  ? parseInt(process.env.STARTUP_TIME_MS, 10)
  : 300;

let serviceReady = false;

function isServiceReady() {
  // process.uptime() no se rompe si cambias la fecha del sistema (pruebas de “otro día”).
  return serviceReady && process.uptime() * 1000 >= STARTUP_TIME_MS;
}

// Middleware para parsear JSON
app.use(express.json());

// Health check endpoint similar a Spring Actuator
app.get('/actuator/health', (req, res) => {
  const uptime = process.uptime();
  const isReady = isServiceReady();

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
  const isReady = isServiceReady();

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

// Iniciar servidor de health check en puerto 3001
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/actuator/health`);
  console.log(`Simple health: http://localhost:${PORT}/health`);

  setTimeout(() => {
    serviceReady = true;
    console.log(`Service is now READY (startup time: ${STARTUP_TIME_MS}ms elapsed)`);
  }, STARTUP_TIME_MS);
});

// Modo producción: servir el build estático de Angular en puerto 4200
if (process.argv.includes('--serve-static')) {
  const DIST_BROWSER = path.join(__dirname, 'dist', 'vex', 'browser');
  const DIST_FALLBACK = path.join(__dirname, 'dist', 'vex');
  const fs = require('fs');
  const distPath = fs.existsSync(DIST_BROWSER) ? DIST_BROWSER : DIST_FALLBACK;
  const FRONT_PORT = 4200;

  const frontApp = express();
  frontApp.use(express.static(distPath));
  // Angular routing: devolver index.html para cualquier ruta no encontrada
  frontApp.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  frontApp.listen(FRONT_PORT, '0.0.0.0', () => {
    console.log(`Frontend (prod build) serving at http://localhost:${FRONT_PORT}`);
    console.log(`Serving from: ${distPath}`);
  });
}






