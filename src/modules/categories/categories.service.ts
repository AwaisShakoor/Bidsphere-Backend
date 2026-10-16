import { prisma } from "../../config/db";

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return categories.sort((a,b) => {
    if (a.slug === "other") return 1;
    if (b.slug === "other") return -1;
    return a.name.localeCompare(b.name);
  })
}
