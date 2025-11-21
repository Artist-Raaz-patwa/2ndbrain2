
import { Note, Transaction, CalendarEvent, Card, Contact, Habit, HabitLog, Project, Task, Subtask } from '../types';

const STORAGE_KEYS = {
  NOTES: '2ndbrain_notes',
  CALENDAR: '2ndbrain_calendar',
  WALLET: '2ndbrain_wallet',
  CARDS: '2ndbrain_cards',
  CURRENCY: '2ndbrain_currency',
  CONTACTS: '2ndbrain_contacts',
  HABITS: '2ndbrain_habits',
  HABIT_LOGS: '2ndbrain_habit_logs',
  PROJECTS: '2ndbrain_projects',
  TASKS: '2ndbrain_tasks'
};

type Listener = () => void;

class DataManager {
  private listeners: Listener[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([{
        id: 'welcome-note',
        title: 'Welcome to 2ndBrain',
        content: 'This is your new productivity space. commands:\n- "Add note: Buy milk"\n- "Add event: Meeting tomorrow"\n- "Expense: Coffee $5"',
        date: new Date().toLocaleDateString(),
        notebook: 'General'
      }]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CALENDAR)) {
      localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WALLET)) {
      localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CARDS)) {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENCY)) {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, 'USD');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HABITS)) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HABIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    }
  }

  // Observer Pattern
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // --- Currency ---

  getCurrency(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'USD';
  }

  setCurrency(currency: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    this.notify();
  }

  getCurrencySymbol(): string {
    const currency = this.getCurrency();
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      default: return '$';
    }
  }

  // --- Notes ---

  getNotes(): Note[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  }

  saveNote(content: string, notebook: string = 'General', titleStr?: string): Note {
    const notes = this.getNotes();
    // If title provided, use it. Otherwise derive from content.
    const title = titleStr || content.split('\n')[0].substring(0, 40).trim() || 'Untitled Note';
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: title,
      content: content,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      notebook: notebook
    };

    notes.unshift(newNote);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    this.notify();
    return newNote;
  }
  
  updateNote(updatedNote: Note) {
    let notes = this.getNotes();
    notes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    this.notify();
  }
  
  deleteNote(id: string) {
    let notes = this.getNotes();
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    this.notify();
  }

  // --- Calendar ---

  getCalendarEvents(): CalendarEvent[] {
    const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
    return data ? JSON.parse(data) : [];
  }

  addCalendarEvent(date: string, title: string): CalendarEvent {
    const events = this.getCalendarEvents();
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date,
      title
    };

    events.push(newEvent);
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(events));
    this.notify();
    return newEvent;
  }

  // --- Habits & Productivity ---

  getHabits(): Habit[] {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  }

  addHabit(title: string) {
    const habits = this.getHabits();
    habits.push({ id: Date.now().toString(), title, createdAt: Date.now() });
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    this.notify();
  }
  
  updateHabit(id: string, newTitle: string) {
      let habits = this.getHabits();
      habits = habits.map(h => h.id === id ? { ...h, title: newTitle } : h);
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
      this.notify();
  }

  deleteHabit(id: string) {
    let habits = this.getHabits();
    habits = habits.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    this.notify();
  }

  getHabitLogs(): HabitLog {
    const data = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
    return data ? JSON.parse(data) : {};
  }

  toggleHabit(date: string, habitId: string) {
    const logs = this.getHabitLogs();
    if (!logs[date]) logs[date] = [];

    if (logs[date].includes(habitId)) {
      logs[date] = logs[date].filter(id => id !== habitId);
    } else {
      logs[date].push(habitId);
    }

    localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
    this.notify();
  }

  getDailyProductivity(date: string): number {
    const habits = this.getHabits();
    if (habits.length === 0) return 0;
    
    const logs = this.getHabitLogs();
    const completed = logs[date] || [];
    
    return completed.length / habits.length; // Returns 0.0 to 1.0
  }

  getHabitStats() {
    const habits = this.getHabits();
    const logs = this.getHabitLogs();
    
    // 1. Completion Count per Habit (Frequency)
    const habitCounts: Record<string, number> = {};
    habits.forEach(h => habitCounts[h.id] = 0);
    
    Object.values(logs).forEach(completedIds => {
      completedIds.forEach(id => {
        if (habitCounts[id] !== undefined) habitCounts[id]++;
      });
    });

    const barData = habits.map(h => ({
      name: h.title,
      count: habitCounts[h.id],
      fullMark: Math.max(...Object.values(habitCounts), 10)
    }));

    // 2. Consistency over last 14 days
    const lineData = [];
    const today = new Date();
    for(let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const score = this.getDailyProductivity(dateStr);
      lineData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        score: Math.round(score * 100)
      });
    }

    // 3. Streaks
    const streaks = habits.map(h => {
        let streak = 0;
        const d = new Date();
        const todayKey = d.toISOString().split('T')[0];
        let checkingDate = d;
        
        if (logs[todayKey] && logs[todayKey].includes(h.id)) {
           // Included today
        } else {
           checkingDate.setDate(d.getDate() - 1);
        }

        for(let i = 0; i < 365; i++) {
            const key = checkingDate.toISOString().split('T')[0];
            if (logs[key] && logs[key].includes(h.id)) {
                streak++;
                checkingDate.setDate(checkingDate.getDate() - 1);
            } else {
                break;
            }
        }
        return { id: h.id, title: h.title, streak };
    });

    // 4. Day of Week Breakdown
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0,0,0,0,0,0,0];
    Object.keys(logs).forEach(dateKey => {
        const dayIndex = new Date(dateKey).getDay();
        dayCounts[dayIndex] += logs[dateKey].length;
    });
    const dayOfWeekData = daysOfWeek.map((day, i) => ({
        day,
        completions: dayCounts[i]
    }));

    return { barData, lineData, streaks, dayOfWeekData };
  }

  // --- Projects & Tasks (New CRM) ---

  getProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  addProject(name: string, clientName: string, deadline: string): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      clientName,
      deadline,
      status: 'Planning',
      createdAt: Date.now()
    };
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    this.notify();
    return newProject;
  }

  updateProject(project: Project) {
    let projects = this.getProjects();
    projects = projects.map(p => p.id === project.id ? project : p);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    this.notify();
  }

  deleteProject(id: string) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    // Cascade delete tasks
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.projectId !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    
    this.notify();
  }

  getTasks(projectId?: string): Task[] {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const allTasks: Task[] = data ? JSON.parse(data) : [];
    if (projectId) {
      return allTasks.filter(t => t.projectId === projectId);
    }
    return allTasks;
  }

  addTask(projectId: string, title: string, isBillable: boolean, amount: number): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      id: Date.now().toString(),
      projectId,
      title,
      isCompleted: false,
      isBillable,
      amount,
      subtasks: []
    };
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.notify();
    return newTask;
  }

  updateTask(task: Task) {
    let tasks = this.getTasks();
    
    // Handle timestamp logic: If marking complete, set time. If unchecking, clear time.
    if (task.isCompleted && !task.completedAt) {
        task.completedAt = Date.now();
    } else if (!task.isCompleted) {
        task.completedAt = undefined;
    }

    tasks = tasks.map(t => t.id === task.id ? task : t);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.notify();
  }

  deleteTask(taskId: string) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.notify();
  }

  // Helper: Calculate CRM Metrics
  getCRMMetrics() {
    const projects = this.getProjects();
    const tasks = this.getTasks();

    let totalPipelineValue = 0;
    let totalCollectedValue = 0;
    let activeProjects = 0;

    projects.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'On Hold') activeProjects++;
    });

    tasks.forEach(t => {
      if (t.isBillable) {
        totalPipelineValue += t.amount;
        if (t.isCompleted) {
          totalCollectedValue += t.amount;
        }
      }
    });

    return {
      activeProjects,
      totalProjects: projects.length,
      totalPipelineValue,
      totalCollectedValue,
      projectCompletionData: projects.map(p => {
        const pTasks = tasks.filter(t => t.projectId === p.id);
        const completed = pTasks.filter(t => t.isCompleted).length;
        return {
          name: p.name,
          progress: pTasks.length > 0 ? (completed / pTasks.length) * 100 : 0,
          value: pTasks.reduce((sum, t) => sum + (t.isBillable ? t.amount : 0), 0)
        };
      })
    };
  }

  // --- Contacts (CRM) ---

  getContacts(): Contact[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    return data ? JSON.parse(data) : [];
  }

  addContact(contact: Omit<Contact, 'id'>): Contact {
    const contacts = this.getContacts();
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString()
    };
    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    this.notify();
    return newContact;
  }

  deleteContact(id: string) {
    let contacts = this.getContacts();
    contacts = contacts.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    this.notify();
  }

  // --- Wallet & Cards ---

  getCards(): Card[] {
    const data = localStorage.getItem(STORAGE_KEYS.CARDS);
    return data ? JSON.parse(data) : [];
  }

  addCard(card: Omit<Card, 'id'>): Card {
    const cards = this.getCards();
    const newCard: Card = {
      ...card,
      id: Date.now().toString(),
      excludeFromTotals: card.excludeFromTotals || false
    };
    cards.push(newCard);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    this.notify();
    return newCard;
  }

  updateCard(updatedCard: Card) {
    let cards = this.getCards();
    cards = cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    this.notify();
  }

  deleteCard(id: string) {
    let cards = this.getCards();
    cards = cards.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    this.notify();
  }

  getNetWorth(): number {
    const cards = this.getCards();
    const total = cards.reduce((acc, card) => {
      if (card.excludeFromTotals) return acc;
      return acc + card.balance;
    }, 0);
    return Math.round(total * 100) / 100;
  }

  getTransactions(): Transaction[] {
    const data = localStorage.getItem(STORAGE_KEYS.WALLET);
    return data ? JSON.parse(data) : [];
  }

  updateWallet(amount: number, type: 'income' | 'expense', description: string = '', cardId?: string): Transaction {
    const transactions = this.getTransactions();
    const cards = this.getCards();

    let targetCardId = cardId;
    if (!targetCardId && cards.length > 0) {
        targetCardId = cards[0].id;
    }

    if (targetCardId) {
        const cardIndex = cards.findIndex(c => c.id === targetCardId);
        if (cardIndex !== -1) {
            let currentBalance = cards[cardIndex].balance;
            if (type === 'income') {
                currentBalance += amount;
            } else {
                currentBalance -= amount;
            }
            cards[cardIndex].balance = Math.round(currentBalance * 100) / 100;
            localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
        }
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      type,
      description: description || (type === 'income' ? 'Manual Deposit' : 'Manual Expense'),
      date: new Date().toISOString(),
      cardId: targetCardId
    };

    transactions.unshift(newTransaction);
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(transactions));
    this.notify();
    return newTransaction;
  }

  deleteTransaction(id: string) {
    const transactions = this.getTransactions();
    const txIndex = transactions.findIndex(t => t.id === id);
    
    if (txIndex === -1) return;

    const tx = transactions[txIndex];

    if (tx.cardId) {
        const cards = this.getCards();
        const cardIndex = cards.findIndex(c => c.id === tx.cardId);
        
        if (cardIndex !== -1) {
            let currentBalance = cards[cardIndex].balance;
            if (tx.type === 'income') {
                currentBalance -= tx.amount;
            } else {
                currentBalance += tx.amount;
            }
            cards[cardIndex].balance = Math.round(currentBalance * 100) / 100;
            localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
        }
    }

    transactions.splice(txIndex, 1);
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(transactions));
    this.notify();
  }

  // --- Analytics helpers for Charts ---

  getSystemActivity(days: number) {
    const activityMap = new Map<string, number>();
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toLocaleDateString('en-US', { weekday: 'short' });
      activityMap.set(dateKey, 0);
    }

    const increment = (date: Date) => {
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= days) {
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (activityMap.has(key)) {
           activityMap.set(key, (activityMap.get(key) || 0) + 1);
        }
      }
    };

    this.getNotes().forEach(n => {
        const ts = parseInt(n.id);
        if (!isNaN(ts) && ts > 1600000000000) increment(new Date(ts));
    });

    this.getTransactions().forEach(t => {
        increment(new Date(t.date));
    });

    this.getCalendarEvents().forEach(e => {
        increment(new Date(e.date));
    });
    
    // Also count project creation as activity
    this.getProjects().forEach(p => {
        increment(new Date(p.createdAt));
    });

    return Array.from(activityMap).map(([name, val]) => ({ name, activity: val }));
  }

  getBalanceHistory(days: number) {
     const history = [];
     const today = new Date();
     let currentBalance = this.getNetWorth();
     const transactions = this.getTransactions();
     
     transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

     for (let i = 0; i < days; i++) {
         const d = new Date(today);
         d.setDate(today.getDate() - i);
         const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
         history.unshift({ name: dayName, amount: Math.max(0, currentBalance) });

         const startOfDay = new Date(d);
         startOfDay.setHours(0,0,0,0);
         const endOfDay = new Date(d);
         endOfDay.setHours(23,59,59,999);

         const txsOnThisDay = transactions.filter(t => {
             const tDate = new Date(t.date);
             return tDate >= startOfDay && tDate <= endOfDay;
         });

         txsOnThisDay.forEach(tx => {
             const cards = this.getCards();
             const card = cards.find(c => c.id === tx.cardId);
             const isExcluded = card?.excludeFromTotals;

             if (!isExcluded) {
                if (tx.type === 'income') {
                    currentBalance -= tx.amount;
                } else {
                    currentBalance += tx.amount;
                }
             }
         });
     }
     
     return history;
  }
  
  clearAllData() {
    localStorage.clear();
    this.init();
    this.notify();
  }

  loadDemoData() {
    // Cards
    const cards: Card[] = [
      { id: 'demo_1', name: 'Main Checking', bank: 'Chase', type: 'debit', balance: 2450.50, last4: '4242', theme: 'from-zinc-800 to-zinc-900', excludeFromTotals: false },
      { id: 'demo_2', name: 'Savings', bank: 'Citi', type: 'debit', balance: 12000.00, last4: '8899', theme: 'from-blue-900 to-blue-950', excludeFromTotals: false },
      { id: 'demo_3', name: 'Emergency Cash', bank: 'N/A', type: 'cash', balance: 500.00, last4: 'N/A', theme: 'from-green-900 to-green-950', excludeFromTotals: false },
    ];
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));

    // Transactions
    const txs: Transaction[] = [
        { id: 'tx_1', amount: 3200, type: 'income', description: 'Monthly Salary', date: new Date().toISOString(), cardId: 'demo_1' },
        { id: 'tx_2', amount: 45.50, type: 'expense', description: 'Grocery Run', date: new Date(Date.now() - 86400000).toISOString(), cardId: 'demo_1' },
        { id: 'tx_3', amount: 150, type: 'expense', description: 'Electric Bill', date: new Date(Date.now() - 172800000).toISOString(), cardId: 'demo_1' }
    ];
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(txs));
    
    // Contacts
    const contacts: Contact[] = [
       { id: 'c1', name: 'Alice Freeman', role: 'CEO', company: 'Vertex Inc', status: 'Active' },
       { id: 'c2', name: 'Bob Smith', role: 'Product Lead', company: 'Nexus', status: 'Lead' }
    ];
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));

    this.notify();
  }
}

export const dataManager = new DataManager();
