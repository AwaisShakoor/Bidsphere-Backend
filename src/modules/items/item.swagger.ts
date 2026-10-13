export const itemPaths = {
  "/api/items": {
    post: {
      tags: ["Item"],
      summary: "Create a new item (requires accessToken cookie)",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description", "categoryId", "itemCondition"],
              properties: {
                title: { type: "string", example: "iPhone 14" },
                description: {
                  type: "string",
                  example: "Good condition, 128GB",
                },
                categoryId: {
                  type: "string",
                  format: "uuid",
                  example: "acbfff4f-1e0a-49d1-a970-cd114bf55812",
                },
                itemCondition: {
                  type: "string",
                  enum: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"],
                  example: "GOOD",
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Item created successfully" },
        400: { description: "Validation error or category not found" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
    get: {
      tags: ["Item"],
      summary: "List my items (requires accessToken cookie)",
      responses: {
        200: { description: "Items retrieved successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/items/{itemId}": {
    put: {
      tags: ["Item"],
      summary: "Update my item (requires accessToken cookie)",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Item id",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string", example: "Updated iPhone 14" },
                description: {
                  type: "string",
                  example: "Updated description",
                },
                categoryId: {
                  type: "string",
                  format: "uuid",
                  example: "acbfff4f-1e0a-49d1-a970-cd114bf55812",
                },
                itemCondition: {
                  type: "string",
                  enum: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"],
                  example: "LIKE_NEW",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Item updated successfully" },
        400: { description: "Validation, ownership, or category not found" },
        401: { description: "Unauthorized" },
        404: { description: "Item not found" },
        500: { description: "Internal server error" },
      },
    },
  },
};
