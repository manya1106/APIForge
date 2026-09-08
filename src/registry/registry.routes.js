import express from 'express';
import registryService from './registry.service.js';
const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        // In a real app, userId would come from an authentication middleware
        const { userId, name, targetUrl } = req.body;
        
        // We call the service layer instead of querying the DB directly here
        const api = await registryService.registerApi(userId, name, targetUrl);
        
        res.status(201).json(api);
    } catch (error) {
        next(error); 
    }
});

export default router;