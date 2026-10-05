import Category from '../models/Category.js';

const defaultCategories = [
  { name: 'Food & Dining', color: '#ef4444', icon: 'utensils', isDefault: true },
  { name: 'Shopping', color: '#f59e0b', icon: 'shopping-bag', isDefault: true },
  { name: 'Housing & Rent', color: '#10b981', icon: 'home', isDefault: true },
  { name: 'Transportation', color: '#3b82f6', icon: 'car', isDefault: true },
  { name: 'Entertainment', color: '#8b5cf6', icon: 'film', isDefault: true },
  { name: 'Bills & Utilities', color: '#ec4899', icon: 'zap', isDefault: true },
  { name: 'Health & Medical', color: '#14b8a6', icon: 'activity', isDefault: true },
  { name: 'Salary / Income', color: '#22c55e', icon: 'dollar-sign', isDefault: true },
  { name: 'Other', color: '#64748b', icon: 'more-horizontal', isDefault: true },
];

export const getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find({
      $or: [
        { isDefault: true },
        { user: req.user?._id || null }
      ]
    }).sort({ name: 1 });

    // If completely empty, seed right now
    if (!categories || categories.length === 0) {
      await Category.insertMany(defaultCategories);
      categories = await Category.find({
        $or: [
          { isDefault: true },
          { user: req.user?._id || null }
        ]
      }).sort({ name: 1 });
    }

    res.json(categories);
  } catch (error) {
    console.error('getCategories error:', error);
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.create({
      name: name.trim(),
      color: color || '#3b82f6',
      icon: icon || 'tag',
      user: req.user._id,
      isDefault: false,
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (category.isDefault) return res.status(400).json({ message: 'Cannot delete default category' });
    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await category.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};