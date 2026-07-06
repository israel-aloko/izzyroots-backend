const router = require('express').Router();
const isAdmin = require('../middleware/isAdmin');
const upload = require('../middleware/upload');
const Product = require('../models/Product');

router.post('/', isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const productData = { ...req.body };
        if (req.body.variants) {
            productData.variants = JSON.parse(req.body.variants);
        }
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(f => f.path);
            productData.image = productData.images[0]; //cover = first uploaded photo
        }
        const product = await Product.create(productData);
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message});
    }
});

//update
router.put('/:id', isAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const productData = { ...req.body };
        if (req.body.variants) {
            productData.variants = JSON.parse(req.body.variants);
        }
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(f => f.path);
            productData.image = productData.images[0];
        }
        const product = await Product.findByIdAndUpdate(req.params.id, productData, {new: true});
        if (!product) return res.status(404).json({ message: 'Product not found'});
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message});
    }
});

//soft delete - ADD IN A PERMANENT DELETE TOO
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