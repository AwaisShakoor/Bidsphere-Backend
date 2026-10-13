import { prisma } from "../../config/db";
import { CreateItemDto } from "./create-item.dto";
import { updateItemDto } from "./update-item.dto";

export async function createItem(sellerId: string, itemDto: CreateItemDto) {
    const category = await prisma.category.findUnique({
        where: { id: itemDto.categoryId}
    })
    if(!category) {
        throw new Error("Category not found");
    }
    return prisma.item.create({
       data: {
        sellerId,
        categoryId: itemDto.categoryId,
        title: itemDto.title,
        description: itemDto.description,
        itemCondition: itemDto.itemCondition,
    },
    select: {
        id: true,
        title: true,
        description: true,
        itemCondition: true,
        categoryId: true,
        sellerId: true,
        createdAt: true,
    }
    })
}

export async function updateItem(sellerId: string, itemId: string, updateItemDto: updateItemDto) {
  const item = await prisma.item.findUnique({
    where: { id: itemId, sellerId },
  })
  if(!item) {
    throw new Error("Item not found");
  }
  return prisma.item.update({
    where: { id: itemId },
    data: updateItemDto,
    select: {
      id: true,
      title: true,
      description: true,
      itemCondition: true,
      categoryId: true,
      sellerId: true,
      createdAt: true,
      updatedAt: true,
    }
  })
}

export async function getMyItems(sellerId: string) {
    return prisma.item.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        description: true,
        itemCondition: true,
        categoryId: true,
        sellerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }