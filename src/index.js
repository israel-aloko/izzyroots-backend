require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const registerRoutes = require('./routes/registerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/products');
const adminProductRoutes = require('./routes/adminProducts');
const searchRoutes = require('./routes/searchRoutes')
const adminCategoryRoutes = require('./routes/adminCategories')
const categoryRoutes = require('./routes/categories')
const adminUserRoutes = require('./routes/adminUsers');
const {isAdmin} = require('./middleware/isAdmin');
const deliveryZoneRoutes = require('./routes/deliveryZones');
const adminDeliveryZoneRoutes = require('./routes/adminDeliveryZones');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const supportTicketRoutes = require('./routes/supportTickets');
const adminSupportTicketRoutes = require('./routes/adminSupportTickets');
const faqRoutes = require('./routes/faqs');
const adminFaqRoutes = require('./routes/adminFaqs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173',
    //add in the port for local hosting
    'http://192.168.1.6:5173',
    'https://izzyroots-react.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/auth', authRoutes);
app.use('/api', registerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/users', isAdmin, adminUserRoutes);
app.use('/api/delivery-zones', deliveryZoneRoutes);
app.use('/api/admin/delivery-zones', adminDeliveryZoneRoutes);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/admin/support-tickets', isAdmin, adminSupportTicketRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/admin/faqs', isAdmin, adminFaqRoutes);

app.get('/', (req, res) => {
  res.send('IzzyRoots backend is alive 🌱');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});