import express from 'express';
import registryRoutes from './registry/registry.routes.js';
import gatewayRoutes from './gateway/gateway.routes.js';
import authRoutes from './auth/auth.routes.js';
import analyticsRoutes from './analytics/analytics.routes.js';
import { initializeDb } from './db/index.js';

const app = express();
app.use(express.json());

// Routes
app.use('/registry/apis', registryRoutes);
app.use('/gateway', gatewayRoutes);
app.use('/auth', authRoutes);
app.use('/analytics', analyticsRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("System Error:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

// Initialize Database schema and start express server
initializeDb().then(() => {
    app.listen(PORT, () => {
        console.log(`APIForge service running on port ${PORT}`);
    });
});

export default app;