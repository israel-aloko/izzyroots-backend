const router = require('express').Router();
const Category = require('../models/Category');

// GET /api/categories - public, active categories only (for shop filters)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error('Fetch public categories error:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

module.exports = router;