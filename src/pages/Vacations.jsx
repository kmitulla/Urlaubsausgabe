import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createVacation, deleteVacation, updateVacation } from '../utils/db';
import { useVacation } from '../contexts/VacationContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit3, Plane, Check, X } from 'lucide-react';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: '2rem 1rem 6rem',
    position: 'relative',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  headerIcon: {
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    borderRadius: '16px',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1rem',
  },
  card: (isSelected) => ({
    background: isSelected
      ? 'rgba(59, 130, 246, 0.12)'
      : 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: isSelected
      ? '2px solid rgba(59, 130, 246, 0.6)'
      : '1px solid rgba(255, 255, 255, 0.08)',
    padding: '1.25rem',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: isSelected
      ? '0 0 24px rgba(59, 130, 246, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 4px 16px rgba(0, 0, 0, 0.2)',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  }),
  cardInner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  cardIcon: (isSelected) => ({
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: isSelected
      ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
      : 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
  }),
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#f1f5f9',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardDate: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0.25rem 0 0',
  },
  selectedBadge: {
    display: 'inline-block',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.15)',
    borderRadius: '6px',
    padding: '0.15rem 0.5rem',
    marginTop: '0.5rem',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  cardActions: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0,
  },
  actionBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: 'none',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#94a3b8',
    transition: 'background 0.15s, color 0.15s',
  },
  fab: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
    zIndex: 50,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  modal: {
    background: '#1e293b',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 1.25rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#f1f5f9',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.25rem',
    justifyContent: 'flex-end',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    border: 'none',
    borderRadius: '10px',
    padding: '0.6rem 1.25rem',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '0.6rem 1.25rem',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  btnDanger: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '10px',
    padding: '0.6rem 1.25rem',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    background: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 0.5rem',
  },
  emptyText: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: '0 0 1.5rem',
    maxWidth: '300px',
    lineHeight: 1.5,
  },
  editInline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  editInput: {
    padding: '0.35rem 0.6rem',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    flex: 1,
    minWidth: 0,
  },
  editActionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
  },
  confirmOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.92)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    zIndex: 5,
    padding: '1rem',
  },
  confirmText: {
    fontSize: '0.9rem',
    color: '#f1f5f9',
    fontWeight: 600,
    textAlign: 'center',
  },
  confirmActions: {
    display: 'flex',
    gap: '0.5rem',
  },
};

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Vacations() {
  const { vacations, currentVacation, selectVacation, loadVacations } = useVacation();
  const { currentUser } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !currentUser) return;
    setCreating(true);
    try {
      await createVacation(currentUser.id, trimmed);
      await loadVacations();
      setNewName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
    }
    setCreating(false);
  };

  const handleDelete = async (vacationId) => {
    setDeleting(true);
    try {
      await deleteVacation(vacationId);
      await loadVacations();
      setDeletingId(null);
    } catch (err) {
      console.error('Fehler beim Loeschen:', err);
    }
    setDeleting(false);
  };

  const handleRenameStart = (vac) => {
    setEditingId(vac.id);
    setEditName(vac.name);
  };

  const handleRenameConfirm = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editingId) return;
    try {
      await updateVacation(editingId, { name: trimmed });
      await loadVacations();
    } catch (err) {
      console.error('Fehler beim Umbenennen:', err);
    }
    setEditingId(null);
    setEditName('');
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleCardClick = (vac) => {
    if (editingId === vac.id || deletingId === vac.id) return;
    selectVacation(vac.id);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <motion.div
          style={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={styles.headerIcon}>
            <Plane size={24} color="#fff" />
          </div>
          <div>
            <h1 style={styles.title}>Meine Urlaube</h1>
            <p style={styles.subtitle}>
              {vacations.length === 0
                ? 'Noch keine Urlaube vorhanden'
                : `${vacations.length} ${vacations.length === 1 ? 'Urlaub' : 'Urlaube'}`}
            </p>
          </div>
        </motion.div>

        {/* Empty State */}
        {vacations.length === 0 && (
          <motion.div
            style={styles.emptyState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              style={styles.emptyIcon}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plane size={36} color="#3b82f6" />
            </motion.div>
            <h2 style={styles.emptyTitle}>Noch keine Urlaube</h2>
            <p style={styles.emptyText}>
              Erstelle deinen ersten Urlaub, um Ausgaben zu tracken und den
              Ueberblick zu behalten.
            </p>
            <motion.button
              style={styles.btnPrimary}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateModal(true)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                Neuer Urlaub
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Vacation Grid */}
        {vacations.length > 0 && (
          <div style={styles.grid}>
            <AnimatePresence mode="popLayout">
              {vacations.map((vac, index) => {
                const isSelected = currentVacation?.id === vac.id;
                const isEditing = editingId === vac.id;
                const isConfirmingDelete = deletingId === vac.id;

                return (
                  <motion.div
                    key={vac.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={styles.card(isSelected)}
                    onClick={() => handleCardClick(vac)}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div style={styles.cardInner}>
                      <div style={styles.cardIcon(isSelected)}>
                        <Plane
                          size={20}
                          color={isSelected ? '#fff' : '#64748b'}
                        />
                      </div>

                      <div style={styles.cardContent}>
                        {isEditing ? (
                          <div style={styles.editInline} onClick={(e) => e.stopPropagation()}>
                            <input
                              style={styles.editInput}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameConfirm();
                                if (e.key === 'Escape') handleRenameCancel();
                              }}
                              autoFocus
                            />
                            <button
                              style={{ ...styles.editActionBtn, color: '#22c55e' }}
                              onClick={handleRenameConfirm}
                              title="Speichern"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              style={{ ...styles.editActionBtn, color: '#ef4444' }}
                              onClick={handleRenameCancel}
                              title="Abbrechen"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p style={styles.cardName}>{vac.name}</p>
                            <p style={styles.cardDate}>
                              Erstellt am {formatDate(vac.createdAt)}
                            </p>
                            {isSelected && (
                              <motion.span
                                style={styles.selectedBadge}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                              >
                                Ausgewaehlt
                              </motion.span>
                            )}
                          </>
                        )}
                      </div>

                      {!isEditing && (
                        <div
                          style={styles.cardActions}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <motion.button
                            style={styles.actionBtn}
                            whileHover={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRenameStart(vac)}
                            title="Umbenennen"
                          >
                            <Edit3 size={15} />
                          </motion.button>
                          <motion.button
                            style={styles.actionBtn}
                            whileHover={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeletingId(vac.id)}
                            title="Loeschen"
                          >
                            <Trash2 size={15} />
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* Delete Confirmation Overlay */}
                    <AnimatePresence>
                      {isConfirmingDelete && (
                        <motion.div
                          style={styles.confirmOverlay}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p style={styles.confirmText}>
                            Urlaub "{vac.name}" wirklich loeschen?
                          </p>
                          <div style={styles.confirmActions}>
                            <motion.button
                              style={styles.btnSecondary}
                              whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeletingId(null)}
                              disabled={deleting}
                            >
                              Abbrechen
                            </motion.button>
                            <motion.button
                              style={{
                                ...styles.btnDanger,
                                opacity: deleting ? 0.6 : 1,
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(vac.id)}
                              disabled={deleting}
                            >
                              {deleting ? 'Wird geloescht...' : 'Loeschen'}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {vacations.length > 0 && (
        <motion.button
          style={styles.fab}
          onClick={() => setShowCreateModal(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1, boxShadow: '0 12px 32px rgba(59, 130, 246, 0.5)' }}
          whileTap={{ scale: 0.92 }}
          title="Neuen Urlaub erstellen"
        >
          <Plus size={26} />
        </motion.button>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!creating) {
                setShowCreateModal(false);
                setNewName('');
              }
            }}
          >
            <motion.div
              style={styles.modal}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={styles.modalTitle}>Neuer Urlaub</h2>
              <input
                style={styles.input}
                placeholder="z.B. Mallorca 2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape' && !creating) {
                    setShowCreateModal(false);
                    setNewName('');
                  }
                }}
                autoFocus
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              />
              <div style={styles.modalActions}>
                <motion.button
                  style={styles.btnSecondary}
                  whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewName('');
                  }}
                  disabled={creating}
                >
                  Abbrechen
                </motion.button>
                <motion.button
                  style={{
                    ...styles.btnPrimary,
                    opacity: !newName.trim() || creating ? 0.5 : 1,
                  }}
                  whileHover={{ scale: newName.trim() && !creating ? 1.03 : 1 }}
                  whileTap={{ scale: newName.trim() && !creating ? 0.97 : 1 }}
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                >
                  {creating ? 'Wird erstellt...' : 'Erstellen'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
