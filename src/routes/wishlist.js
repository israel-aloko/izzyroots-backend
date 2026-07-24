const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated');
const Wishlist = require('../models/Wishlist');

// GET /api/wishlist - fetch the logged-in user's wishlist, populated with live product data
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items.product');

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, items: [] });
        }

        // drop entries where the referenced product was deleted, so the frontend never sees nulls
        const validItems = wishlist.items.filter(item => item.product);

        res.json({ id: wishlist.id, items: validItems });
    } catch (error) {
        console.error('GET /wishlist error:', error.message);
        res.status(500).json({ message: 'Could not load wishlist.' });
    }
});

// POST /api/wishlist - add an item { productId, packSize? }
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { productId, packSize } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'productId is required.' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, items: [] });
        }

        const alreadyExists = wishlist.items.some(
            item => item.product.toString() === productId && item.packSize === packSize
        );

        if (alreadyExists) {
            return res.status(409).json({ message: 'This item is already in your wishlist.' });
        }

        wishlist.items.push({ product: productId, packSize });
        await wishlist.save();
        await wishlist.populate('items.product');

        res.status(201).json({ id: wishlist.id, items: wishlist.items });
    } catch (error) {
        console.error('POST /wishlist error:', error.message);
        res.status(500).json({ message: 'Could not add item to wishlist.' });
    }
});

// DELETE /api/wishlist/:productId - remove an item. packSize passed as query param since it's optional.
router.delete('/:productId', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.params;
        const { packSize } = req.query;

        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found.' });
        }

        wishlist.items = wishlist.items.filter(
            item => !(item.product.toString() === productId && item.packSize === packSize)
        );

        await wishlist.save();
        await wishlist.populate('items.product');

        res.json({ id: wishlist.id, items: wishlist.items });
    } catch (error) {
        console.error('DELETE /wishlist error:', error.message);
        res.status(500).json({ message: 'Could not remove item from wishlist.' });
    }
});

module.exports = router;