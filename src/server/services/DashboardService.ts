import db from '../db.js';
import { Transaction, UserProfile } from '../models.js';

export class DashboardService {
  getDashboardData(userId: string) {
    const user = db.prepare(`SELECT * FROM users WHERE userId = ?`).get(userId) as UserProfile;
    if (!user) return null;

    const txs = db.prepare(`SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC`).all(userId) as Transaction[];

    // Spending by category
    const spendingByCategory: Record<string, number> = {};
    txs.forEach(tx => {
      spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount;
    });

    const categoryBreakdown = Object.entries(spendingByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Weekly trend
    const weeklySpending: { day: string, amount: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dailySpend = txs.filter(tx => tx.timestamp.startsWith(dateStr)).reduce((sum, tx) => sum + tx.amount, 0);
      weeklySpending.push({ day: dayName, amount: dailySpend });
    }

    // Future projection
    const last30Days = txs.filter(tx => new Date(tx.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const totalLast30 = last30Days.reduce((sum, tx) => sum + tx.amount, 0);
    const dailyAvg = totalLast30 / 30 || 0;
    const projectedSpend = dailyAvg * 30;
    const futureProjection = {
      projectedSpend,
      remainingForSavings: user.monthlyIncome - projectedSpend
    };

    // Savings trajectory (6 months)
    const savingsTrajectory: { month: string, projected: number, goal: number }[] = [];
    for (let i = 1; i <= 6; i++) {
      const m = new Date();
      m.setMonth(m.getMonth() + i);
      const monthStr = m.toLocaleString('default', { month: 'short' });
      savingsTrajectory.push({
        month: monthStr,
        projected: (user.monthlyIncome - projectedSpend) * i,
        goal: user.savingsGoal * i
      });
    }

    // Detected patterns
    const patterns = new Set<string>();
    const recentTxs = txs.slice(0, 50);
    if (recentTxs.some(tx => tx.category === 'GAMBLING')) patterns.add('GAMBLING_ALERT');
    if (recentTxs.some(tx => {
      const h = new Date(tx.timestamp).getHours();
      return (h >= 23 || h < 5) && !['BILLS', 'FOOD'].includes(tx.category);
    })) patterns.add('LATE_NIGHT_IMPULSE');
    if (totalLast30 > user.monthlyIncome * 0.8) patterns.add('BUDGET_BREACH');

    const activeInterventions = db.prepare(`SELECT * FROM interventions WHERE userId = ? AND wasAcknowledged = 0 ORDER BY triggeredAt DESC`).all(userId);

    return {
      riskScore: user.riskScore,
      categoryBreakdown,
      weeklySpending,
      monthlySpend: totalLast30,
      futureProjection,
      savingsTrajectory,
      detectedPatterns: Array.from(patterns),
      activeInterventions
    };
  }
}
