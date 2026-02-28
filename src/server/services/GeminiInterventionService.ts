import { GoogleGenAI } from '@google/genai';
import { Transaction, UserProfile } from '../models.js';

let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn('Failed to initialize Gemini API:', e);
}

export class GeminiInterventionService {
  async generatePrePaymentMemory(category: string, amount: number, merchant: string, previousTxs: any[]): Promise<string> {
    if (!ai) return `You've made ${previousTxs.length} ${category} purchases recently. Was each one worth it? 🤔`;
    
    let notesText = previousTxs.map((tx: any, i: number) => `${i+1}. '${tx.note}' — felt ${tx.mood} (₹${tx.amount}, ${new Date(tx.timestamp).toLocaleDateString()})`).join('\n');
    
    const prompt = `The user is about to spend ₹${amount} on ${category} (${merchant}).
Here are notes they wrote during their last ${category} purchases:
${notesText}

Write a SHORT, warm, memory-based reflection (3 sentences max).
Start with 'Remember when...' 
Reference their actual words/feelings from those notes.
End with a gentle question like 'Still feel the same way about this one?'
Be like a thoughtful friend, not a financial advisor.
Add 1 relevant emoji.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      return response.text || `You've made ${previousTxs.length} ${category} purchases recently. Was each one worth it? 🤔`;
    } catch (e) {
      return `You've made ${previousTxs.length} ${category} purchases recently. Was each one worth it? 🤔`;
    }
  }

  async generateBehavioralDNA(context: any): Promise<string> {
    const prompt = `You are a calm and supportive financial behavioral assistant.
Do not shame the user.
Be reflective and data-driven.
Keep response under 70 words.
Encourage awareness, not restriction.

Context:
${JSON.stringify(context, null, 2)}

Return a short, insightful analysis of their current financial behavior based on this data.`;

    if (!ai) return "Your spending patterns show a mix of planned and spontaneous decisions. Keeping an eye on impulse buys could help improve your financial health.";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      return response.text || "Your spending patterns show a mix of planned and spontaneous decisions. Keeping an eye on impulse buys could help improve your financial health.";
    } catch (e) {
      return "Your spending patterns show a mix of planned and spontaneous decisions. Keeping an eye on impulse buys could help improve your financial health.";
    }
  }

  async generatePostPaymentSuggestion(category: string, amount: number, goal: string): Promise<string> {
    const prompt = `The user just spent ₹${amount} on ${category}. Their main financial goal is "${goal}".
Write a short, encouraging message (1 sentence) suggesting a small action to balance this out, or a reflection.
Example: "Maybe skip the next coffee to stay on track for ${goal}?" or "Enjoy it, but let's cook dinner tonight!"`;

    if (!ai) return `Enjoy your purchase! Remember your goal: ${goal}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      return response.text || `Enjoy your purchase! Remember your goal: ${goal}.`;
    } catch (e) {
      return `Enjoy your purchase! Remember your goal: ${goal}.`;
    }
  }

  async generateIntervention(pattern: string, tx: Transaction, profile: UserProfile): Promise<string> {
    // Filter out necessities
    const necessities = ['Rent', 'Utilities', 'Groceries', 'Bills', 'Electricity', 'Water', 'Gas', 'Education', 'Medical'];
    if (necessities.some(n => tx.category.toLowerCase().includes(n.toLowerCase()))) {
      return ''; // No intervention for necessities
    }

    const prompt = `You are a compassionate financial wellness coach. A user just made a ${tx.category} transaction of ₹${tx.amount} at ${tx.merchant}. Their current risk score is ${profile.riskScore}/100. Detected pattern: ${pattern}. Monthly income: ₹${profile.monthlyIncome}, Savings goal: ₹${profile.savingsGoal}. Write a SHORT (2 sentences max), non-judgmental, motivating intervention message. Be specific with numbers. Do NOT be preachy.`;

    if (!ai) {
      return this.getFallbackIntervention(pattern, tx);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      return response.text || this.getFallbackIntervention(pattern, tx);
    } catch (error) {
      return this.getFallbackIntervention(pattern, tx);
    }
  }

  private getFallbackIntervention(pattern: string, tx: Transaction): string {
    const fallbacks: Record<string, string[]> = {
      BINGE_SPENDING: [
        `That's your 3rd ${tx.category} purchase recently! Taking a small pause can help you stay on track.`,
        `You're spending fast on ${tx.category}. Consider waiting 24 hours before your next purchase.`,
      ],
      LATE_NIGHT_IMPULSE: [
        `Late night purchases at ${tx.merchant} are often impulsive. Maybe sleep on it next time?`,
        `Shopping after 11pm? Your future self might appreciate skipping this one.`,
      ],
      GAMBLING_ALERT: [
        `Gambling transactions like this one at ${tx.merchant} carry high risk. Please be careful.`,
        `We noticed a gambling transaction. Remember, the house always wins in the long run.`,
      ]
    };

    const options = fallbacks[pattern] || fallbacks['BINGE_SPENDING'];
    return options[Math.floor(Math.random() * options.length)];
  }
}
