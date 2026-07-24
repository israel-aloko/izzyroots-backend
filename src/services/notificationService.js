const Notification = require('../models/Notification');

const LOW_STOCK_THRESHOLD = 50;

// core helper - call this from anywhere to fire a notification
async function createNotification(type, message, link, relatedId) {
    try {
        await Notification.create({ type, message, link, relatedId });
    } catch (err) {
        // never let a notification failure break the calling request
        console.error('Failed to create notification:', err);
    }
}

// checks stock BEFORE and AFTER a change, only notifies if it just crossed
// from above threshold to at-or-below threshold (so it doesn't spam on
// every save while a product stays low)
async function checkLowStockCrossing(productBefore, productAfter) {
    const before = getLowestStockLevel(productBefore);
    const after = getLowestStockLevel(productAfter);

    if (before > LOW_STOCK_THRESHOLD && after <= LOW_STOCK_THRESHOLD) {
        await createNotification(
            'low_stock',
            `${productAfter.name} is running low on stock (${after} left)`,
            `/admin/products`,
            productAfter._id
        );
    }
}

// for variant products, the "lowest" variant stock is what matters most
// for simple products, it's just stockCount
function getLowestStockLevel(product) {
    if (product.variants && product.variants.length > 0) {
        return Math.min(...product.variants.map(v => v.stock));
    }
    return product.stockCount;
}

module.exports = {
    createNotification,
    checkLowStockCrossing,
    LOW_STOCK_THRESHOLD
};