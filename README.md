# FinSense 🧠 - Behavioral Intervention System for Financial Decision Awareness

FinSense is a full-stack web application designed to detect harmful spending patterns and generate intelligent, personalized interventions using AI. It acts as a "financial guardian," helping users understand the long-term consequences of their impulsive financial decisions.

## Features

- **Behavioral Risk Score**: Calculates a dynamic risk score (0-100) based on spending velocity, impulsive categories, late-night transactions, and budget breaches.
- **Pattern Detection**: Identifies harmful patterns like \`BINGE_SPENDING\`, \`LATE_NIGHT_IMPULSE\`, \`BUDGET_BREACH\`, \`SAVING_DERAIL\`, and \`GAMBLING_ALERT\`.
- **AI Interventions**: Uses Google Gemini API to generate compassionate, non-judgmental, and personalized intervention messages when risky behavior is detected.
- **Insight Dashboard**: Visualizes spending breakdown, weekly trends, future projections, and a 6-month savings trajectory.
- **Simulation Engine**: Includes a "Simulate Spending Spree" feature to instantly generate realistic transaction data for demonstration purposes.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, SQLite (in-memory)
- **Frontend**: React.js, Tailwind CSS, Recharts, Lucide React
- **AI Layer**: Google Gemini API (\`gemini-1.5-flash\`)

*Note: The original request specified Java Spring Boot + H2. However, due to the constraints of the AI Studio environment which strictly runs Node.js/TypeScript, the backend was implemented using Express + SQLite while maintaining the exact requested architecture, endpoints, and logic.*

## Setup Instructions

### 1. Environment Variables
Ensure you have a \`.env\` file in the root directory with your Gemini API key:
\`\`\`env
GEMINI_API_KEY="your_gemini_api_key_here"
\`\`\`
*If the API key is missing, the app will gracefully fall back to hardcoded intervention messages.*

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Run the Application
\`\`\`bash
npm run dev
\`\`\`
This will start both the Express backend and the Vite frontend on port 3000.

## Demo Walkthrough

1. **Dashboard**: View the initial state. The risk score is 0, and there are no transactions.
2. **Profile**: Go to the Profile tab to see the default monthly income (₹50,000) and savings goal (₹10,000).
3. **Simulate**: Go to the Transactions tab and click the big orange **"🎲 SIMULATE SPENDING SPREE"** button. This will generate 20 random, realistic transactions (including late-night and gambling).
4. **Review Dashboard**: Return to the Dashboard to see the updated Risk Score, spending breakdown, and detected patterns.
5. **Interventions**: Check the Interventions tab (or the active interventions on the dashboard) to read the AI-generated messages. Acknowledge them to dismiss.
6. **Manual Entry**: Try adding a manual transaction (e.g., ₹5000 for "GAMBLING") to instantly trigger a high-severity intervention.

## Architecture Diagram

\`\`\`text
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   React Frontend  |<----->|  Express Backend  |<----->|  SQLite Database  |
|   (Vite, Recharts)| REST  |  (TypeScript)     | SQL   |  (In-Memory)      |
|                   |       |                   |       |                   |
+-------------------+       +---------+---------+       +-------------------+
                                      |
                                      | API Call
                                      v
                            +-------------------+
                            |                   |
                            | Google Gemini API |
                            | (gemini-1.5-flash)|
                            |                   |
                            +-------------------+
\`\`\`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| \`POST\` | \`/api/users\` | Create user profile |
| \`GET\` | \`/api/users/:userId\` | Get user profile |
| \`PUT\` | \`/api/users/:userId\` | Update income/savings goal |
| \`POST\` | \`/api/transactions\` | Add transaction & trigger analysis |
| \`GET\` | \`/api/transactions/:userId\` | Get all transactions |
| \`POST\` | \`/api/transactions/simulate/:userId\` | Generate 20 realistic transactions |
| \`GET\` | \`/api/dashboard/:userId\` | Get dashboard metrics and projections |
| \`GET\` | \`/api/interventions/:userId\` | Get all interventions |
| \`GET\` | \`/api/interventions/:userId/active\` | Get unacknowledged interventions |
| \`PUT\` | \`/api/interventions/:id/acknowledge\` | Mark intervention as read |
