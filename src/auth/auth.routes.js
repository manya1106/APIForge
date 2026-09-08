import express from 'express';
const router = express.Router();
import authService from './auth.service.js';

router.post('/keys', async (req, res, next) => {
    try {
        const { apiId } = req.body;
        
        if (!apiId) {
            return res.status(400).json({ error: "apiId is required" });
        }

        const keyData = await authService.generateApiKey(apiId);
        res.status(201).json(keyData);
    } catch (error) {
        next(error);
    }
});

export default router;