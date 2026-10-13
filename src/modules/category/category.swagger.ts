export const categoryPaths = {
  "/api/categories": {
    get: {
      tags: ["Category"],
      summary: "List all categories",
      responses: {
        200: { description: "Categories retrieved successfully" },
        500: { description: "Internal server error" },
      },
    },
  },
};
