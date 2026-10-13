export type updateItemDto = {
    title?: string;
    description?: string;
    itemCondition?: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
    categoryId?: string;
}