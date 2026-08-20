/**
 * GET /api/genres — список жанров (id, name, slug), по имени.
 */
export default defineEventHandler(async () => {
  return prisma.genre.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: "asc" },
  });
});
