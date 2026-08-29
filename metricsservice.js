let totalRevenue = 50.00;
let totalApiCosts = 42.00;

export async function recordRevenue(amount) {
totalRevenue += amount;
}

export async function recordCost(cost) {
totalApiCosts += cost;
}

export async function getSystemFinancialHealth() {
const netMargin = totalRevenue - totalApiCosts;
const inDanger = netMargin < 5.00;

return {
revenue: totalRevenue.toFixed(2),
costs: totalApiCosts.toFixed(2),
margin: netMargin.toFixed(2),
inDanger: inDanger,
status: inDanger ? 'CRÍTICO' : 'OPERATIVO'
};
}