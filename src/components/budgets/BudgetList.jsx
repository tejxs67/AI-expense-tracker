import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '../common/Toast';
import { DollarSign, Edit, Trash2, Target } from 'lucide-react';

export default function BudgetList() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [expensesByCategory, setExpensesByCategory] = useState({});

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchExpensesByCategory();
  }, [month, year]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data?.length > 0) {
      setCategories(data);
      if (!categoryId) setCategoryId(data[0].id);
    }
  };

  const fetchExpensesByCategory = async () => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await supabase
      .from('expenses')
      .select('category_id, amount')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (!error && data) {
      const grouped = data.reduce((acc, exp) => {
        acc[exp.category_id] = (acc[exp.category_id] || 0) + parseFloat(exp.amount);
        return acc;
      }, {});
      setExpensesByCategory(grouped);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(name, icon, color)')
      .eq('month', month)
      .eq('year', year);

    if (error) {
      toast.error('Failed to load budgets');
    } else {
      setBudgets(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const budgetData = {
        category_id: categoryId,
        amount: parseFloat(amount),
        month,
        year,
      };

      let error;
      if (editBudget) {
        ({ error } = await supabase
          .from('budgets')
          .update({ amount: budgetData.amount })
          .eq('id', editBudget.id));
      } else {
        ({ error } = await supabase
          .from('budgets')
          .insert([budgetData]));
      }

      if (error) throw error;

      toast.success(editBudget ? 'Budget updated' : 'Budget set');
      setShowModal(false);
      setEditBudget(null);
      setAmount('');
      fetchBudgets();
      fetchExpensesByCategory();
    } catch (err) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete budget');
    } else {
      toast.success('Budget deleted');
      fetchBudgets();
    }
  };

  const openEditModal = (budget) => {
    setEditBudget(budget);
    setAmount(budget.amount.toString());
    setCategoryId(budget.category_id);
    setShowModal(true);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <button
            onClick={() => {
              setEditBudget(null);
              setAmount('');
              setShowModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Set Budget
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No budgets set</h3>
          <p className="text-gray-600">Set budgets to track your spending limits!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map(budget => {
            const spent = expensesByCategory[budget.category_id] || 0;
            const budgetAmount = parseFloat(budget.amount);
            const percentage = Math.min((spent / budgetAmount) * 100, 100);

            return (
              <div key={budget.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: budget.categories?.color || '#9B59B6' }}
                    >
                      {budget.categories?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>${spent.toFixed(2)} spent</span>
                    <span>${budgetAmount.toFixed(2)} budget</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPercentageColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    ${(budgetAmount - spent).toFixed(2)} remaining
                  </span>
                  <span className={`text-sm font-semibold ${percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                    {percentage.toFixed(0)}% used
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editBudget ? 'Edit Budget' : 'Set Budget'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editBudget}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditBudget(null);
                    setAmount('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editBudget ? 'Update' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
