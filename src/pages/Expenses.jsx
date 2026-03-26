import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createExpense, updateExpense, deleteExpense, updateVacation, importCategories, getVacations } from '../utils/db';
import { useVacation } from '../contexts/VacationContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit3, Filter, ArrowUpDown, Search, Tag, X, Check, ChevronDown, Upload, ArrowUp, ArrowDown } from 'lucide-react';

const currencySymbols = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', JPY: '¥', TRY: '₺', THB: '฿', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł', CZK: 'Kč', HUF: 'Ft', HRK: 'kn', BGN: 'лв', RON: 'lei' };

export default function Expenses() {
  const { currentVacation, expenses, refreshExpenses, refreshVacation, vacations } = useVacation();
  const { currentUser } = useAuth();

  // Quick add state
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // List state
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterPaidBy, setFilterPaidBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Edit state
  const [editExpense, setEditExpense] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const inputRefs = useRef({});

  const vf = currentVacation?.settings?.visibleFields || {};
  const sharedMode = currentVacation?.settings?.sharedMode;
  const categories = currentVacation?.categories || [];
  const participants = currentVacation?.settings?.participants || [];
  const exchangeRates = currentVacation?.settings?.exchangeRates || { EUR: 1 };
  const defaultCurrency = currentVacation?.settings?.defaultExchangeRate || 'EUR';

  const getFields = useCallback(() => {
    const fields = [{ key: 'name', label: 'Ausgabe', type: 'text' }];
    if (vf.amount !== false) fields.push({ key: 'amount', label: 'Betrag', type: 'number' });
    if (vf.currency !== false) fields.push({ key: 'currency', label: 'Währung', type: 'currency' });
    if (vf.category !== false) fields.push({ key: 'category', label: 'Kategorie', type: 'category' });
    if (vf.date !== false) fields.push({ key: 'date', label: 'Datum', type: 'date' });
    if (vf.time) fields.push({ key: 'time', label: 'Uhrzeit', type: 'time' });
    if (vf.note) fields.push({ key: 'note', label: 'Notiz', type: 'text' });
    if (sharedMode && vf.paidBy !== false) fields.push({ key: 'paidBy', label: 'Bezahlt von', type: 'paidBy' });
    if (sharedMode && vf.paidFor !== false) fields.push({ key: 'paidFor', label: 'Bezahlt für', type: 'paidFor' });
    return fields;
  }, [vf, sharedMode]);

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      name: '', amount: '', currency: defaultCurrency, exchangeRate: exchangeRates[defaultCurrency] || 1,
      category: '', date: today, time: '', note: '', paidBy: participants[0] || '', paidFor: [...participants],
    });
    setStep(0);
    setCategorySearch('');
  };

  useEffect(() => { resetForm(); }, [currentVacation?.id]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const fields = getFields();
      if (step < fields.length - 1) {
        setStep(step + 1);
        setTimeout(() => {
          const nextField = fields[step + 1];
          inputRefs.current[nextField.key]?.focus();
        }, 50);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (!currentVacation) return;
    const data = { ...formData };
    if (!data.name && !data.amount) return;
    if (!data.date) data.date = new Date().toISOString().split('T')[0];
    if (!data.exchangeRate) data.exchangeRate = exchangeRates[data.currency] || 1;
    await createExpense(currentVacation.id, data);
    await refreshExpenses();
    resetForm();
    setShowAddForm(false);
    setTimeout(() => { setShowAddForm(true); inputRefs.current['name']?.focus(); }, 100);
  };

  const handleEdit = async () => {
    if (!editExpense) return;
    await updateExpense(editExpense.id, editData);
    await refreshExpenses();
    setEditExpense(null);
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    await refreshExpenses();
    setDeleteConfirm(null);
  };

  const addCategory = async (cat) => {
    if (!currentVacation || categories.includes(cat)) return;
    await updateVacation(currentVacation.id, { categories: [...categories, cat] });
    await refreshVacation();
  };

  const handleImport = async (fromVacId) => {
    await importCategories(fromVacId, currentVacation.id);
    await refreshVacation();
    setShowImportModal(false);
  };

  // Filter and sort expenses
  const filteredExpenses = (expenses || []).filter(exp => {
    if (searchText && !exp.name?.toLowerCase().includes(searchText.toLowerCase()) && !exp.category?.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (filterCategory.length > 0 && !filterCategory.includes(exp.category)) return false;
    if (filterPaidBy && exp.paidBy !== filterPaidBy) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortBy] || '', vb = b[sortBy] || '';
    if (sortBy === 'amount') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredCategories = categories.filter(c =>
    c.toLowerCase().includes((categorySearch || '').toLowerCase())
  );

  const formatAmount = (exp) => {
    const sym = currencySymbols[exp.currency] || exp.currency || '€';
    return `${sym} ${parseFloat(exp.amount || 0).toFixed(2)}`;
  };

  if (!currentVacation) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 48, marginBottom: 16 }}>✈️</motion.div>
        <p style={{ fontSize: 16 }}>Bitte erstelle zuerst einen Urlaub im Reiter "Urlaube"</p>
      </div>
    );
  }

  const s = {
    page: { padding: '16px' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: 700, color: '#0c4a6e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
    card: { background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 12, border: '1px solid #e2e8f0' },
    input: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    btn: { padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
    btnPrimary: { background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', color: '#fff' },
    btnDanger: { background: '#fee2e2', color: '#ef4444' },
    btnGhost: { background: 'transparent', color: '#64748b', padding: '8px 12px' },
    label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modal: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, maxHeight: '85vh', overflow: 'auto' },
    fab: { position: 'fixed', bottom: 90, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', color: '#fff', border: 'none', boxShadow: '0 4px 20px rgba(14,165,233,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
    expenseCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fff', borderRadius: 14, marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', cursor: 'pointer' },
    badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f0f9ff', color: '#0ea5e9' },
    filterBar: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' },
    select: { padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, background: '#f8fafc', outline: 'none', cursor: 'pointer' },
  };

  return (
    <div style={s.page}>
      {/* Quick Add Button */}
      {!showAddForm && (
        <motion.button
          style={s.fab}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { resetForm(); setShowAddForm(true); }}
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* Quick Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            style={{ ...s.card, overflow: 'hidden', borderColor: '#0ea5e9', borderWidth: 2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0c4a6e' }}>Neue Ausgabe</h3>
              <button onClick={() => setShowAddForm(false)} style={{ ...s.btnGhost, padding: 4 }}><X size={20} /></button>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {getFields().map((f, i) => (
                <div key={f.key} style={{
                  flex: 1, height: 3, borderRadius: 3,
                  background: i <= step ? '#0ea5e9' : '#e2e8f0',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            {getFields().map((field, idx) => (
              <motion.div
                key={field.key}
                initial={false}
                animate={{ opacity: idx <= step ? 1 : 0.3, height: idx <= step ? 'auto' : 0, marginBottom: idx <= step ? 12 : 0 }}
                style={{ overflow: idx <= step ? 'visible' : 'hidden' }}
              >
                <label style={s.label}>{field.label}</label>

                {field.type === 'currency' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      ref={el => inputRefs.current[field.key] = el}
                      value={formData.currency || defaultCurrency}
                      onChange={e => {
                        const cur = e.target.value;
                        setFormData(p => ({ ...p, currency: cur, exchangeRate: exchangeRates[cur] || 1 }));
                      }}
                      onKeyDown={handleKeyDown}
                      style={{ ...s.select, flex: 1 }}
                    >
                      {Object.keys(exchangeRates).map(c => (
                        <option key={c} value={c}>{c} {currencySymbols[c] ? `(${currencySymbols[c]})` : ''}</option>
                      ))}
                    </select>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="Wechselkurs"
                        value={formData.exchangeRate || ''}
                        onChange={e => setFormData(p => ({ ...p, exchangeRate: e.target.value }))}
                        style={{ ...s.input, fontSize: 13 }}
                      />
                    </div>
                  </div>
                ) : field.type === 'category' ? (
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={el => inputRefs.current[field.key] = el}
                      type="text"
                      placeholder="Kategorie eingeben..."
                      value={categorySearch || formData.category || ''}
                      onChange={e => {
                        setCategorySearch(e.target.value);
                        setFormData(p => ({ ...p, category: e.target.value }));
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && categorySearch && !categories.includes(categorySearch)) {
                          addCategory(categorySearch);
                        }
                        handleKeyDown(e);
                      }}
                      style={s.input}
                    />
                    <AnimatePresence>
                      {showCategoryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                            background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            border: '1px solid #e2e8f0', maxHeight: 200, overflow: 'auto', marginTop: 4,
                          }}
                        >
                          {filteredCategories.map(cat => (
                            <div
                              key={cat}
                              onClick={() => {
                                setFormData(p => ({ ...p, category: cat }));
                                setCategorySearch(cat);
                                setShowCategoryDropdown(false);
                              }}
                              style={{
                                padding: '10px 16px', cursor: 'pointer', fontSize: 14,
                                borderBottom: '1px solid #f1f5f9',
                                background: formData.category === cat ? '#f0f9ff' : 'transparent',
                              }}
                              onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                              onMouseLeave={e => e.target.style.background = formData.category === cat ? '#f0f9ff' : 'transparent'}
                            >
                              {cat}
                            </div>
                          ))}
                          {categorySearch && !categories.includes(categorySearch) && (
                            <div
                              onClick={() => { addCategory(categorySearch); setShowCategoryDropdown(false); }}
                              style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: '#0ea5e9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <Plus size={14} /> "{categorySearch}" hinzufügen
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : field.type === 'paidBy' ? (
                  <select
                    ref={el => inputRefs.current[field.key] = el}
                    value={formData.paidBy || ''}
                    onChange={e => setFormData(p => ({ ...p, paidBy: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    style={s.select}
                  >
                    <option value="">-- Wählen --</option>
                    {participants.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : field.type === 'paidFor' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {participants.map(p => (
                      <label key={p} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                        borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                        background: (formData.paidFor || []).includes(p) ? '#e0f2fe' : '#f1f5f9',
                        color: (formData.paidFor || []).includes(p) ? '#0284c7' : '#64748b',
                        border: `2px solid ${(formData.paidFor || []).includes(p) ? '#0ea5e9' : 'transparent'}`,
                        transition: 'all 0.2s',
                      }}>
                        <input
                          type="checkbox"
                          checked={(formData.paidFor || []).includes(p)}
                          onChange={e => {
                            const cur = formData.paidFor || [];
                            setFormData(prev => ({
                              ...prev,
                              paidFor: e.target.checked ? [...cur, p] : cur.filter(x => x !== p),
                            }));
                          }}
                          style={{ display: 'none' }}
                        />
                        {(formData.paidFor || []).includes(p) && <Check size={14} />}
                        {p}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    ref={el => inputRefs.current[field.key] = el}
                    type={field.type}
                    step={field.type === 'number' ? '0.01' : undefined}
                    placeholder={field.label}
                    value={formData[field.key] || ''}
                    onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (idx > step) setStep(idx); }}
                    style={s.input}
                  />
                )}
              </motion.div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                style={{ ...s.btn, ...s.btnPrimary, flex: 1 }}
              >
                <Check size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Speichern
              </motion.button>
              <button onClick={() => setShowAddForm(false)} style={{ ...s.btn, background: '#f1f5f9', color: '#64748b' }}>
                Abbrechen
              </button>
            </div>

            {/* Import categories */}
            <button onClick={() => setShowImportModal(true)} style={{ ...s.btnGhost, marginTop: 8, fontSize: 13, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Upload size={14} /> Kategorien importieren
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Sort Bar */}
      <div style={s.section}>
        <div style={s.filterBar}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              placeholder="Suchen..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ ...s.input, paddingLeft: 36, padding: '10px 14px 10px 36px' }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              ...s.btn, padding: '10px 14px',
              background: showFilters || filterCategory.length > 0 ? '#e0f2fe' : '#f1f5f9',
              color: showFilters || filterCategory.length > 0 ? '#0284c7' : '#64748b',
            }}
          >
            <Filter size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            style={{ ...s.btn, padding: '10px 14px', background: '#f1f5f9', color: '#64748b' }}
          >
            {sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ ...s.card, padding: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Sortieren nach</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[['date', 'Datum'], ['name', 'Name'], ['amount', 'Betrag'], ['category', 'Kategorie'], ['paidBy', 'Bezahlt von']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        style={{
                          ...s.badge, cursor: 'pointer', border: 'none',
                          background: sortBy === key ? '#0ea5e9' : '#f0f9ff',
                          color: sortBy === key ? '#fff' : '#0ea5e9',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Kategorie</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(prev =>
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        )}
                        style={{
                          ...s.badge, cursor: 'pointer', border: 'none',
                          background: filterCategory.includes(cat) ? '#0ea5e9' : '#f0f9ff',
                          color: filterCategory.includes(cat) ? '#fff' : '#0ea5e9',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {sharedMode && (
                  <div>
                    <label style={s.label}>Bezahlt von</label>
                    <select value={filterPaidBy} onChange={e => setFilterPaidBy(e.target.value)} style={s.select}>
                      <option value="">Alle</option>
                      {participants.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {(filterCategory.length > 0 || filterPaidBy) && (
                  <button
                    onClick={() => { setFilterCategory([]); setFilterPaidBy(''); }}
                    style={{ ...s.btnGhost, color: '#ef4444', marginTop: 8, fontSize: 13 }}
                  >
                    <X size={14} style={{ marginRight: 4 }} /> Filter zurücksetzen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expense Count */}
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, paddingLeft: 4 }}>
        {filteredExpenses.length} {filteredExpenses.length === 1 ? 'Ausgabe' : 'Ausgaben'}
        {filterCategory.length > 0 && ` (gefiltert)`}
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 40, marginBottom: 12 }}>
            🧾
          </motion.div>
          <p style={{ fontSize: 15 }}>Keine Ausgaben vorhanden</p>
          <p style={{ fontSize: 13 }}>Tippe auf + um eine Ausgabe hinzuzufügen</p>
        </motion.div>
      ) : (
        <div>
          {filteredExpenses.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={s.expenseCard}
              onClick={() => { setEditExpense(exp); setEditData({ ...exp }); }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exp.name || 'Ohne Name'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {exp.category && <span style={s.badge}>{exp.category}</span>}
                  {exp.date && <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(exp.date).toLocaleDateString('de-DE')}</span>}
                  {sharedMode && exp.paidBy && <span style={{ fontSize: 12, color: '#94a3b8' }}>von {exp.paidBy}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0c4a6e' }}>{formatAmount(exp)}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(exp.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={s.overlay} onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={s.modal} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Ausgabe löschen?</h3>
              <p style={{ color: '#64748b', marginBottom: 20 }}>Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleDelete(deleteConfirm)} style={{ ...s.btn, ...s.btnDanger, flex: 1 }}>Löschen</button>
                <button onClick={() => setDeleteConfirm(null)} style={{ ...s.btn, background: '#f1f5f9', color: '#64748b', flex: 1 }}>Abbrechen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={s.overlay} onClick={() => setEditExpense(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Ausgabe bearbeiten</h3>
                <button onClick={() => setEditExpense(null)} style={{ ...s.btnGhost, padding: 4 }}><X size={20} /></button>
              </div>

              {[
                { key: 'name', label: 'Ausgabe', type: 'text' },
                { key: 'amount', label: 'Betrag', type: 'number' },
                { key: 'category', label: 'Kategorie', type: 'text' },
                { key: 'date', label: 'Datum', type: 'date' },
                { key: 'time', label: 'Uhrzeit', type: 'time' },
                { key: 'note', label: 'Notiz', type: 'text' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 14 }}>
                  <label style={s.label}>{field.label}</label>
                  <input
                    type={field.type}
                    step={field.type === 'number' ? '0.01' : undefined}
                    value={editData[field.key] || ''}
                    onChange={e => setEditData(p => ({ ...p, [field.key]: e.target.value }))}
                    style={s.input}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Währung</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={editData.currency || 'EUR'} onChange={e => setEditData(p => ({ ...p, currency: e.target.value, exchangeRate: exchangeRates[e.target.value] || 1 }))} style={{ ...s.select, flex: 1 }}>
                    {Object.keys(exchangeRates).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" step="any" value={editData.exchangeRate || ''} onChange={e => setEditData(p => ({ ...p, exchangeRate: e.target.value }))} placeholder="Kurs" style={{ ...s.input, flex: 1 }} />
                </div>
              </div>

              {sharedMode && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={s.label}>Bezahlt von</label>
                    <select value={editData.paidBy || ''} onChange={e => setEditData(p => ({ ...p, paidBy: e.target.value }))} style={s.select}>
                      <option value="">--</option>
                      {participants.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={s.label}>Bezahlt für</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {participants.map(p => (
                        <label key={p} style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                          borderRadius: 10, cursor: 'pointer', fontSize: 13,
                          background: (editData.paidFor || []).includes(p) ? '#e0f2fe' : '#f1f5f9',
                          color: (editData.paidFor || []).includes(p) ? '#0284c7' : '#64748b',
                        }}>
                          <input
                            type="checkbox"
                            checked={(editData.paidFor || []).includes(p)}
                            onChange={e => {
                              const cur = editData.paidFor || [];
                              setEditData(prev => ({ ...prev, paidFor: e.target.checked ? [...cur, p] : cur.filter(x => x !== p) }));
                            }}
                            style={{ display: 'none' }}
                          />
                          {(editData.paidFor || []).includes(p) && <Check size={12} />}
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleEdit} style={{ ...s.btn, ...s.btnPrimary, flex: 1 }}>Speichern</motion.button>
                <button onClick={() => setEditExpense(null)} style={{ ...s.btn, background: '#f1f5f9', color: '#64748b' }}>Abbrechen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Categories Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={s.overlay} onClick={() => setShowImportModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={s.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Kategorien importieren</h3>
                <button onClick={() => setShowImportModal(false)} style={{ ...s.btnGhost, padding: 4 }}><X size={20} /></button>
              </div>
              {vacations.filter(v => v.id !== currentVacation?.id).length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>Keine anderen Urlaube vorhanden</p>
              ) : (
                vacations.filter(v => v.id !== currentVacation?.id).map(vac => (
                  <div key={vac.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 500 }}>{vac.name}</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleImport(vac.id)}
                      style={{ ...s.btn, ...s.btnPrimary, padding: '8px 16px', fontSize: 13 }}
                    >
                      <Upload size={14} style={{ marginRight: 4 }} /> Importieren
                    </motion.button>
                  </div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
