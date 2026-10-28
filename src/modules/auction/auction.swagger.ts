export const auctionPaths = {
  "/api/auctions": {
    post: {
      tags: ["Auctions"],
      summary: "Create a draft auction (seller)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description", "startTime", "endTime"],
              properties: {
                title: {
                  type: "string",
                  example: "My Auction",
                },
                description: {
                  type: "string",
                  example: "This is my auction",
                },
                startTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-20T10:00:00.000Z",
                },
                endTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-25T18:00:00.000Z",
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Auction created successfully" },
        400: { description: "Invalid times / end before start" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
    get: {
      tags: ["Auctions"],
      summary: "Get my auctions (seller)",
      responses: {
        200: { description: "List of auctions for the logged-in seller" },
        401: { description: "Unauthorized — login first" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/auctions/{id}": {
    get: {
      tags: ["Auctions"],
      summary: "Get an auction by ID (seller)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Auction retrieved successfully" },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
    put: {
      tags: ["Auctions"],
      summary: "Update an auction by ID (seller)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  example: "My Auction",
                },
                description: {
                  type: "string",
                  example: "This is my auction",
                },
                startTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-20T10:00:00.000Z",
                },
                endTime: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-25T18:00:00.000Z",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Auction updated successfully" },
        400: { description: "Invalid times / only draft can be updated" },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
    delete: {
      tags: ["Auctions"],
      summary: "Delete an auction by ID (seller)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Auction deleted successfully" },
        400: { description: "Only draft auctions can be deleted" },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/auctions/{id}/submit": {
    post: {
      tags: ["Auctions"],
      summary: "Submit a draft auction for approval (seller)",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Auction submitted for approval" },
        400: {
          description: "Only a draft can be submitted / auction has no items",
        },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
  },
};
