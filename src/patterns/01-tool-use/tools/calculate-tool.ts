import { tool } from "ai";
import z from "zod";
import { COURSE_CATALOG } from "../data/course-catalog.js";

export const calculateTool = tool({
  description:
    "Calcula el precio total de una lista de cursos aplicando un descuento porcentual, " +
    "y la suma de sus horas. " +
    "Utilízala siempre para cualquier operación aritmética: no calcules mentalmente.",
  inputSchema: z.object({
    ids: z
      .array(z.string())
      .describe('IDs de los cursos. ej: ["ts-01","dkr-05"]'),
    discountPercent: z.number().min(0).max(100).default(0),
  }),
  execute: async ({ ids, discountPercent }) => {
    const foundCourses = COURSE_CATALOG.filter((course) =>
      ids.includes(course.id),
    );

    const notFound = ids.filter(
      (id) => !COURSE_CATALOG.some((course) => course.id === id),
    );

    const subtotal = foundCourses.reduce(
      (acc, course) => acc + course.priceUSD,
      0,
    );

    const totalHours = foundCourses.reduce(
      (acc, course) => acc + course.hours,
      0,
    );

    const discount = subtotal * (discountPercent / 100);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number((subtotal - discount).toFixed(2)),
      totalHours,
      notFound: notFound,
    };
  },
});
