import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getSystemFinancialHealth } from './metricsservice.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleAIRequest(req, res) {
const { prompt, userIsPaid } = req.body;

try {
const health = await getSystemFinancialHealth();

if (health.inDanger && !userIsPaid) {
return res.status(402).json({
error: 'SISTEMA EN MODO SUPERVIVENCIA: Cobertura mínima alcanzada. Se requiere suscripción para mantener el servicio activo.',
systemStatus: health
});
}

const completion = await openai.chat.completions.create({
model: 'gpt-4o-mini',
messages: [
{
role: 'system',
content: 'Eres un motor de IA optimizado para operar de forma eficiente y autosostenible.'
},
{ role: 'user', content: prompt }
],
});

return res.status(200).json({
result: completion.choices[0].message.content,
systemStatus: health.status
});

} catch (error) {
return res.status(500).json({ error: 'Error en el procesamiento de la solicitud de IA.' });
}
}