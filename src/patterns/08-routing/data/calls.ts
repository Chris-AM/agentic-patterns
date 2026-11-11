import type { Route } from './departments.js';

// ---------------------------------------------------------------------------
// LAS LLAMADAS — cada una con su departamento correcto (ground truth)
// ---------------------------------------------------------------------------

export const CALLS: { id: number; text: string; expected: Route }[] = [
  {
    id: 1,
    text: 'Quiero saber qué cursos tienen de Flutter y cuánto cuestan.',
    expected: 'ventas',
  },
  {
    id: 2,
    text: 'No puedo entrar a mi cuenta, dice contraseña incorrecta.',
    expected: 'soporte',
  },
  {
    id: 3,
    text: 'Necesito la factura de mi compra de agosto para mi contador.',
    expected: 'facturacion',
  },
  {
    id: 4,
    text: 'El video 14 del curso de NestJS no carga.',
    expected: 'soporte',
  },
  {
    id: 5,
    text: '¿Hacen descuento para un equipo de 10 personas?',
    expected: 'ventas',
  },
  {
    id: 6,
    text: 'Me cobraron dos veces el mismo curso.',
    expected: 'facturacion',
  },
  // Fallback: no son de ningún departamento (agregadas, no vienen del curso).
  {
    id: 7,
    text: 'Hola, tengo una consulta.',
    expected: 'humano',
  },
  {
    id: 8,
    text: '¿Venden pizzas a domicilio?',
    expected: 'humano',
  },
];
