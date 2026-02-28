import { Transaction } from '../server/models';

export interface RiskAnalysisResult {
  impulseIndex: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  explanationBreakdown: {
    behavioralDeviation: { score: number; max: number; reason: string };
    temporalVulnerability: { score: number; max: number; reason: string };
    financialPressure: { score: number; max: number; reason: string };
    habitEscalation: { score: number; max: number; reason: string };
  };
  projectedMonthlyImpact: number;
}

/**
 * Helper to calculate Behavioral Deviation Score (0-30)
 * Uses z-score of the current transaction amount against historical category data.
 */
function calculateBehavioralDeviationScore(amount: number, historicalMean: number, historicalStdDev: number) {
    if (!historicalStdDev || historicalStdDev <= 0) return 0;

    const zScore = (amount - historicalMean) / historicalStdDev;

    // Only penalize if spending more than mean (z > 0)
    if (zScore <= 0) return 0;

    // Map z-score (0 to 3) to score (0 to 30)
    // Assuming a z-score >= 3 is the maximum deviation (30)
    let score = (zScore / 3) * 30;

    return Math.min(Math.max(score, 0), 30);
}

/**
 * Helper to calculate Temporal Vulnerability Score (0-20)
 * Evaluates whether the transaction happens during known low-control hours.
 */
function calculateTemporalVulnerabilityScore(isLowControlHour: boolean) {
    // If true, max out vulnerability (20). Could be graded if passed a probability (0-1).
    return isLowControlHour ? 20 : 0;
}

/**
 * Helper to calculate Financial Pressure Score (0-25)
 * Evaluates how the transaction amount impacts the sustainable daily allowance.
 */
function calculateFinancialPressureScore(amount: number, sustainableDailyAllowance: number) {
    if (!sustainableDailyAllowance || sustainableDailyAllowance <= 0) return 25;

    // Ratio of amount to the daily allowance
    const ratio = amount / sustainableDailyAllowance;

    // If spending 100% of the daily allowance on one transaction, it's high pressure.
    // Let's say spending 100% gives a score of 20, scaling up to 25.
    let score = ratio * 20;

    return Math.min(Math.max(score, 0), 25);
}

/**
 * Helper to calculate Habit Escalation Score (0-25)
 * Evaluates risk based on the frequency of recent impulses.
 */
function calculateHabitEscalationScore(recentImpulseAlerts: number) {
    // Assuming 5 or more recent alerts maxes out the score
    const penaltyPerAlert = 5;
    let score = (recentImpulseAlerts || 0) * penaltyPerAlert;

    return Math.min(Math.max(score, 0), 25);
}

/**
 * Helper to determine categorical risk level based on the Composite Impulse Index.
 * Made more sensitive:
 * Low: < 20 (was 30)
 * Moderate: < 45 (was 60)
 * High: < 70 (was 85)
 * Critical: >= 70
 */
function determineRiskLevel(indexScore: number) {
    if (indexScore < 20) return 'Low';
    if (indexScore < 45) return 'Moderate';
    if (indexScore < 70) return 'High';
    return 'Critical';
}

/**
 * Main engine function to analyze a transaction and compute the Composite Impulse Index.
 */
export function analyzeTransaction(transactionData: {
    amount: number;
    historicalMean: number;
    historicalStdDev: number;
    isLowControlHour: boolean;
    sustainableDailyAllowance: number;
    recentImpulseAlerts: number;
}): RiskAnalysisResult {
    const {
        amount = 0,
        historicalMean = 0,
        historicalStdDev = 1,
        isLowControlHour = false,
        sustainableDailyAllowance = 100,
        recentImpulseAlerts = 0
    } = transactionData;

    // Calculate Layer Scores
    const behaviorScore = calculateBehavioralDeviationScore(amount, historicalMean, historicalStdDev);
    const temporalScore = calculateTemporalVulnerabilityScore(isLowControlHour);
    const pressureScore = calculateFinancialPressureScore(amount, sustainableDailyAllowance);
    const habitScore = calculateHabitEscalationScore(recentImpulseAlerts);

    // Composite Impulse Index (0-100)
    const impulseIndex = behaviorScore + temporalScore + pressureScore + habitScore;

    // Categorical Risk Level
    const riskLevel = determineRiskLevel(impulseIndex);

    // Breakdown for explainability
    const explanationBreakdown = {
        behavioralDeviation: {
            score: Math.round(behaviorScore * 10) / 10,
            max: 30,
            reason: `Transaction deviates from historical avg by $${Math.max(0, amount - historicalMean).toFixed(2)}.`
        },
        temporalVulnerability: {
            score: Math.round(temporalScore * 10) / 10,
            max: 20,
            reason: isLowControlHour ? 'Occurred during identified low-control hours.' : 'Standard transaction hours.'
        },
        financialPressure: {
            score: Math.round(pressureScore * 10) / 10,
            max: 25,
            reason: `Consumes ${((amount / (sustainableDailyAllowance || 1)) * 100).toFixed(1)}% of sustainable daily allowance.`
        },
        habitEscalation: {
            score: Math.round(habitScore * 10) / 10,
            max: 25,
            reason: `Detected ${recentImpulseAlerts || 0} recent impulse alerts.`
        }
    };

    // Projected Monthly Impact (Simplified model)
    // Projects what would happen if this impulse behavior repeats consistently.
    const projectedEventsPerMonth = Math.max(recentImpulseAlerts, 1) * 4;
    const projectedMonthlyImpact = (amount > historicalMean ? (amount - historicalMean) : amount) * projectedEventsPerMonth;

    return {
        impulseIndex: Math.round(impulseIndex * 10) / 10,
        riskLevel,
        explanationBreakdown,
        projectedMonthlyImpact: Math.round(projectedMonthlyImpact * 100) / 100
    };
}

// Wrapper to maintain compatibility or ease of use from PaymentFlow
export function calculateRiskScore(
  amount: number,
  category: string,
  txHistory: Transaction[],
  monthlyIncome: number,
  currentBalance: number
): RiskAnalysisResult {
    // 1. Calculate Historical Stats
    const categoryTxs = txHistory.filter(t => t.category === category);
    let mean = 0;
    let stdDev = 1;
    
    if (categoryTxs.length > 0) {
        const amounts = categoryTxs.map(t => t.amount);
        mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
        stdDev = Math.sqrt(variance) || 1;
    }

    // 2. Low Control Hour
    const hour = new Date().getHours();
    const isLowControlHour = (hour >= 23 || hour < 4);

    // 3. Sustainable Daily Allowance
    const daysInMonth = 30;
    const today = new Date().getDate();
    const daysLeft = Math.max(1, daysInMonth - today);
    const sustainableDailyAllowance = currentBalance / daysLeft;

    // 4. Recent Impulse Alerts
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentImpulseAlerts = txHistory.filter(t => 
        new Date(t.timestamp).getTime() > oneWeekAgo && 
        t.amount > mean * 1.5 // Simplified "impulse" detection for history
    ).length;

    return analyzeTransaction({
        amount,
        historicalMean: mean,
        historicalStdDev: stdDev,
        isLowControlHour,
        sustainableDailyAllowance,
        recentImpulseAlerts
    });
}
