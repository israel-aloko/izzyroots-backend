const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const isAuthenticated = require('../middleware/isAuthenticated');

async function updateProductRatingStats(productId) {
    const stats = await Review.aggregate([
        {$match: {product: new mongoose.Types.ObjectId(productId)}},
        {$group: {_id: '$product', avgRating: {$avg: '$rating'}, numReviews: {$sum: 1}}}
    ]);

    await Product.findByIdAndUpdate(productId, {
        avgRating: stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        numReviews: stats.length ? stats[0].numReviews : 0
    });
}

// GET /api/reviews/product/:productId - public
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'fullname')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/product/:productId/mine - can this user review / have they already?
router.get('/product/:productId/mine', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.params;

        const existingReview = await Review.findOne({ product: productId, user: req.user._id });

        const purchased = await Order.exists({
            user: req.user._id,
            status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
            'items.product': productId
        });

        res.json({
            hasReviewed: !!existingReview,
            canReview: !!purchased,
            review: existingReview || null
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to check review status' });
    }
});

// POST /api/reviews - create (verified purchase only)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: 'productId, rating and comment are required' });
        }

        const purchased = await Order.exists({
            user: req.user._id,
            status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
            'items.product': productId
        });

        if (!purchased) {
            return res.status(403).json({ message: "You can only review products you've purchased" });
        }

        const review = await Review.create({ product: productId, user: req.user._id, rating, comment });
        await updateProductRatingStats(productId);

        res.status(201).json(review);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "You've already reviewed this product" });
        }
        res.status(500).json({ message: 'Failed to create review' });
    }
});

// PATCH /api/reviews/:reviewId - edit own review
router.patch('/:reviewId', isAuthenticated, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this review' });
        }

        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        await review.save();
        await updateProductRatingStats(review.product);

        res.json(review);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update review' });
    }
});

// DELETE /api/reviews/:reviewId - delete own review
router.delete('/:reviewId', isAuthenticated, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        const productId = review.product;
        await review.deleteOne();
        await updateProductRatingStats(productId);

        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete review' });
    }
});

module.exports = router;