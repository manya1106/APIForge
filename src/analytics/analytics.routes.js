import express from 'express';
import analyticsService from './analytics.service.js';

const router = express.Router();

// GET /analytics/:apiId/summary
router.get('/:apiId/summary', async (req, res, next) => {
    try {
        const { apiId } = req.params;
        const summary = await analyticsService.getSummary(apiId);
        res.json(summary);
    } catch (error) {
        next(error);
    }
});

// GET /analytics/:apiId/timeseries
router.get('/:apiId/timeseries', async (req, res, next) => {
    try {
        const { apiId } = req.params;
        const timeseries = await analyticsService.getTimeseries(apiId);
        res.json({ apiId, timeseries });
    } catch (error) {
        next(error);
    }
});

// GET /analytics/:apiId/errors
router.get('/:apiId/errors', async (req, res, next) => {
    try {
        const { apiId } = req.params;
        const errors = await analyticsService.getErrors(apiId);
        res.json({ apiId, errors });
    } catch (error) {
        next(error);
    }
});

export default router;
