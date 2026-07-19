const router = require('express').Router();
const {isAdmin} = require('../middleware/isAdmin');
const DeliveryZone = require('../models/Deliveryzone');

// GET /api/admin/delivery-zones - list all zones (active + inactive)
router.get('/', isAdmin, async (req, res) => {
    try {
        const zones = await DeliveryZone.find().sort({ state: 1 });
        res.json(zones);
    } catch (err) {
        console.error('Fetch delivery zones error:', err);
        res.status(500).json({ message: 'Failed to fetch delivery zones' });
    }
});

// POST /api/admin/delivery-zones - create a new zone
router.post('/', isAdmin, async (req, res) => {
    try {
        const { state, fee } = req.body;
        if (!state || !state.trim()) {
            return res.status(400).json({ message: 'State is required' });
        }
        if (fee === undefined || fee === null || isNaN(fee) || fee < 0) {
            return res.status(400).json({ message: 'A valid fee is required' });
        }
 
        const existing = await DeliveryZone.findOne({ state: state.trim() });
        if (existing) {
            return res.status(409).json({ message: 'A delivery zone already exists for this state' });
        }
 
        const zone = await DeliveryZone.create({ state: state.trim(), fee });
        res.status(201).json(zone);
    } catch (err) {
        console.error('Create delivery zone error:', err);
        res.status(500).json({ message: 'Failed to create delivery zone' });
    }
});

// PUT /api/admin/delivery-zones/:id - update fee, state, or active status
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { state, fee, isActive } = req.body;
        const zone = await DeliveryZone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Delivery zone not found' });
        }
 
        if (state && state.trim() && state.trim() !== zone.state) {
            const existing = await DeliveryZone.findOne({ state: state.trim() });
            if (existing) {
                return res.status(409).json({ message: 'Another zone already has that state' });
            }
            zone.state = state.trim();
        }
 
        if (fee !== undefined && fee !== null) {
            if (isNaN(fee) || fee < 0) {
                return res.status(400).json({ message: 'A valid fee is required' });
            }
            zone.fee = fee;
        }
 
        if (typeof isActive === 'boolean') {
            zone.isActive = isActive;
        }
 
        await zone.save();
        res.json(zone);
    } catch (err) {
        console.error('Update delivery zone error:', err);
        res.status(500).json({ message: 'Failed to update delivery zone' });
    }
});

// PUT /api/admin/delivery-zones/:id - update fee, state, or active status
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { state, fee, isActive } = req.body;
        const zone = await DeliveryZone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Delivery zone not found' });
        }
 
        if (state && state.trim() && state.trim() !== zone.state) {
            const existing = await DeliveryZone.findOne({ state: state.trim() });
            if (existing) {
                return res.status(409).json({ message: 'Another zone already has that state' });
            }
            zone.state = state.trim();
        }
 
        if (fee !== undefined && fee !== null) {
            if (isNaN(fee) || fee < 0) {
                return res.status(400).json({ message: 'A valid fee is required' });
            }
            zone.fee = fee;
        }
 
        if (typeof isActive === 'boolean') {
            zone.isActive = isActive;
        }
 
        await zone.save();
        res.json(zone);
    } catch (err) {
        console.error('Update delivery zone error:', err);
        res.status(500).json({ message: 'Failed to update delivery zone' });
    }
});

// DELETE /api/admin/delivery-zones/:id - permanent delete (zones have no dependent records like categories do)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Delivery zone not found' });
        }
        res.json({ message: 'Delivery zone deleted' });
    } catch (err) {
        console.error('Delete delivery zone error:', err);
        res.status(500).json({ message: 'Failed to delete delivery zone' });
    }
});
 
module.exports = router;