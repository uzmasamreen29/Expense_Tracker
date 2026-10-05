import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  PlusCircle, 
  Trash2, 
  Wallet, 
  LogOut,
  Edit3,
  Check,
  X,
  Download,
  Search,
  AlertTriangle,
  AlertCircle,
  Tag,
  Plus,
  Smile
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
  '#ec4899', '#f43f5e', '#64748b', '#14b8a6'
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState({ totalSpent: 0, breakdown: [] });
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Budget state
  const [budget, setBudget] = useState(user?.monthlyBudget || 30000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(budget);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form State - Expense
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    paymentMethod: 'UPI',
    date: new Date().toISOString().split('T')[0],
  });

  // Form State - Category
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#6366f1',
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('ALL');

  useEffect(() => {
    if (user?.monthlyBudget !== undefined) {
      setBudget(user.monthlyBudget);
      setNewBudgetInput(user.monthlyBudget);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes, anaRes, foreRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/categories'),
        api.get('/expenses/analytics'),
        api.get('/expenses/forecast').catch(() => ({ data: null })),
      ]);

      const rawExp = expRes.data;
      const parsedExpenses = Array.isArray(rawExp) 
        ? rawExp 
        : (Array.isArray(rawExp?.expenses) ? rawExp.expenses : (Array.isArray(rawExp?.data) ? rawExp.data : []));

      const rawCat = catRes.data;
      const parsedCategories = Array.isArray(rawCat) 
        ? rawCat 
        : (Array.isArray(rawCat?.categories) ? rawCat.categories : (Array.isArray(rawCat?.data) ? rawCat.data : []));

      const rawAna = anaRes.data || {};
      const parsedAnalytics = {
        totalSpent: Number(rawAna.totalSpent) || 0,
        breakdown: Array.isArray(rawAna.breakdown) ? rawAna.breakdown : []
      };

      setExpenses(parsedExpenses);
      setCategories(parsedCategories);
      setAnalytics(parsedAnalytics);
      if (foreRes.data) {
        setForecast(foreRes.data);
      }

      if (parsedCategories.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: parsedCategories[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBudget = async () => {
    try {
      const res = await api.put('/auth/budget', { monthlyBudget: Number(newBudgetInput) });
      setBudget(res.data.monthlyBudget);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.monthlyBudget = res.data.monthlyBudget;
      localStorage.setItem('user', JSON.stringify(storedUser));

      setIsEditingBudget(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update monthly plan');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: '',
      category: categories[0]?._id || '',
      paymentMethod: 'UPI',
      date: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingExpense(item);
    setFormData({
      title: item.title || item.description || '',
      amount: item.amount || '',
      category: item.category?._id || item.category || categories[0]?._id || '',
      paymentMethod: item.paymentMethod || 'UPI',
      date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    const categoryId = formData.category || categories[0]?._id;
    const title = formData.title?.trim();

    if (!title || !formData.amount || !categoryId) {
      alert('Please enter what you spent on, the amount, and pick a category.');
      return;
    }

    try {
      const payload = {
        title,
        description: title,
        amount: Number(formData.amount),
        category: categoryId,
        paymentMethod: formData.paymentMethod || 'UPI',
        date: formData.date || new Date().toISOString(),
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      setShowAddModal(false);
      setEditingExpense(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving transaction');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      setSavingCategory(true);
      const res = await api.post('/categories', {
        name: categoryFormData.name.trim(),
        color: categoryFormData.color,
      });

      const newCategory = res.data;
      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, category: newCategory._id }));
      setCategoryFormData({ name: '', color: '#6366f1' });
      setShowCategoryModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing transaction');
    }
  };

  // Filter Pipeline
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const title = (item.title || item.description || '').toLowerCase();
      const matchesSearch = title.includes(searchQuery.toLowerCase().trim());

      const catId = item.category?._id || item.category;
      const matchesCategory = selectedCategoryFilter === 'ALL' || catId === selectedCategoryFilter;
      const matchesPayment = selectedPaymentFilter === 'ALL' || item.paymentMethod === selectedPaymentFilter;

      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [expenses, searchQuery, selectedCategoryFilter, selectedPaymentFilter]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No transactions to download.');
      return;
    }

    const headers = ['What you bought', 'Category', 'Amount (INR)', 'Payment Mode', 'Date'];
    const rows = filteredExpenses.map((exp) => [
      `"${(exp.title || exp.description || '').replace(/"/g, '""')}"`,
      `"${exp.category?.name || 'General'}"`,
      exp.amount,
      exp.paymentMethod || 'UPI',
      new Date(exp.date).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `My_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const monthlyBudget = Number(budget) || 30000;
  const currentTotal = Number(analytics?.totalSpent) || 0;
  const remainingBudget = monthlyBudget - currentTotal;
  const budgetPercent = Math.min(Math.round((currentTotal / monthlyBudget) * 100), 100);

  const now = new Date();
  const currentDay = Math.max(now.getDate(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(daysInMonth - currentDay, 0);

  const dailyBurn = Math.round(currentTotal / currentDay);
  const safeDailySpend = daysRemaining > 0 ? Math.max(Math.round(remainingBudget / daysRemaining), 0) : remainingBudget;

  // Chart data
  const trendData = useMemo(() => {
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      dayMap[label] = 0;
    }

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      if (dayMap[label] !== undefined) {
        dayMap[label] += Number(exp.amount || 0);
      }
    });

    return Object.keys(dayMap).map((day) => ({
      day,
      amount: dayMap[day],
    }));
  }, [expenses]);

  const donutData = useMemo(() => {
    if (!analytics.breakdown || analytics.breakdown.length === 0) return [];
    return analytics.breakdown.map((item) => ({
      name: item.name || 'Other',
      value: Number(item.totalAmount || item.totalSpent || 0),
      color: item.color || '#6366f1',
    }));
  }, [analytics]);

  const topCategoryName = analytics.breakdown?.[0]?.name || 'Nothing yet';

  const formatFriendlyDate = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">MyMoney</span>
              <span className="text-[11px] font-semibold text-slate-500">Personal Spending Tracker</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">
              Hi, <span className="font-bold text-slate-900">{user?.name || 'Friend'}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-2 rounded-xl transition cursor-pointer border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* 1. Traffic Light Health Card */}
        <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
          remainingBudget < 0
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : budgetPercent > 80
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                remainingBudget < 0
                  ? 'bg-rose-600 text-white'
                  : budgetPercent > 80
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {remainingBudget < 0 ? (
                  <AlertCircle className="w-6 h-6" />
                ) : budgetPercent > 80 ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Smile className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {remainingBudget < 0
                    ? `You've exceeded your plan by ₹${Math.abs(remainingBudget).toLocaleString()}`
                    : budgetPercent > 80
                    ? `Take it easy! Only ₹${remainingBudget.toLocaleString()} left for this month`
                    : `You're doing great! ₹${remainingBudget.toLocaleString()} safe to spend`}
                </h2>
                <p className="text-xs sm:text-sm mt-1 font-medium opacity-90 leading-relaxed">
                  {remainingBudget < 0
                    ? `Try avoiding unnecessary shopping or dining out until next month.`
                    : `With ${daysRemaining} days left, you can safely spend about ₹${safeDailySpend.toLocaleString()} each day.`}
                </p>
              </div>
            </div>

            <button
              onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log an Expense</span>
            </button>
          </div>
        </div>

        {/* 2. Three Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Spent So Far */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Spent so far
            </span>
            <div className="text-3xl font-black text-slate-900">
              ₹{currentTotal.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Mostly on <span className="font-bold text-slate-800">{topCategoryName}</span>
            </p>
          </div>

          {/* Card 2: Monthly Target */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monthly Target
              </span>
              {!isEditingBudget && (
                <button
                  onClick={() => setIsEditingBudget(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {isEditingBudget ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={newBudgetInput}
                  onChange={(e) => setNewBudgetInput(e.target.value)}
                  className="w-28 px-2.5 py-1 text-base font-bold bg-white text-slate-900 border-2 border-indigo-500 rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveBudget}
                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setNewBudgetInput(budget);
                    setIsEditingBudget(false);
                  }}
                  className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-3xl font-black text-slate-900">
                ₹{monthlyBudget.toLocaleString()}
              </div>
            )}

            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2.5 overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetPercent > 90 ? 'bg-rose-500' : budgetPercent > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
              {budgetPercent}% used with {daysRemaining} days remaining
            </span>
          </div>

          {/* Card 3: Safe to Spend Today */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Safe to spend today
            </span>
            <div className={`text-3xl font-black ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹{safeDailySpend.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              You usually spend ~₹{dailyBurn}/day
            </p>
          </div>
        </div>

        {/* 3. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs lg:col-span-2">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight mb-1">
              Spending Over the Last 7 Days
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">See which days you spent the most</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Spent']}
                    contentStyle={{ borderRadius: '14px', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Where Your Money Went
                </h3>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Tag
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Breakdown by category</p>

              {donutData.length > 0 ? (
                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => [`₹${val.toLocaleString()}`, 'Total']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', color: '#0f172a' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">No expenses logged yet</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              {donutData.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Recent Purchases List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Recent Purchases</h3>
              <p className="text-xs text-slate-500 font-medium">Your recent spending history</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>

          {/* Search and Filters Bar with Explicit Dark Text */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search food, coffee, metro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedPaymentFilter}
              onChange={(e) => setSelectedPaymentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            >
              <option value="ALL">All Payment Types</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          {/* Feed List */}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500 font-medium">Loading your records...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-semibold text-slate-700">No purchases found.</p>
              <p className="text-xs mt-1">Tap "+ Add Item" above to record your first expense.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredExpenses.map((item) => (
                <div key={item._id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: item.category?.color || '#6366f1' }}
                    >
                      {(item.category?.name || 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                        {item.title || item.description}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-slate-600">
                          {item.category?.name || 'General'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatFriendlyDate(item.date)} via {item.paymentMethod || 'UPI'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-base">
                      -₹{Number(item.amount || 0).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(item._id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 relative">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">
              {editingExpense ? 'Edit Purchase' : 'Add New Purchase'}
            </h3>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What did you spend on?
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Chai, Groceries, Metro ticket"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    placeholder="e.g. 150"
                    value={formData.amount}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      + New
                    </button>
                  </div>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paid via
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer shadow-md shadow-indigo-100"
                >
                  {editingExpense ? 'Save Changes' : 'Add to List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Create New Category
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gym, Snacks, Fuel"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Pick a Color Tag
                </label>
                
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFormData((prev) => ({ ...prev, color: c }))}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs"
                      style={{ backgroundColor: c }}
                    >
                      {categoryFormData.color.toLowerCase() === c.toLowerCase() && (
                        <Check className="w-4 h-4 text-white stroke-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer shadow-sm"
                >
                  {savingCategory ? 'Creating...' : 'Save Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}