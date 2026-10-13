export type CreateItemDto = {
    title: string;
    description: string;
    categoryId: string;
    itemCondition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
}