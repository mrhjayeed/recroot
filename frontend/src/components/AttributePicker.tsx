import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, Tag, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface AttributeItem {
  id: string;
  name: string;
  type: string;
  optionsJson: string;
  category: {
    id: string;
    name: string;
  };
}

interface AttributePickerProps {
  onSelectAttribute: (attr: AttributeItem) => void;
  selectedAttributeIds?: string[];
}

export const AttributePicker: React.FC<AttributePickerProps> = ({
  onSelectAttribute,
  selectedAttributeIds = [],
}) => {
  const { authHeader } = useAuth();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [prefixQuery, setPrefixQuery] = useState('');
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [recentAttributes, setRecentAttributes] = useState<AttributeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchRecent();
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [selectedCategory, prefixQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/attributes/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/attributes?recent=true');
      if (res.ok) {
        const data = await res.json();
        setRecentAttributes(data.attributes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (prefixQuery.trim()) params.append('prefix', prefixQuery.trim());

      const res = await fetch(`/api/attributes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttributes(data.attributes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-sky-500" />
          <span>Reusable Attribute Library Picker</span>
        </h4>
      </div>

      {/* Lookup by Prefix Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={prefixQuery}
          onChange={(e) => setPrefixQuery(e.target.value)}
          placeholder="Lookup attribute by name prefix (e.g. 'Eng', 'GPA')..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
        />
      </div>

      {/* Category Filtering Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedCategory('')}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            selectedCategory === ''
              ? 'bg-sky-600 text-white border-sky-600 font-semibold'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selectedCategory === cat.id
                ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Recently Used Attributes */}
      {recentAttributes.length > 0 && !prefixQuery && !selectedCategory && (
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Recently Added Attributes:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentAttributes.map((attr) => {
              const isSelected = selectedAttributeIds.includes(attr.id);
              return (
                <button
                  key={attr.id}
                  onClick={() => onSelectAttribute(attr)}
                  disabled={isSelected}
                  className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-sky-500" />}
                  <span>{attr.name}</span>
                  <span className="text-[10px] text-slate-400">({attr.type})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Result Attributes Grid */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-xs text-slate-400 p-2">Loading attributes...</div>
        ) : attributes.length === 0 ? (
          <div className="text-xs text-slate-400 p-2">No matching attributes found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attributes.map((attr) => {
              const isSelected = selectedAttributeIds.includes(attr.id);
              return (
                <div
                  key={attr.id}
                  onClick={() => !isSelected && onSelectAttribute(attr)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 opacity-80 cursor-default'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{attr.name}</div>
                    <div className="text-[10px] text-slate-400">{attr.category?.name} • <span className="font-mono text-sky-600 dark:text-sky-400">{attr.type}</span></div>
                  </div>
                  {isSelected ? (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <span className="text-sky-600 hover:underline font-semibold flex items-center gap-0.5">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
