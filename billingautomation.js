export async function processStripeEvent(event) {
switch (event.type) {
case 'invoice.payment_succeeded': {
const invoice = event.data.object;
console.log(`[BILLING] Transacción confirmada: ${invoice.customer_email}`);
break;
}
case 'invoice.payment_failed': {
const invoice = event.data.object;
console.log(`[BILLING] Transacción rechazada: ${invoice.customer_email}`);
break;
}
default:
console.log(`[BILLING] Evento omitido: ${event.type}`);
}
}