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
  "/api/me/stripe/connect": {
    post: {
      tags: ["Payments"],
      summary: "Create Stripe Connect onboarding link for seller",
      responses: {
        200: { description: "Onboarding URL returned" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/stripe/status": {
    get: {
      tags: ["Payments"],
      summary: "Get my Stripe Connect status",
      responses: {
        200: { description: "Connect status retrieved" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/payouts": {
    get: {
      tags: ["Payments"],
      summary: "List my seller payouts",
      responses: {
        200: { description: "Payouts retrieved successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/stripe/balance": {
    get: {
      tags: ["Payments"],
      summary: "Get my Stripe Connect available/pending balance",
      responses: {
        200: { description: "Balance retrieved" },
        401: { description: "Unauthorized" },
        400: { description: "Stripe not connected" },
      },
    },
  },
  "/api/me/stripe/withdraw": {
    post: {
      tags: ["Payments"],
      summary: "Withdraw available Connect balance to bank (standard payout)",
      responses: {
        200: { description: "Payout created" },
        400: { description: "Insufficient balance / not connected" },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/api/payments/items/{itemId}/confirm": {
    post: {
      tags: ["Payments"],
      summary: "Confirm checkout after success page (sync if webhook missed)",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Payment confirmed / already completed" },
        400: {
          description: "Not paid on Stripe yet / invalid session / expired",
        },
        401: { description: "Unauthorized" },
        403: { description: "Not the buyer for this payment" },
        404: { description: "Payment not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/payments/items/{itemId}/ship": {
    post: {
      tags: ["Payments"],
      summary:
        "Seller marks item as shipped (holds payout until delivery confirm)",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                trackingNote: {
                  type: "string",
                  description: "Optional courier / tracking note",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Marked as shipped" },
        400: { description: "Invalid delivery state / already shipped" },
        401: { description: "Unauthorized" },
        403: { description: "Only the seller can mark shipped" },
        404: { description: "Payment not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/payments/items/{itemId}/deliver": {
    post: {
      tags: ["Payments"],
      summary: "Buyer confirms delivery and releases seller payout transfer",
      parameters: [
        {
          in: "path",
          name: "itemId",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Marked as delivered; payout transfer released" },
        400: {
          description:
            "Invalid delivery state (must be SHIPPED) / Stripe not connected",
        },
        401: { description: "Unauthorized" },
        403: { description: "Only the buyer can confirm delivery" },
        404: { description: "Payment not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/payments/items/{itemId}/refund-request": {
    post: {
      tags: ["Payments"],
      summary: "Buyer requests a refund (before item is shipped)",
      description:
        "Sets refundRequestedAt and refundRequestReason on the payment. Only the buyer. Only when COMPLETED + AWAITING_SHIPMENT.",
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
              required: ["reason"],
              properties: {
                reason: {
                  type: "string",
                  example: "Changed my mind before shipping",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Refund requested successfully" },
        400: {
          description:
            "Reason required / not paid / already shipped / already requested / already refunded",
        },
        401: { description: "Unauthorized" },
        403: { description: "Only the buyer can request a refund" },
        404: { description: "Payment not found" },
        500: { description: "Internal server error" },
      },
    },
  },
};
