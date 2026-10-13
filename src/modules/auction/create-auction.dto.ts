export type createAuctionDto = {
    itemId: string;
    startingPrice: number;
    reservePrice?: number;
    shippingType: "FREE" | "FLAT_RATE";
    shippingCost?: number;
    startTime: string;
    endTime: string;
}