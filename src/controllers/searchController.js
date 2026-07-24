const Product = require('../models/Product');

const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim() === '') {
            return res.status(200).json([]);
        }

        const products = await Product.find({
            $or: [
                {name: {$regex: query, $options: 'i'}},
                {localName: { $regex: query, $options: 'i'}},
                { category: {$regex: query, $options: 'i'}},
            ]
        }).limit(10);

        res.status(200).json(products);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Something went wrong during search' });
    }
};

module.exports = { searchProducts }