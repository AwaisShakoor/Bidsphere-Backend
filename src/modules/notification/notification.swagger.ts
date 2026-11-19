export const notificationPaths = {
  "/api/me/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List my notifications",
      responses: {
        200: { description: "Notifications retrieved successfully" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/notifications/{notificationId}/read": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark a notification as read",
      parameters: [
        {
          in: "path",
          name: "notificationId",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Notification id from GET /me/notifications",
        },
      ],
      responses: {
        200: { description: "Notification marked as read" },
        401: { description: "Unauthorized" },
        404: { description: "Notification not found" },
        500: { description: "Internal server error" },
      },
    },
  },
  "/api/me/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark all notifications as read",
      responses: {
        200: { description: "All notifications marked as read" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },
};
