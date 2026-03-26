import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVacation } from '../contexts/VacationContext';
import { updateVacation } from '../utils/db';
import { calculateDebts } from '../utils/db';
import { exportSharedVacationExcel, exportSharedVacationPDF, exportAsImage } from '../utils/exportUtils';
import { Users, UserPlus, UserMinus, ArrowRight, Download, FileText, FileSpreadsheet, Image, DollarSign, ChevronDown, Check, X } from 'lucide-react';

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '1.5rem 1rem 3rem',
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '1rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#334155',
    margin: 0,
  },
  cardBody: {
    padding: '0 1.25rem 1.25rem',
  },
  participantRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  participantLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  avatar: (color) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    flexShrink: 0,
  }),
  participantName: {
    fontSize: '0.95rem',
    color: '#334155',
    fontWeight: 500,
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: '#ef444415',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  addRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  addInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    outline: 'none',
    background: '#f8fafc',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    background: '#6366f115',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.6rem 0.5rem',
    borderBottom: '2px solid #e2e8f0',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  td: {
    padding: '0.6rem 0.5rem',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
  },
  balancePositive: {
    color: '#16a34a',
    fontWeight: 700,
  },
  balanceNegative: {
    color: '#dc2626',
    fontWeight: 700,
  },
  balanceZero: {
    color: '#64748b',
    fontWeight: 600,
  },
  settlementCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '0.6rem',
    border: '1px solid #e2e8f0',
  },
  settlementName: {
    fontWeight: 600,
    color: '#334155',
    fontSize: '0.95rem',
    minWidth: '60px',
  },
  settlementAmount: {
    fontWeight: 700,
    color: '#6366f1',
    fontSize: '1rem',
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
  },
  abrechnBtn: {
    width: '100%',
    padding: '1rem',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: '0.5rem',
  },
  expandContent: {
    padding: '0.5rem 1rem 0.75rem',
    fontSize: '0.85rem',
    color: '#475569',
  },
  expenseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.35rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  exportBtnGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  exportBtn: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1rem',
    borderRadius: '10px',
    border: 'none',
    background: `${color}12`,
    color: color,
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  }),
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1.5rem',
    color: '#94a3b8',
  },
  emptyIcon: {
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#64748b',
    margin: '0 0 0.5rem',
  },
  emptyText: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    background: '#fff',
    borderRadius: '20px',
    padding: '1.75rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#1e293b',
    margin: '0 0 1.25rem',
  },
  warningText: {
    fontSize: '0.85rem',
    color: '#f59e0b',
    marginTop: '0.25rem',
    fontWeight: 500,
  },
};

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name, index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatCurrency(amount, currency = 'EUR') {
  const sym = currency === 'EUR' ? '\u20AC' : currency === 'USD' ? '$' : currency === 'GBP' ? '\u00A3' : currency;
  return `${sym}${Math.abs(amount).toFixed(2)}`;
}

export default function SharedVacation() {
  const { currentVacation, expenses, refreshVacation } = useVacation();
  const [newParticipant, setNewParticipant] = useState('');
  const [showSettlements, setShowSettlements] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [sectionsOpen, setSectionsOpen] = useState({
    participants: true,
    summary: true,
    breakdown: false,
    export: false,
  });

  const participants = currentVacation?.settings?.participants || [];
  const displayCurrency = currentVacation?.settings?.currency || 'EUR';

  const { balances, settlements } = useMemo(() => {
    if (!participants.length) return { balances: {}, settlements: [] };
    return calculateDebts(expenses, participants);
  }, [expenses, participants]);

  const personStats = useMemo(() => {
    const stats = {};
    participants.forEach(p => {
      stats[p] = { paid: 0, owes: 0, paidExpenses: [], owedExpenses: [] };
    });
    expenses.forEach(exp => {
      if (!exp.paidBy || !exp.paidFor || exp.paidFor.length === 0) return;
      const amount = parseFloat(exp.amount) || 0;
      const rate = parseFloat(exp.exchangeRate) || 1;
      const converted = amount / rate;
      const share = converted / exp.paidFor.length;

      if (stats[exp.paidBy]) {
        stats[exp.paidBy].paid += converted;
        stats[exp.paidBy].paidExpenses.push(exp);
      }
      exp.paidFor.forEach(person => {
        if (stats[person]) {
          stats[person].owes += share;
          stats[person].owedExpenses.push(exp);
        }
      });
    });
    return stats;
  }, [expenses, participants]);

  const toggleSection = (key) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddParticipant = async () => {
    const name = newParticipant.trim();
    if (!name || participants.includes(name)) return;
    const updated = [...participants, name];
    await updateVacation(currentVacation.id, {
      settings: { ...currentVacation.settings, participants: updated },
    });
    setNewParticipant('');
    await refreshVacation();
  };

  const handleRemoveParticipant = async (name) => {
    const hasExpenses = expenses.some(
      e => e.paidBy === name || (e.paidFor && e.paidFor.includes(name))
    );
    if (hasExpenses && removeConfirm !== name) {
      setRemoveConfirm(name);
      return;
    }
    const updated = participants.filter(p => p !== name);
    await updateVacation(currentVacation.id, {
      settings: { ...currentVacation.settings, participants: updated },
    });
    setRemoveConfirm(null);
    await refreshVacation();
  };

  const prepareAndExport = async (exportFn) => {
    // Temporarily show settlements and breakdown for export
    const prevSettlements = showSettlements;
    const prevSections = { ...sectionsOpen };
    setShowSettlements(true);
    setSectionsOpen(prev => ({ ...prev, summary: true, breakdown: true }));
    // Wait for render
    await new Promise(r => setTimeout(r, 400));
    await exportFn();
    // Restore state
    setShowSettlements(prevSettlements);
    setSectionsOpen(prevSections);
  };

  const handleExportPDF = () => {
    prepareAndExport(() => exportSharedVacationPDF('shared-vacation-export', `Gemeinsamer_Urlaub_${currentVacation.name || 'Export'}.pdf`));
  };

  const handleExportExcel = () => {
    exportSharedVacationExcel(expenses, settlements, participants, `Gemeinsamer_Urlaub_${currentVacation.name || 'Export'}.xlsx`);
  };

  const handleExportImage = () => {
    prepareAndExport(() => exportAsImage('shared-vacation-export', `Gemeinsamer_Urlaub_${currentVacation.name || 'Export'}.png`));
  };

  if (!currentVacation || !currentVacation.settings?.participants?.length) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <Users size={28} color="#6366f1" />
          <h1 style={styles.headerTitle}>Gemeinsamer Urlaub</h1>
        </div>
        <div style={styles.card}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Users size={48} color="#cbd5e1" />
            </div>
            <h3 style={styles.emptyTitle}>Keine Teilnehmer vorhanden</h3>
            <p style={styles.emptyText}>
              Fuge Teilnehmer in den Einstellungen hinzu, um den gemeinsamen Urlaub zu nutzen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Users size={28} color="#6366f1" />
        <h1 style={styles.headerTitle}>Gemeinsamer Urlaub</h1>
      </div>

      {/* Participant Management */}
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button style={styles.cardHeader} onClick={() => toggleSection('participants')}>
          <div style={styles.cardHeaderLeft}>
            <Users size={18} color="#6366f1" />
            <h3 style={styles.cardTitle}>Teilnehmer ({participants.length})</h3>
          </div>
          <motion.div
            animate={{ rotate: sectionsOpen.participants ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} color="#94a3b8" />
          </motion.div>
        </button>
        <AnimatePresence>
          {sectionsOpen.participants && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={styles.cardBody}>
                {participants.map((p, i) => (
                  <div key={p} style={styles.participantRow}>
                    <div style={styles.participantLeft}>
                      <div style={styles.avatar(getAvatarColor(p, i))}>
                        {getInitials(p)}
                      </div>
                      <span style={styles.participantName}>{p}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {removeConfirm === p && (
                        <motion.span
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={styles.warningText}
                        >
                          Hat Ausgaben!
                        </motion.span>
                      )}
                      <button
                        style={styles.removeBtn}
                        onClick={() => handleRemoveParticipant(p)}
                        title="Teilnehmer entfernen"
                      >
                        {removeConfirm === p ? <Check size={15} /> : <UserMinus size={15} />}
                      </button>
                      {removeConfirm === p && (
                        <button
                          style={{ ...styles.removeBtn, background: '#64748b15', color: '#64748b' }}
                          onClick={() => setRemoveConfirm(null)}
                          title="Abbrechen"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div style={styles.addRow}>
                  <input
                    style={styles.addInput}
                    type="text"
                    placeholder="Neuer Teilnehmer..."
                    value={newParticipant}
                    onChange={e => setNewParticipant(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                  />
                  <button style={styles.addBtn} onClick={handleAddParticipant} title="Hinzufugen">
                    <UserPlus size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Export wrapper */}
      <div id="shared-vacation-export">
        {/* Summary Table */}
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <button style={styles.cardHeader} onClick={() => toggleSection('summary')}>
            <div style={styles.cardHeaderLeft}>
              <DollarSign size={18} color="#10b981" />
              <h3 style={styles.cardTitle}>Übersichtstabelle</h3>
            </div>
            <motion.div
              animate={{ rotate: sectionsOpen.summary ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} color="#94a3b8" />
            </motion.div>
          </button>
          <AnimatePresence>
            {sectionsOpen.summary && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={styles.cardBody}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Teilnehmer</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Bezahlt</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Anteil</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Bilanz</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, i) => {
                          const stats = personStats[p] || { paid: 0, owes: 0 };
                          const balance = stats.paid - stats.owes;
                          const balanceStyle = balance > 0.01
                            ? styles.balancePositive
                            : balance < -0.01
                              ? styles.balanceNegative
                              : styles.balanceZero;
                          return (
                            <motion.tr
                              key={p}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                            >
                              <td style={styles.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={styles.avatar(getAvatarColor(p, i))}>
                                    {getInitials(p)}
                                  </div>
                                  <span style={{ fontWeight: 600 }}>{p}</span>
                                </div>
                              </td>
                              <td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>
                                {formatCurrency(stats.paid, displayCurrency)}
                              </td>
                              <td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>
                                {formatCurrency(stats.owes, displayCurrency)}
                              </td>
                              <td style={{ ...styles.td, textAlign: 'right', ...balanceStyle }}>
                                {balance > 0.01 ? '+' : ''}{formatCurrency(balance, displayCurrency)}
                                {balance < -0.01 && <span> </span>}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Settlement Section - shown after Abrechnen */}
        <AnimatePresence>
          {showSettlements && (
            <motion.div
              style={styles.card}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35 }}
            >
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <ArrowRight size={18} color="#8b5cf6" />
                  <h3 style={styles.cardTitle}>Ausgleichszahlungen</h3>
                </div>
                {settlements.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                    Alle Ausgaben sind ausgeglichen. Keine Zahlungen notwendig.
                  </p>
                ) : (
                  settlements.map((s, i) => (
                    <motion.div
                      key={`${s.from}-${s.to}`}
                      style={styles.settlementCard}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span style={styles.settlementName}>{s.from}</span>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <div style={{
                          height: '2px',
                          width: '40px',
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: '1px',
                        }} />
                        <ArrowRight size={16} color="#8b5cf6" />
                      </motion.div>
                      <span style={styles.settlementName}>{s.to}</span>
                      <span style={styles.settlementAmount}>
                        {formatCurrency(s.amount, displayCurrency)}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Abrechnen Button */}
      <motion.div
        style={{ marginBottom: '1rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.button
          style={styles.abrechnBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSettlements(prev => !prev)}
        >
          <DollarSign size={20} />
          {showSettlements ? 'Ausgleich ausblenden' : 'Abrechnen'}
        </motion.button>
      </motion.div>

      {/* Expense Breakdown by Person */}
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <button style={styles.cardHeader} onClick={() => toggleSection('breakdown')}>
          <div style={styles.cardHeaderLeft}>
            <FileText size={18} color="#f59e0b" />
            <h3 style={styles.cardTitle}>Ausgaben pro Person</h3>
          </div>
          <motion.div
            animate={{ rotate: sectionsOpen.breakdown ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} color="#94a3b8" />
          </motion.div>
        </button>
        <AnimatePresence>
          {sectionsOpen.breakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={styles.cardBody}>
                {participants.map((p, i) => {
                  const stats = personStats[p] || { paidExpenses: [], owedExpenses: [] };
                  const isExpanded = expandedPerson === p;
                  return (
                    <div key={p} style={{ marginBottom: '0.35rem' }}>
                      <button
                        style={styles.expandBtn}
                        onClick={() => setExpandedPerson(isExpanded ? null : p)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={styles.avatar(getAvatarColor(p, i))}>
                            {getInitials(p)}
                          </div>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{p}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={16} color="#94a3b8" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={styles.expandContent}>
                              <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                  Bezahlt:
                                </div>
                                {stats.paidExpenses.length === 0 ? (
                                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Keine Ausgaben bezahlt</div>
                                ) : (
                                  stats.paidExpenses.map((exp, j) => (
                                    <div key={j} style={styles.expenseItem}>
                                      <span>{exp.name || 'Ohne Name'}</span>
                                      <span style={{ fontWeight: 600 }}>
                                        {formatCurrency(parseFloat(exp.amount) || 0, exp.currency || displayCurrency)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                                  Beteiligt an:
                                </div>
                                {stats.owedExpenses.length === 0 ? (
                                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Keine Beteiligungen</div>
                                ) : (
                                  stats.owedExpenses.map((exp, j) => {
                                    const share = (parseFloat(exp.amount) || 0) / (exp.paidFor?.length || 1);
                                    return (
                                      <div key={j} style={styles.expenseItem}>
                                        <span>{exp.name || 'Ohne Name'} (von {exp.paidBy})</span>
                                        <span style={{ fontWeight: 600 }}>
                                          {formatCurrency(share, exp.currency || displayCurrency)}
                                        </span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>{/* End shared-vacation-export */}

      {/* Export Section */}
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <button style={styles.cardHeader} onClick={() => toggleSection('export')}>
          <div style={styles.cardHeaderLeft}>
            <Download size={18} color="#3b82f6" />
            <h3 style={styles.cardTitle}>Exportieren</h3>
          </div>
          <motion.div
            animate={{ rotate: sectionsOpen.export ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} color="#94a3b8" />
          </motion.div>
        </button>
        <AnimatePresence>
          {sectionsOpen.export && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={styles.cardBody}>
                <div style={styles.exportBtnGroup}>
                  <motion.button
                    style={styles.exportBtn('#ef4444')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleExportPDF}
                  >
                    <FileText size={16} />
                    PDF
                  </motion.button>
                  <motion.button
                    style={styles.exportBtn('#10b981')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet size={16} />
                    Excel
                  </motion.button>
                  <motion.button
                    style={styles.exportBtn('#6366f1')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleExportImage}
                  >
                    <Image size={16} />
                    Bild
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
