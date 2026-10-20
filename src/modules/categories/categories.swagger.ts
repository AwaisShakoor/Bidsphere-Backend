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
    "/api/category/{slug}/items": {
      get: {
        tags: ["Categories"],
        summary: "List active items in a category",
        parameters: [
          {
            in: "path",
            name: "slug",
            required: true,
            schema: { type: "string", example: "electronics" },
          },
        ],
        responses: {
          200: { description: "Active items for this category" },
          500: { description: "Category not found / internal server error" },
        },
      },
    },
  };