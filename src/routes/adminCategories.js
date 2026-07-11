const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

//GET /api/admin/categories - list all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error('Fetch categories error:', err);
        res.status(500).json({message: 'Failed to fetch categories' });
    }
});

//POST /api/admin/categories - create a new category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const existing = await Category.findOne({ name: name.trim() });
        if (existing) {
            return res.status(409).json({ message: 'Category already exists'});
        }
        const category = await Category.create({ name: name.trim()});
        res.status(201).json(category);
    } catch (err) {
        console.error('Create category error:', err);
        res.status(500).json({ message: 'Failed to create category' });
    }
});

//PUT /api/admin/categories/:id - rename or reactive a category
router.put('/:id', async (req, res) => {
    try {
        const {name, isActive} = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found'});
        }

        if (name && name.trim() && name.trim() !== category.name) {
            const existing = await Category.findOne({ name: name.trim() });
            if (existing) {
                return res.status(409).json({message: 'Another category already has that name'});
            }

            //keep products pointing at the new name so nothing goes orphaned
            await Product.updateMany({ category: category.name}, {category: name.trim() });
            category.name = name.trim();
        }
        
        if (typeof isActive === 'boolean') {
            category.isActive = isActive;
        }

        await category.save();
        res.json(category);
    } catch (err) {
        console.error('Update category:', err);
        res.status(500).json({ message: 'Failed to update category'});
    }
});

// DELETE /api/admin/categories/:id
// If products still use this category, deactivate it instead of deleting.
// Only hard-delete when zero products reference it.
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
 
    const productCount = await Product.countDocuments({ category: category.name });
 
    if (productCount > 0) {
      category.isActive = false;
      await category.save();
      return res.json({
        message: `Category is used by ${productCount} product(s), so it was deactivated instead of deleted.`,
        category,
      });
    }
 
    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});
 
module.exports = router;
 