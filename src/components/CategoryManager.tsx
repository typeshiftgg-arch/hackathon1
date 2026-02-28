import React, { useState, useEffect } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import axios from 'axios';

export default function CategoryManager({ userId, onClose }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');

  useEffect(() => {
    loadCategories();
  }, [userId]);

  const loadCategories = async () => {
    try {
      const res = await axios.get(`/api/categories/${userId}`);
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!newCatName) return;
    try {
      await axios.post('/api/categories', { userId, name: newCatName.toUpperCase(), icon: newCatIcon });
      setNewCatName('');
      setNewCatIcon('📦');
      loadCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/categories/${id}`);
      loadCategories();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Manage Categories</h2>
        <button onClick={onClose}><X className="w-6 h-6" /></button>
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          value={newCatIcon}
          onChange={e => setNewCatIcon(e.target.value)}
          className="w-12 bg-slate-800 border border-slate-700 rounded-xl text-center text-xl"
          placeholder="Icon"
        />
        <input 
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white"
          placeholder="New Category Name"
        />
        <button onClick={handleAdd} className="bg-blue-600 p-3 rounded-xl text-white"><Plus className="w-6 h-6" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
            </div>
            {!cat.isDefault && (
              <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
