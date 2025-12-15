const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para parsear JSON
app.use(express.json());

// Health check endpoint similar a Spring Actuator
app.get('/actuator/health', (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: {
      name: 'infinito-ai-front',
      version: require('./package.json').version,
      environment: process.env.NODE_ENV || 'development'
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

  res.status(200).json(healthStatus);
});

// Health check endpoint simplificado (alternativa más ligera)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Health check server running on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/actuator/health`);
  console.log(`Simple health: http://localhost:${PORT}/health`);
});





