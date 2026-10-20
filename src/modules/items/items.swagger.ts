export const itemPaths = {
  "/api/{auctionId}/items": {
    post: {
      tags: ["Items"],
      summary: "Create an item on a draft auction (seller)",
      parameters: [
        {
          in: "path",
          name: "auctionId",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "title",
                "description",
                "categoryId",
                "itemCondition",
                "startingPrice",
                "shippingType",
              ],
              properties: {
                title: { type: "string", example: "Vintage camera" },
                description: {
                  type: "string",
                  example: "Working film camera",
                },
                categoryId: {
                  type: "string",
                  format: "uuid",
                  description: "UUID of an existing category",
                  example: "",
                },
                itemCondition: {
                  type: "string",
                  enum: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"],
                  example: "GOOD",
                },
                startingPrice: { type: "number", example: 50 },
                reservePrice: { type: "number", example: 80 },
                shippingType: {
                  type: "string",
                  enum: ["FREE", "FLAT_RATE"],
                  example: "FLAT_RATE",
                },
                shippingCost: { type: "number", example: 10 },
                images: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Optional photos, up to 5",
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Item created successfully" },
        400: { description: "Items can only be added to a draft auction" },
        401: { description: "Unauthorized" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
    get: {
      tags: ["Items"],
      summary: "List items for an auction",
      parameters: [
        {
          in: "path",
          name: "auctionId",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Items fetched successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/{auctionId}/items/{itemId}": {
    get: {
      tags: ["Items"],
      summary: "Get one item",
      parameters: [
        {
          in: "path",
          name: "auctionId",
          required: true,
          schema: { type: "string" },
        },
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Item fetched successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
    put: {
      tags: ["Items"],
      summary: "Update an item, add photos, or remove photos",
      parameters: [
        {
          in: "path",
          name: "auctionId",
          required: true,
          schema: { type: "string" },
        },
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: false,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string", example: "Vintage camera" },
                description: {
                  type: "string",
                  example: "Working film camera",
                },
                categoryId: { type: "string", format: "uuid" },
                itemCondition: {
                  type: "string",
                  enum: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"],
                  example: "GOOD",
                },
                startingPrice: { type: "number", example: 50 },
                reservePrice: { type: "number", example: 80 },
                shippingType: {
                  type: "string",
                  enum: ["FREE", "FLAT_RATE"],
                  example: "FLAT_RATE",
                },
                shippingCost: { type: "number", example: 10 },
                removeImageIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Ids of existing photos to delete",
                },
                images: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "New photos to add, up to 5",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Item updated successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
    delete: {
      tags: ["Items"],
      summary: "Delete an item",
      parameters: [
        {
          in: "path",
          name: "auctionId",
          required: true,
          schema: { type: "string" },
        },
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Item deleted successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
};
