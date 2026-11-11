export const bidPaths = {
  "/api/items/{itemId}/bids": {
    post: {
      tags: ["Bids"],
      summary: "Place a bid on an item",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amount"],
              properties: {
                amount: { type: "number", example: 55 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Bid placed successfully" },
        400: { description: "Invalid bid / auction not open" },
        401: { description: "Unauthorized" },
        404: { description: "Item not found" },
        500: { description: "Internal server error" },
      },
    },
    get: {
      tags: ["Bids"],
      summary: "List bids for an item",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Bids retrieved successfully" },
        404: { description: "Item not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/bids": {
    get: {
      tags: ["Bids"],
      summary: "List my bids",
      responses: {
        200: { description: "Bids retrieved successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
};
