const cds = require('@sap/cds');
const cors = require('cors');

// Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4200'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Apply CORS middleware during bootstrap
cds.on('bootstrap', (app) => {
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
});

// Log when server is ready
cds.on('listening', () => {
  console.log('\n✅ CAP server is listening on port 4004');
  console.log('📊 API available at:');
  console.log('   - Catalog Service: http://localhost:4004/catalog');
  console.log('   - Analytics Service: http://localhost:4004/analytics');
  console.log('   - Swagger UI: http://localhost:4004/api');
});

module.exports = cds.server;
