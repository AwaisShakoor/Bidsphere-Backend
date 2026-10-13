export type UpdateAuctionDto = {
  startingPrice?: number;
  reservePrice?: number;
  shippingType?: "FREE" | "FLAT_RATE";
  shippingCost?: number;
  startTime?: Date;
  endTime?: Date;
};