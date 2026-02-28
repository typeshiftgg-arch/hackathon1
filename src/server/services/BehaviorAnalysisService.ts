import db from '../db.js';
import { Transaction, UserProfile, Intervention } from '../models.js';
import { GeminiInterventionService } from './GeminiInterventionService.js';

const geminiService = new GeminiInterventionService();

export class BehaviorAnalysisService {
  public geminiService = geminiService;

  calculateRiskScore(userId: string): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const txs = db.prepare(`SELECT * FROM transactions WHERE userId = ? AND timestamp >= ?`).all(userId, thirtyDaysAgoStr) as Transaction[];
    const user = db.prepare(`SELECT * FROM users WHERE userId = ?`).get(userId) as UserProfile;

    if (!user) return 0;

    let score = 0;
    let impulsiveSpend = 0;
    let totalSpend = 0;
    let lateNightCount = 0;
    let largeTxCount = 0;

    const impulsiveCategories = ['ENTERTAINMENT', 'SHOPPING', 'GAMBLING', 'LUXURY'];

    for (const tx of txs) {
      totalSpend += tx.amount;
      if (impulsiveCategories.includes(tx.category)) {
        impulsiveSpend += tx.amount;
      }

      const txDate = new Date(tx.timestamp);
      const hour = txDate.getHours();
      if (hour >= 23 || hour < 5) {
        lateNightCount++;
      }

      if (tx.amount > user.monthlyIncome * 0.2) {
        largeTxCount++;
      }
    }

    // Base rules
    const hasGambling = txs.some(tx => tx.category === 'GAMBLING');
    if (hasGambling) score += 30;

    if (totalSpend > user.monthlyIncome * 0.6) score += 20;

    // 3+ ENTERTAINMENT or SHOPPING in same day
    const dayCounts: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.category === 'ENTERTAINMENT' || tx.category === 'SHOPPING') {
        const day = tx.timestamp.split('T')[0];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    }
    if (Object.values(dayCounts).some(count => count >= 3)) score += 15;

    // Late night in specific categories
    const hasLateNightImpulse = txs.some(tx => {
      const hour = new Date(tx.timestamp).getHours();
      return (hour >= 23 || hour < 5) && ['ENTERTAINMENT', 'GAMBLING', 'SHOPPING'].includes(tx.category);
    });
    if (hasLateNightImpulse) score += 15;

    // Savings goal missed
    if (user.monthlyIncome - totalSpend < user.savingsGoal) score += 10;

    // Spending increased >30% vs last month (simplified: just checking velocity)
    const last7Days = txs.filter(tx => new Date(tx.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const previous7Days = txs.filter(tx => {
      const d = new Date(tx.timestamp);
      return d <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && d > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    });
    const last7Total = last7Days.reduce((sum, tx) => sum + tx.amount, 0);
    const prev7Total = previous7Days.reduce((sum, tx) => sum + tx.amount, 0);
    if (prev7Total > 0 && last7Total > prev7Total * 1.3) score += 10;

    score = Math.min(100, score);

    db.prepare(`UPDATE users SET riskScore = ?, totalSpent = ? WHERE userId = ?`).run(score, totalSpend, userId);
    return score;
  }

  detectHarmfulPatterns(userId: string): string[] {
    const patterns: string[] = [];
    const txs = db.prepare(`SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC LIMIT 100`).all(userId) as Transaction[];
    const user = db.prepare(`SELECT * FROM users WHERE userId = ?`).get(userId) as UserProfile;

    if (!user || txs.length === 0) return patterns;

    const latestTx = txs[0];
    const latestTime = new Date(latestTx.timestamp);

    // BINGE_SPENDING: 3+ same category in 2 hours
    const twoHoursAgo = new Date(latestTime.getTime() - 2 * 60 * 60 * 1000);
    const recentSameCat = txs.filter(tx => tx.category === latestTx.category && new Date(tx.timestamp) >= twoHoursAgo);
    if (recentSameCat.length >= 3) patterns.push('BINGE_SPENDING');

    // LATE_NIGHT_IMPULSE
    const hour = latestTime.getHours();
    if ((hour >= 23 || hour < 5) && latestTx.category !== 'BILLS') patterns.push('LATE_NIGHT_IMPULSE');

    // BUDGET_BREACH
    const currentMonth = latestTime.getMonth();
    const currentYear = latestTime.getFullYear();
    const monthlySpend = txs.filter(tx => {
      const d = new Date(tx.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, tx) => sum + tx.amount, 0);
    if (monthlySpend > user.monthlyIncome * 0.8) patterns.push('BUDGET_BREACH');

    // SAVING_DERAIL
    if (user.monthlyIncome - monthlySpend < user.savingsGoal) patterns.push('SAVING_DERAIL');

    // GAMBLING_ALERT
    if (latestTx.category === 'GAMBLING') patterns.push('GAMBLING_ALERT');

    return patterns;
  }

  async processNewTransaction(tx: Transaction): Promise<void> {
    const score = this.calculateRiskScore(tx.userId);
    const patterns = this.detectHarmfulPatterns(tx.userId);
    const user = db.prepare(`SELECT * FROM users WHERE userId = ?`).get(tx.userId) as UserProfile;

    for (const pattern of patterns) {
      // Add randomness to avoid spamming interventions (70% chance to skip if score > 40, unless it's gambling)
      if ((score > 40 && Math.random() > 0.7) || pattern === 'GAMBLING_ALERT') {
        const message = await geminiService.generateIntervention(pattern, tx, user);
        let severity = 'LOW';
        if (pattern === 'GAMBLING_ALERT' || pattern === 'BUDGET_BREACH') severity = 'HIGH';
        else if (score > 60) severity = 'MEDIUM';

        db.prepare(`
          INSERT INTO interventions (userId, message, severity, category, triggeredAt, wasAcknowledged)
          VALUES (?, ?, ?, ?, ?, 0)
        `).run(tx.userId, message, severity, pattern, new Date().toISOString());
      }
    }
  }
}
