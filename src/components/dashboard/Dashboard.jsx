import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, RefreshCw, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');

  useEffect(() => {
    fetchData();
  }, [selectedMonth, viewMode]);

  const fetchData = async () => {
    setLoading(true);

    let startDate, endDate;
    if (viewMode === 'month') {
      startDate = startOfMonth(selectedMonth);
      endDate = endOfMonth(selectedMonth);
    } else {
      startDate = startOfMonth(subMonths(selectedMonth, 11));
      endDate = endOfMonth(selectedMonth);
    }

    const { data: expData } = await supabase
      .from('expenses')
      .select('*, categories(name, icon, color)')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*, categories(name, icon, color)')
      .eq('month', selectedMonth.getMonth() + 1)
      .eq('year', selectedMonth.getFullYear());

    setExpenses(expData || []);
    setCategories(catData || []);
    setBudgets(budgetData || []);
    setLoading(false);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const expensesByCategory = categories.map(cat => {
    const categoryExpenses = expenses.filter(exp => exp.category_id === cat.id);
    const amount = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    return {
      name: cat.name,
      value: amount,
      color: cat.color,
      count: categoryExpenses.length
    };
  }).filter(cat => cat.value > 0);

  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const month = subMonths(selectedMonth, 11 - i);
    const monthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === month.getMonth() && expDate.getFullYear() === month.getFullYear();
    });
    return {
      month: format(month, 'MMM'),
      amount: monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    };
  });

  const budgetComparison = budgets.map(budget => {
    const spent = expenses
      .filter(exp => exp.category_id === budget.category_id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    return {
      category: budget.categories?.name || 'Unknown',
      budget: parseFloat(budget.amount),
      spent,
      remaining: Math.max(parseFloat(budget.amount) - spent, 0)
    };
  });

  const recurringExpenses = expenses.filter(exp => exp.is_recurring).slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                {viewMode === 'month' ? 'This Month' : 'This Year'}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">${totalExpenses.toFixed(2)}</div>
            <div className="text-sm opacity-90">Total Expenses</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{expenses.length}</div>
            <div className="text-sm opacity-90">Transactions</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{budgets.length}</div>
            <div className="text-sm opacity-90">Active Budgets</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{recurringExpenses.length}</div>
            <div className="text-sm opacity-90">Recurring Expenses</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expensesByCategory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Spending by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {monthlyTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {budgetComparison.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Budget vs Actual</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="budget" fill="#3B82F6" name="Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" fill="#10B981" name="Spent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {recurringExpenses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Recurring Expenses</h2>
              <div className="space-y-3">
                {recurringExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(expense.date), 'MMM d, yyyy')} - {expense.recurring_frequency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${parseFloat(expense.amount).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{expense.categories?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
