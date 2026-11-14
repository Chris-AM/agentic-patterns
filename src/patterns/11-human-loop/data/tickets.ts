export const TICKETS = [
  {
    id: 'TK-1',
    email: 'ana@correo.com',
    text:
      'Compré el curso de Docker hace 5 días y el video 3 no carga. ' +
      'Prefiero que me devuelvan el dinero.',
  },
  {
    id: 'TK-2',
    email: 'luis@correo.com',
    text:
      'Compré el bundle hace 6 meses y ya no lo usamos. ' +
      'Quiero el reembolso completo de los 299 USD.',
  },
];

export const INBOX = [
  'TICKETS EN COLA:',
  ...TICKETS.map(
    (ticket) => `  [${ticket.id}] de ${ticket.email}: ${ticket.text}`
  ),
  '',
  'Para CADA ticket que pida un reembolso: consulta la compra con ' +
    'findPurchase y luego llama a issueRefund con su purchaseId.',
].join('\n');
