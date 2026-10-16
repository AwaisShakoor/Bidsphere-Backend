export const categoryPaths = {
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories",
        responses: {
          200: { description: "Categories list" },
          500: { description: "Internal server error" },
        },
      },
    },
  };