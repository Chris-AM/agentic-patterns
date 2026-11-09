import { tool } from 'ai';
import { z } from 'zod';

import { EMPLOYEES } from '../data/employees.js';

// ---------------------------------------------------------------------------
// LA ÚNICA HERRAMIENTA
// ---------------------------------------------------------------------------

//* Herramienta que sirve para, en primera instancia,
//* recibiendo un id de empleado, razonar cuál es el siguiente id.
export const getEmployee = tool({
  description:
    'Devuelve la ficha de un empleado: su cargo, cuánto puede aprobar ' +
    'por sí solo y el ID de su jefe directo.',
  inputSchema: z.object({
    employeeId: z.string().describe('ID del empleado. ej: "EMP-1"'),
  }),
  execute: async ({ employeeId }) => {
    const employee = EMPLOYEES.find((e) => e.id === employeeId);
    //? comentario de la clase: no usar throw Error, 
    //? debido a que el modelo termina de manera abrupta la conversación, 
    //? mejor retornar un objeto con error y que el modelo lo maneje.
    if (!employee) return { error: `No existe el empleado ${employeeId}` };
    return employee;
  },
});
