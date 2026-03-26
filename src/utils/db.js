import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, addDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';

// ============ USERS ============

export async function getUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUser(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createUser(username, password, isAdmin = false) {
  const id = username.toLowerCase().replace(/\s+/g, '_');
  await setDoc(doc(db, 'users', id), {
    username,
    password: password || '',
    isAdmin,
    mustSetPassword: !password,
    createdAt: serverTimestamp()
  });
  return id;
}

export async function updateUser(userId, data) {
  await updateDoc(doc(db, 'users', userId), data);
}

export async function deleteUser(userId) {
  await deleteDoc(doc(db, 'users', userId));
}

export async function loginUser(username, password) {
  const users = await getUsers();
  const user = users.find(u =>
    u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) return { success: false, error: 'Benutzer nicht gefunden' };
  if (user.mustSetPassword) {
    return { success: true, user, mustSetPassword: true };
  }
  if (user.password !== password) {
    return { success: false, error: 'Falsches Passwort' };
  }
  return { success: true, user };
}

// ============ VACATIONS ============

export async function getVacations(userId) {
  const snap = await getDocs(
    query(collection(db, 'vacations'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createVacation(userId, name) {
  const ref = await addDoc(collection(db, 'vacations'), {
    userId,
    name,
    createdAt: serverTimestamp(),
    settings: {
      currency: 'EUR',
      exchangeRates: { EUR: 1 },
      defaultExchangeRate: 'EUR',
      sharedMode: false,
      participants: [],
      visibleFields: {
        date: true,
        time: true,
        category: true,
        amount: true,
        currency: true,
        note: true,
        paidBy: true,
        paidFor: true
      }
    },
    categories: ['Essen', 'Trinken', 'Transport', 'Unterkunft', 'Aktivitäten', 'Shopping', 'Sonstiges'],
    kpis: [],
    charts: []
  });
  return ref.id;
}

export async function updateVacation(vacationId, data) {
  await updateDoc(doc(db, 'vacations', vacationId), data);
}

export async function deleteVacation(vacationId) {
  const batch = writeBatch(db);
  // Delete all expenses for this vacation
  const expSnap = await getDocs(
    query(collection(db, 'expenses'), where('vacationId', '==', vacationId))
  );
  expSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'vacations', vacationId));
  await batch.commit();
}

export async function getVacation(vacationId) {
  const snap = await getDoc(doc(db, 'vacations', vacationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ============ EXPENSES ============

export async function getExpenses(vacationId) {
  const snap = await getDocs(
    query(collection(db, 'expenses'), where('vacationId', '==', vacationId), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createExpense(vacationId, data) {
  const ref = await addDoc(collection(db, 'expenses'), {
    vacationId,
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateExpense(expenseId, data) {
  await updateDoc(doc(db, 'expenses', expenseId), data);
}

export async function deleteExpense(expenseId) {
  await deleteDoc(doc(db, 'expenses', expenseId));
}

// ============ CATEGORIES ============

export async function importCategories(fromVacationId, toVacationId) {
  const fromVac = await getVacation(fromVacationId);
  const toVac = await getVacation(toVacationId);
  if (!fromVac || !toVac) return;
  const merged = [...new Set([...(toVac.categories || []), ...(fromVac.categories || [])])];
  await updateVacation(toVacationId, { categories: merged });
}

// ============ SHARED VACATION CALCULATIONS ============

export function calculateDebts(expenses, participants) {
  // Calculate how much each person paid and how much each person owes
  const balances = {};
  participants.forEach(p => { balances[p] = 0; });

  expenses.forEach(exp => {
    if (!exp.paidBy || !exp.paidFor || exp.paidFor.length === 0) return;
    const amount = parseFloat(exp.amount) || 0;
    const rate = parseFloat(exp.exchangeRate) || 1;
    const converted = amount / rate;
    const share = converted / exp.paidFor.length;

    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + converted;
    exp.paidFor.forEach(person => {
      balances[person] = (balances[person] || 0) - share;
    });
  });

  // Simplify debts
  const debtors = [];
  const creditors = [];
  Object.entries(balances).forEach(([person, balance]) => {
    if (balance < -0.01) debtors.push({ person, amount: -balance });
    else if (balance > 0.01) creditors.push({ person, amount: balance });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      settlements.push({
        from: debtors[i].person,
        to: creditors[j].person,
        amount: Math.round(amount * 100) / 100
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return { balances, settlements };
}
