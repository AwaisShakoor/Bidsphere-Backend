export const paymentPaths = {
  "/api/payments/items/{itemId}/checkout": {
    post: {
      tags: ["Payments"],
      summary: "Start checkout for a won item",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        201: { description: "Checkout created (redirect URL returned)" },
        400: { description: "No winning bid / payment already completed" },
        401: { description: "Unauthorized" },
        403: { description: "Only the winner can pay" },
        404: { description: "Item not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/payments/items/{itemId}": {
    get: {
      tags: ["Payments"],
      summary: "Get payment status for an item",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Payment retrieved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Not allowed to view this payment" },
        404: { description: "Payment not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/payments": {
    get: {
      tags: ["Payments"],
      summary: "List my payments",
      responses: {
        200: { description: "Payments retrieved successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
};
