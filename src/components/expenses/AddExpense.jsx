import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { parseNaturalLanguage } from '../../utils/aiService';
import { toast } from '../common/Toast';
import { DollarSign, Calendar, FileText, Tag, Check, Repeat, Upload, X, Wand2, Paperclip } from 'lucide-react';

export default function AddExpense({ onClose, onAdd, editExpense }) {
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || '');
  const [description, setDescription] = useState(editExpense?.description || '');
  const [categoryId, setCategoryId] = useState(editExpense?.category_id || '');
  const [date, setDate] = useState(editExpense?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editExpense?.notes || '');
  const [isRecurring, setIsRecurring] = useState(editExpense?.is_recurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState(editExpense?.recurring_frequency || 'monthly');
  const [loading, setLoading] = useState(false);
  const [nlInput, setNlInput] = useState('');
  const [showNlInput, setShowNlInput] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(editExpense?.attachment_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load categories');
    } else {
      setCategories(data || []);
      if (!categoryId && data?.length > 0) {
        setCategoryId(data[0].id);
      }
    }
  };

  const handleNlParse = () => {
    const parsed = parseNaturalLanguage(nlInput);
    if (parsed) {
      if (parsed.amount) setAmount(parsed.amount.toString());
      if (parsed.description) setDescription(parsed.description);
      if (parsed.suggestedCategory) {
        const cat = categories.find(c => c.name === parsed.suggestedCategory);
        if (cat) setCategoryId(cat.id);
      }
      setShowNlInput(false);
      setNlInput('');
      toast.success('Expense parsed from natural language');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async () => {
    if (!attachmentFile) return null;

    setUploading(true);
    const fileExt = attachmentFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('expense-attachments')
        .upload(filePath, attachmentFile);

      if (uploadError) {
        console.log('Upload skipped - storage bucket may not be configured');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('expense-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.log('File upload skipped:', err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let attachmentUrl = editExpense?.attachment_url || null;

      if (attachmentFile) {
        attachmentUrl = await uploadFile();
      }

      const expenseData = {
        amount: parseFloat(amount),
        description,
        category_id: categoryId,
        date,
        notes: notes || null,
        attachment_url: attachmentUrl,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : null,
      };

      let error;
      if (editExpense) {
        ({ error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editExpense.id));
      } else {
        ({ error } = await supabase
          .from('expenses')
          .insert([expenseData]));
      }

      if (error) throw error;

      toast.success(editExpense ? 'Expense updated' : 'Expense added');
      onAdd();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {editExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!showNlInput && (
            <button
              type="button"
              onClick={() => setShowNlInput(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition"
            >
              <Wand2 className="w-5 h-5" />
              Try Natural Language Input
            </button>
          )}

          {showNlInput && (
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your expense (e.g., "spent $50 on groceries yesterday")
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nlInput}
                  onChange={(e) => setNlInput(e.target.value)}
                  placeholder="spent $50 on groceries yesterday"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleNlParse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Parse
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowNlInput(false)}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel natural language input
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What did you spend on?"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes..."
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
            <div className="mt-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                <Upload className="w-5 h-5" />
                {attachmentFile ? 'Change File' : 'Upload Receipt/Attachment'}
              </button>

              {attachmentPreview && (
                <div className="mt-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {attachmentFile?.name || 'Existing attachment'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentFile(null);
                      setAttachmentPreview(null);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <Repeat className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">This is a recurring expense</span>
            </label>

            {isRecurring && (
              <div className="mt-3 ml-7">
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading || uploading ? 'Saving...' : editExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
