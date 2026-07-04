const router = require('express').Router();
const isAdmin = require('../middleware/isAdmin');
const Product = require('../models/Product');

router.post('/', isAdmin, async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message});
    }
});

//update
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!product) return res.status(404).json({ message: 'Product not found'});
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message});
    }
});

//soft delete
router.delete('/:id', isAdmin, async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, {isActive: false}, {new: true});
    if (!product) return res.status(404).json({ message: 'Product not found'});
    res.json({message: 'Product deactivated'});
});

//admin list(includes inactive, for management)
router.get('/', isAdmin, async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
});

module.exports = router;