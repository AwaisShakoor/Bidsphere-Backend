export type CreateItemsDto = {
    title: string;
    description: string;
    categoryId: string;
    itemCondition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
    startingPrice: number;
    reservePrice?: number;
    shippingType: "FREE" | "FLAT_RATE";
    shippingCost?: number;
}