const router = require('express').Router();
const Product = require('../models/Product');

//public - only active products
router.get('/', async (req, res) => {
    const {category} = req.query;
    const filter = {isActive: true};
    if (category) filter.category = category;
    const products = await Products.find(filter).sort({ createdAt: -1});
    res.json(products);
});

router.get('/:id', async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) return res.status(404).json({ message: 'Product not found'});
    res.json(product);
});

module.exports = router;