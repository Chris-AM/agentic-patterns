import { tool } from 'ai';
import { z } from 'zod';
import { COURSE_CATALOG } from '../data/course-catalog.js';

// Tool #1 find courses
export const findCourses = tool({
  description:
    'Buscar cursos en el catálogo de DevTalles, por texto, ' +
    'por título o por nivel. Utilízala siempre antes de responder ' +
    'cualquier pregunta sobre cursos, precios, cantidad de alumnos. ',
  inputSchema: z.object({
    text: z
      .string()
      .optional()
      .describe('Texto a buscar en el título del curso.'),
    level: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  }),
  execute: async ({ text, level }) => {
    const filteredCourses = COURSE_CATALOG.filter((course) => {
      const matchesText =
        !text || course.title.toLowerCase().includes(text.toLowerCase());
      const matchesLevel = !level || course.level === level;
      return matchesText && matchesLevel;
    });

    return {
      found: filteredCourses.length,
      courses: filteredCourses,
    };
  },
});
