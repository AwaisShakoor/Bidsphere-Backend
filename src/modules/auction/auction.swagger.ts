export const auctionPaths = {
  "/api/auctions": {
    post: {
      tags: ["Auction"],
      summary: "Create a new auction (requires accessToken cookie)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "itemId",
                "startingPrice",
                "shippingType",
                "startTime",
                "endTime",
              ],
              properties: {
                itemId: {
                  type: "string",
                  format: "uuid",
                  example: "acbfff4f-1e0a-49d1-a970-cd114bf55812",
                },
                startingPrice: { type: "number", example: 100 },
                reservePrice: { type: "number", example: 150 },
                shippingType: {
                  type: "string",
                  enum: ["FREE", "FLAT_RATE"],
                  example: "FREE",
                },
                shippingCost: { type: "number", example: 25 },
                startTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-15T10:00:00.000Z",
                },
                endTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-20T10:00:00.000Z",
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Auction created successfully (status DRAFT)" },
        400: { description: "Validation or ownership error" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
    get: {
      tags: ["Auction"],
      summary: "List ACTIVE auctions (public). Optional filter by category.",
      parameters: [
        {
          in: "query",
          name: "categoryId",
          required: false,
          schema: { type: "string", format: "uuid" },
          description: "Filter auctions by item category id",
          example: "acbfff4f-1e0a-49d1-a970-cd114bf55812",
        },
      ],
      responses: {
        200: { description: "Auctions retrieved successfully" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/my-auctions": {
    get: {
      tags: ["Auction"],
      summary: "List my auctions (requires accessToken cookie). Optional filter by category.",
      parameters: [
        {
          in: "query",
          name: "categoryId",
          required: false,
          schema: { type: "string", format: "uuid" },
          description: "Filter my auctions by item category id",
          example: "acbfff4f-1e0a-49d1-a970-cd114bf55812",
        },
      ],
      responses: {
        200: { description: "Auctions retrieved successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/auctions/{id}": {
    get: {
      tags: ["Auction"],
      summary: "Get auction detail by id (public)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Auction id",
        },
      ],
      responses: {
        200: { description: "Auction retrieved successfully" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
    put: {
      tags: ["Auction"],
      summary: "Update a DRAFT auction (requires accessToken cookie)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Auction id",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                startingPrice: { type: "number", example: 200 },
                reservePrice: { type: "number", example: 250 },
                shippingType: {
                  type: "string",
                  enum: ["FREE", "FLAT_RATE"],
                  example: "FREE",
                },
                shippingCost: { type: "number", example: 25 },
                startTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-16T10:00:00.000Z",
                },
                endTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-22T10:00:00.000Z",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Auction updated successfully" },
        400: { description: "Validation, ownership, or not DRAFT" },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
    delete: {
      tags: ["Auction"],
      summary: "Delete a DRAFT auction (requires accessToken cookie)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Auction id",
        },
      ],
      responses: {
        200: { description: "Auction deleted successfully" },
        400: { description: "Ownership error or not DRAFT" },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
  },
};
