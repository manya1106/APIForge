import express from 'express';
import registryRoutes from './registry/registry.routes.js';
import gatewayRoutes from './gateway/gateway.routes.js';
import authRoutes from './auth/auth.routes.js';

const app = express();
app.use(express.json());


app.use('/registry/apis', registryRoutes);
app.use('/gateway', gatewayRoutes);
app.use('/auth', authRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("System Error:", err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`APIForge monolith running on port ${PORT}`);
});