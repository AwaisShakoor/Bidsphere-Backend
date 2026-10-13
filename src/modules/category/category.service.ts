import { prisma } from "../../config/db";

export async function getCategory() {
    return prisma.category.findMany({
        select: {
            id:true,
            name: true,
            slug: true,
        },
        orderBy: {
            name: "asc"
        }
    })
}