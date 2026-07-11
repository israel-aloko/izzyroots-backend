const router = require('express').Router();
const DeliveryZone = require('../models/Deliveryzone');

//get /api/delivery-zones - public, only active zones, used by checkout
router.get('/', async (req, res) => {
    try {
        const zones = await DeliveryZone.find({ isActive: true}).sort({ state: 1});
        res.json(zones);
    } catch (err) {
        console.error('Fetch delivery zones error:', err);
        res.status(500).json({message: 'Failed to fetch delivery zones'});
    }
});

module.exports = router;