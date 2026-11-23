export const adminPaths = {
  "/api/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "List all users (admin)",
      responses: {
        200: { description: "Users retrieved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/admin/auctions": {
    get: {
      tags: ["Admin"],
      summary: "List auctions waiting for approval (admin)",
      responses: {
        200: { description: "Auctions retrieved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/admin/auctions/{id}": {
    get: {
      tags: ["Admin"],
      summary: "Get auction by ID (admin)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Auction ID",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Auction retrieved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/admin/auctions/{id}/approve": {
    post: {
      tags: ["Admin"],
      summary: "Approve auction by ID (admin)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Auction ID",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Auction approved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        404: { description: "Auction not found" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/admin/auctions/{id}/reject": {
    post: {
      tags: ["Admin"],
      summary: "Reject auction by ID (admin)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Auction ID",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Auction rejected successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        404: { description: "Auction not found" },
        400: { description: "Rejection reason is required" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/admin/overview": {
    get: {
      tags: ["Admin"],
      summary: "Get overview statistics (admin)",
      responses: {
        200: { description: "Overview statistics retrieved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        404: { description: "Overview statistics not found" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/admin/payments/{itemId}/refund": {
    post: {
      tags: ["Admin"],
      summary: "Full refund a payment before the item is shipped (admin)",
      description:
        "Refunds the full paid amount via Stripe. Only allowed when payment is COMPLETED and delivery status is AWAITING_SHIPMENT.",
      parameters: [
        {
          name: "itemId",
          in: "path",
          required: true,
          description: "Item ID of the payment to refund",
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Payment refunded successfully" },
        400: {
          description:
            "not paid / already shipped or delivered / already refunded / Stripe refund failed",
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/admin/payments": {
    get: {
      tags: ["Admin"],
      summary: "List payments (admin)",
      description:
        "Returns all payments. Each item includes refundable (COMPLETED + AWAITING_SHIPMENT).",
      responses: {
        200: { description: "Payments retrieved successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — admin only" },
        500: { description: "Internal server error" },
      },
    },
  },
};
