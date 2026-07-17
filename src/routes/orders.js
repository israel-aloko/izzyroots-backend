// const express = require('express');
// const router = express.Router();
// const crypto = require('crypto');
// const Order = require('../models/Order'); // adjust path to match your structure
// const Product = require('../models/Product');
// const isAuthenticated = require('../middleware/isAuthenticated');
// const isAdmin = require('../middleware/isAdmin');;
// const { sendPickuPReadyEmail } = require('../services/emailService');


// //get /orders/admin/all - for the admin to view all the orders, with optional filters 
// router.get('/admin/all', isAdmin, async (req, res) => {
//     try {
//         const { status, search, startDate, endDate } = req.query;

//         const filter = {};

//         if (status) {
//             filter.status = status;
//         }

//         if (startDate || endDate) {
//             filter.createdAt = {};
//             if (startDate) filter.createdAt.$gte = new Date(startDate);
//             if (endDate) filter.createdAt.$lte = new Date(endDate);
//         }

//         if (search) {
//             filter.$or = [
//                 { fullname: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } }
//             ];
//         }

//         const orders = await Order.find(filter).sort({ createdAt: -1 });
//         res.json(orders);
//     } catch (err) {
//         console.error('Admin fetch orders error:', err);
//         res.status(500).json({ message: 'Failed to fetch orders' });
//     }
// })

// //customer: get own order history
// router.get('/mine', isAuthenticated, async (req, res) => {
//     try {
//         const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
//         res.json(orders)
//     } catch (err) {
//         console.error('Fetch my orders error:', err)
//         res.status(500).json({ message: 'Failed to fetch orders' })
//     }
// })

// // GET /orders/admin/user/:userId - admin: view a specific customer's orders
// router.get('/admin/user/:userId', isAdmin, async (req, res) => {
//     try {
//         const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
//         res.json(orders);
//     } catch (err) {
//         console.error('Admin fetch user orders error:', err);
//         res.status(500).json({ message: 'Failed to fetch orders for user' });
//     }
// });

// //GET /orders/admin/:id - admin: view any single order in full detail
// router.get('/admin/:id', isAdmin, async (req, res) => {
//     try {
//         const order = await Order.findById(req.params.id);
//         if (!order) return res.status(404).json({ message: 'Order not found' });
//         res.json(order);
//     } catch (err) {
//         console.error('Admin fetch order error:', err);
//         res.status(500).json({ message: 'Failed to fetch order' });
//     }
// });

// //PATCH /orders/admin/:id/status
// router.patch('/admin/:id/status', isAdmin, async (req, res) => {
//     try {
//         const { status } = req.body;

//         const validStatuses = ['pending_payment', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'refunded'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ message: 'Invalid status value' });
//         }

//         const order = await Order.findByIdAndUpdate(
//             req.params.id,
//             { status },
//             { new: true, runValidators: true }
//         );

//         if (!order) return res.status(404).json({ message: 'Order not found' });

//         res.json(order);
//     } catch (err) {
//         console.error('Admin update order status error:', err);
//         res.status(500).json({ message: 'Failed to update order status' });
//     }
// });

// //PATCH /orders/admin/:id/notify-pickup-ready - admin: click to email customer that their pickup order is ready
// router.patch('/admin/:id/notify-pickup-ready', isAdmin, async (req, res) => {
//     try {
//         const order = await Order.findById(req.params.id);
//         if (!order) return res.status(404).json({ message: 'Order not found' });

//         if (order.fulfillmentMethod !== 'pickup') {
//             return res.status(400).json({ message: 'This order is not a pickup order' });
//         }

//         if (order.pickupReadyNotifiedAt) {
//             return res.status(400).json({ message: 'Customer has already been notified' });
//         }

//         await sendPickupReadyEmail(order);

//         order.pickupReadyNotifiedAt = new Date();
//         order.status = 'ready_for_pickup';
//         await order.save();

//         res.json(order);
//     } catch (err) {
//         console.error('Notify pickup ready error:', err);
//         res.status(500).json({ message: 'Failed to send pickup notification' });
//     }
// });

// // POST /orders - create a pending order right before Paystack popup opens
// router.post('/', isAuthenticated, async (req, res) => {
//     try {
//         const {
//             items,
//             fullname, email, phone, address, country, region, notes,
//             deliveryFee
//         } = req.body;

//         if (!items || !Array.isArray(items) || items.length === 0) {
//             return res.status(400).json({ message: 'Order must contain at least one item' });
//         }

//         if (!['delivery', 'pickup'].includes(fulfillmentMethod)) {
//             return res.status(400).json({ message: 'Invalid fulfillment method' });
//         }

//         if (fulfillmentMethod === 'delivery' && (!address || !region)) {
//             return res.status(400).json({ message: 'Address and region are required for delivery' });
//         }

//         let subtotal = 0;
//         const orderItems = [];

//         for (const cartItem of items) {
//             const product = await Product.findById(cartItem.productId);
//             if (!product || !product.isActive) {
//                 return res.status(400).json({ message: `Product not found or unavailable: ${cartItem.productId}` });
//             }

//             let unitPrice, availableStock, variantId = null;

//             if (cartItem.variantId) {
//                 const variant = product.variants.id(cartItem.variantId);
//                 if (!variant) {
//                     return res.status(400).json({ message: `Variant not found for ${product.name}` });
//                 }
//                 unitPrice = variant.price;
//                 availableStock = variant.stock;
//                 variantId = variant._id;
//             } else {
//                 unitPrice = product.price;
//                 availableStock = product.stockCount;
//             }

//             // fail fast check - not a reservation, just avoids obviously-doomed orders
//             if (availableStock < cartItem.quantity) {
//                 return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
//             }

//             const lineTotal = unitPrice * cartItem.quantity;
//             subtotal += lineTotal;

//             orderItems.push({
//                 product: product._id,
//                 name: product.name,
//                 packSize: cartItem.packSize || undefined,
//                 variantId,
//                 price: unitPrice,
//                 quantity: cartItem.quantity
//             });
//         }

//         const effectiveDeliveryFee = fulfillmentMethod === 'pickup' ? 0 : (deliveryFee || 0);
//         const total = subtotal + effectiveDeliveryFee;

//         const total = subtotal + (deliveryFee || 0);

//         // unique reference to hand to Paystack
//         const paymentReference = `izzyroots_${crypto.randomBytes(8).toString('hex')}`;

//         const order = await Order.create({
//             user: req.user._id,
//             items: orderItems,
//             fullname, email, phone, address, country, region, notes,
//             subtotal,
//             deliveryFee: deliveryFee || 0,
//             total,
//             paymentReference
//         });

//         res.status(201).json(order);
//     } catch (err) {
//         console.error('Order creation error:', err);
//         res.status(500).json({ message: 'Failed to create order' });
//     }
// });

// // GET /orders/:id - fetch a single order (customer viewing their own order / order confirmation page)
// router.get('/:id', isAuthenticated, async (req, res) => {
//     try {
//         const order = await Order.findById(req.params.id);
//         if (!order) return res.status(404).json({ message: 'Order not found' });

//         if (order.user.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Not authorized to view this order' });
//         }

//         res.json(order);
//     } catch (err) {
//         console.error('Fetch order error:', err);
//         res.status(500).json({ message: 'Failed to fetch order' });
//     }
// });

// // GET /orders - fetch logged-in user's orders
// router.get('/', isAuthenticated, async (req, res) => {
//     try {
//         const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
//         res.json(orders);
//     } catch (err) {
//         console.error('Fetch orders error:', err);
//         res.status(500).json({ message: 'Failed to fetch orders' });
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const isAuthenticated = require('../middleware/isAuthenticated');
const isAdmin = require('../middleware/isAdmin')
const { sendPickupReadyEmail } = require('../services/emailService');

//get /orders/admin/all - for the admin to view all the orders, with optional filters 
router.get('/admin/all', isAdmin, async (req, res) => {
    try {
        const {status, search, startDate, endDate} = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            filter.$or = [
                {fullname: {$regex: search, $options: 'i'}},
                {email: {$regex: search, $options: 'i'}},
                {phone: {$regex: search, $options: 'i'}}
            ];
        }

        const orders = await Order.find(filter).sort({ createdAt: -1});
        res.json(orders);
    } catch (err) {
        console.error('Admin fetch orders error:', err);
        res.status(500).json({message: 'Failed to fetch orders'});
    }
})

//customer: get own order history
router.get('/mine', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
        res.json(orders)
    } catch (err) {
        console.error('Fetch my orders error:', err)
        res.status(500).json({ message: 'Failed to fetch orders' })
    }
})

// GET /orders/admin/user/:userId - admin: view a specific customer's orders
router.get('/admin/user/:userId', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Admin fetch user orders error:', err);
        res.status(500).json({ message: 'Failed to fetch orders for user' });
    }
});

//GET /orders/admin/:id - admin: view any single order in full detail
router.get('/admin/:id', isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found'});
        res.json(order);
    } catch (err) {
        console.error('Admin fetch order error:', err);
        res.status(500).json({message: 'Failed to fetch order'});
    }
});

//PATCH /orders/admin/:id/status - admin: update order fulfillment status
router.patch('/admin/:id/status', isAdmin, async (req, res) => {
    try {
        const {status} = req.body;
        
        const validStatuses = ['pending_payment', 'paid', 'processing', 'ready_for_pickup', 'picked_up', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value'});
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {status},
            {new: true, runValidators: true}
        );

        if (!order) return res.status(404).json({message: 'Order not found'});
        
        res.json(order);
    } catch (err) {
        console.error('Admin update order status error:', err);
        res.status(500).json({ message: 'Failed to update order status'});
    }
});

//PATCH /orders/admin/:id/notify-pickup-ready - admin: click to email customer that their pickup order is ready
router.patch('/admin/:id/notify-pickup-ready', isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.fulfillmentMethod !== 'pickup') {
            return res.status(400).json({ message: 'This order is not a pickup order' });
        }

        if (order.pickupReadyNotifiedAt) {
            return res.status(400).json({ message: 'Customer has already been notified' });
        }

        await sendPickupReadyEmail(order);

        order.pickupReadyNotifiedAt = new Date();
        order.status = 'ready_for_pickup';
        await order.save();

        res.json(order);
    } catch (err) {
        console.error('Notify pickup ready error:', err);
        res.status(500).json({ message: 'Failed to send pickup notification' });
    }
});

// POST /orders - create a pending order right before Paystack popup opens
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const {
            items, // [{ productId, packSize, variantId, quantity }] from cart
            fullname, email, phone, address, country, region, notes,
            fulfillmentMethod, deliveryFee
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item' });
        }

        if (!['delivery', 'pickup'].includes(fulfillmentMethod)) {
            return res.status(400).json({ message: 'Invalid fulfillment method' });
        }

        if (fulfillmentMethod === 'delivery' && (!address || !region)) {
            return res.status(400).json({ message: 'Address and region are required for delivery' });
        }

        let subtotal = 0;
        const orderItems = [];

        for (const cartItem of items) {
            const product = await Product.findById(cartItem.productId);
            if (!product || !product.isActive) {
                return res.status(400).json({ message: `Product not found or unavailable: ${cartItem.productId}` });
            }

            let unitPrice, availableStock, variantId = null;

            if (cartItem.variantId) {
                const variant = product.variants.id(cartItem.variantId);
                if (!variant) {
                    return res.status(400).json({ message: `Variant not found for ${product.name}` });
                }
                unitPrice = variant.price;
                availableStock = variant.stock;
                variantId = variant._id;
            } else {
                unitPrice = product.price;
                availableStock = product.stockCount;
            }

            // fail fast check - not a reservation, just avoids obviously-doomed orders
            if (availableStock < cartItem.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
            }

            const lineTotal = unitPrice * cartItem.quantity;
            subtotal += lineTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                packSize: cartItem.packSize || undefined,
                variantId,
                price: unitPrice,
                quantity: cartItem.quantity
            });
        }

        const effectiveDeliveryFee = fulfillmentMethod === 'pickup' ? 0 : (deliveryFee || 0);
        const total = subtotal + effectiveDeliveryFee;

        // unique reference to hand to Paystack
        const paymentReference = `izzyroots_${crypto.randomBytes(8).toString('hex')}`;

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            fullname, email, phone, notes,
            fulfillmentMethod,
            address: fulfillmentMethod === 'delivery' ? address : undefined,
            country: fulfillmentMethod === 'delivery' ? country : undefined,
            region: fulfillmentMethod === 'delivery' ? region : undefined,
            subtotal,
            deliveryFee: effectiveDeliveryFee,
            total,
            paymentReference
        });

        res.status(201).json(order);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

// GET /orders/:id - fetch a single order (customer viewing their own order / order confirmation page)
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (err) {
        console.error('Fetch order error:', err);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
});

// GET /orders - fetch logged-in user's orders
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Fetch orders error:', err);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

module.exports = router;