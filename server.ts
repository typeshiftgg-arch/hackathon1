import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/server/db.js';
import { BehaviorAnalysisService } from './src/server/services/BehaviorAnalysisService.js';
import { DashboardService } from './src/server/services/DashboardService.js';
import { Transaction } from './src/server/models.js';

const behaviorService = new BehaviorAnalysisService();
const dashboardService = new DashboardService();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  const apiRouter = express.Router();

  // Users
  apiRouter.post('/users', (req, res) => {
    const { userId, monthlyIncome, savingsGoal } = req.body;
    db.prepare(`INSERT OR REPLACE INTO users (userId, monthlyIncome, savingsGoal, riskScore, totalSpent) VALUES (?, ?, ?, 0, 0)`).run(userId, monthlyIncome, savingsGoal);
    res.json({ success: true });
  });

  apiRouter.get('/users/:userId', (req, res) => {
    const user = db.prepare(`SELECT * FROM users WHERE userId = ?`).get(req.params.userId);
    res.json(user || null);
  });

  apiRouter.put('/users/:userId', (req, res) => {
    const { monthlyIncome, savingsGoal } = req.body;
    db.prepare(`UPDATE users SET monthlyIncome = ?, savingsGoal = ? WHERE userId = ?`).run(monthlyIncome, savingsGoal, req.params.userId);
    res.json({ success: true });
  });

  // Transactions
  apiRouter.post('/transactions', async (req, res) => {
    const { userId, amount, category, merchant, isImpulsive, recipient, upiId, note, mood, prePaymentMemoryShown, prePaymentAction } = req.body;
    const timestamp = new Date().toISOString();
    const result = db.prepare(`INSERT INTO transactions (userId, amount, category, merchant, timestamp, isImpulsive, recipient, upiId, note, mood, prePaymentMemoryShown, prePaymentAction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, amount, category, merchant, timestamp, isImpulsive ? 1 : 0, recipient, upiId, note, mood, prePaymentMemoryShown ? 1 : 0, prePaymentAction);
    
    const tx: Transaction = {
      id: result.lastInsertRowid as number,
      userId, amount, category, merchant, timestamp, isImpulsive, recipient, upiId, note, mood, prePaymentMemoryShown, prePaymentAction
    };

    await behaviorService.processNewTransaction(tx);
    res.json(tx);
  });

  apiRouter.get('/transactions/:userId', (req, res) => {
    const txs = db.prepare(`SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC`).all(req.params.userId);
    res.json(txs);
  });

  apiRouter.post('/transactions/simulate/:userId', async (req, res) => {
    const userId = req.params.userId;
    const categories = ['FOOD', 'ENTERTAINMENT', 'SHOPPING', 'BILLS', 'TRANSPORT', 'GAMBLING', 'LUXURY'];
    const merchants = {
      FOOD: ['Zomato', 'Swiggy', 'Starbucks', 'Blinkit'],
      ENTERTAINMENT: ['Netflix', 'Hotstar', 'BookMyShow'],
      SHOPPING: ['Amazon', 'Flipkart', 'Myntra', 'AJIO'],
      BILLS: ['Electricity', 'Water', 'Internet'],
      TRANSPORT: ['Uber', 'Ola', 'Petrol'],
      GAMBLING: ['Dream11', 'Bet365', 'Casino'],
      LUXURY: ['Rolex', 'Gucci', 'Apple Store']
    };

    const notesAndMoods: any = {
      'Zomato': { note: "Ordered late night, wasn't even that hungry tbh", mood: "😐" },
      'Amazon': { note: "Bought headphones, told myself it's an investment 😅", mood: "😬" },
      'Swiggy': { note: "Too tired to cook, third time this week", mood: "😬" },
      'Dream11': { note: "Put ₹500 hoping to win big, never works", mood: "😬" },
      'Myntra': { note: "Sale was ending, bought stuff I don't need", mood: "😊" },
      'Netflix': { note: "Binge watched all weekend, worth it", mood: "🤩" },
      'Blinkit': { note: "Midnight snack run, classic mistake", mood: "😐" },
      'BookMyShow': { note: "Movie with friends, no regrets", mood: "🤩" },
      'AJIO': { note: "Late night shopping, bad idea", mood: "😬" },
      'Petrol': { note: "Monthly fuel, necessary expense", mood: "😐" }
    };

    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const merchantList = merchants[category as keyof typeof merchants];
      const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];
      
      let amount = Math.floor(Math.random() * 1000) + 100;
      if (category === 'LUXURY') amount = Math.floor(Math.random() * 20000) + 5000;
      if (category === 'GAMBLING') amount = Math.floor(Math.random() * 5000) + 500;

      const isImpulsive = Math.random() > 0.7;
      
      const txTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      if (Math.random() > 0.8) txTime.setHours(23 + Math.floor(Math.random() * 4));

      const noteData = notesAndMoods[merchant] || { note: "Standard payment", mood: "😐" };

      const tx: Transaction = {
        userId, amount, category: category as any, merchant, timestamp: txTime.toISOString(), isImpulsive,
        recipient: merchant, upiId: `${merchant.toLowerCase().replace(/\s/g, '')}@upi`, note: noteData.note, mood: noteData.mood,
        prePaymentMemoryShown: false, prePaymentAction: 'COMPLETED'
      };

      db.prepare(`INSERT INTO transactions (userId, amount, category, merchant, timestamp, isImpulsive, recipient, upiId, note, mood, prePaymentMemoryShown, prePaymentAction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(userId, amount, category, merchant, tx.timestamp, isImpulsive ? 1 : 0, tx.recipient, tx.upiId, tx.note, tx.mood, 0, tx.prePaymentAction);
      await behaviorService.processNewTransaction(tx);
    }

    res.json({ success: true, message: 'Simulated 20 transactions' });
  });

  // Dashboard
  apiRouter.get('/dashboard/:userId', (req, res) => {
    const data = dashboardService.getDashboardData(req.params.userId);
    res.json(data);
  });

  apiRouter.post('/gemini/pre-payment', async (req, res) => {
    const { category, amount, merchant, previousTxs } = req.body;
    const message = await behaviorService.geminiService.generatePrePaymentMemory(category, amount, merchant, previousTxs);
    res.json({ message });
  });

  apiRouter.post('/gemini/dna', async (req, res) => {
    const { context } = req.body;
    const dna = await behaviorService.geminiService.generateBehavioralDNA(context);
    res.json({ dna });
  });
  
  apiRouter.post('/gemini/post-payment', async (req, res) => {
    const { category, amount, goal } = req.body;
    const message = await behaviorService.geminiService.generatePostPaymentSuggestion(category, amount, goal);
    res.json({ message });
  });

  // Interventions
  apiRouter.get('/interventions/:userId', (req, res) => {
    const interventions = db.prepare(`SELECT * FROM interventions WHERE userId = ? ORDER BY triggeredAt DESC`).all(req.params.userId);
    res.json(interventions);
  });

  apiRouter.get('/interventions/:userId/active', (req, res) => {
    const interventions = db.prepare(`SELECT * FROM interventions WHERE userId = ? AND wasAcknowledged = 0 ORDER BY triggeredAt DESC`).all(req.params.userId);
    res.json(interventions);
  });

  apiRouter.put('/interventions/:id/acknowledge', (req, res) => {
    db.prepare(`UPDATE interventions SET wasAcknowledged = 1 WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  });

  // Categories
  apiRouter.get('/categories/:userId', (req, res) => {
    const categories = db.prepare(`SELECT * FROM categories WHERE userId = ?`).all(req.params.userId);
    res.json(categories);
  });

  apiRouter.post('/categories', (req, res) => {
    const { userId, name, icon } = req.body;
    const result = db.prepare(`INSERT INTO categories (userId, name, icon, isDefault) VALUES (?, ?, ?, 0)`).run(userId, name, icon);
    res.json({ id: result.lastInsertRowid, userId, name, icon, isDefault: false });
  });

  apiRouter.delete('/categories/:id', (req, res) => {
    db.prepare(`DELETE FROM categories WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  });

  // Dreams
  apiRouter.get('/dreams/:userId', (req, res) => {
    const dreams = db.prepare(`SELECT * FROM dreams WHERE userId = ?`).all(req.params.userId);
    res.json(dreams);
  });

  apiRouter.post('/dreams', (req, res) => {
    const { userId, name, cost, targetDate } = req.body;
    const createdAt = new Date().toISOString();
    const result = db.prepare(`INSERT INTO dreams (userId, name, cost, targetDate, createdAt, saved) VALUES (?, ?, ?, ?, ?, 0)`).run(userId, name, cost, targetDate, createdAt);
    res.json({ id: result.lastInsertRowid, userId, name, cost, targetDate, createdAt, saved: 0 });
  });

  apiRouter.put('/dreams/:id/save', (req, res) => {
    const { amount } = req.body;
    const dream = db.prepare(`SELECT * FROM dreams WHERE id = ?`).get(req.params.id) as any;
    if (!dream) return res.status(404).json({ error: 'Dream not found' });
    
    const newSaved = (dream.saved || 0) + amount;
    db.prepare(`UPDATE dreams SET saved = ? WHERE id = ?`).run(newSaved, req.params.id);
    res.json({ success: true, saved: newSaved });
  });

  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
