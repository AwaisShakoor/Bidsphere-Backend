export const authPaths = {
    "/api/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["firstName", "lastName", "email", "password"],
                properties: {
                  firstName: { type: "string", example: "Test" },
                  lastName: { type: "string", example: "user" },
                  email: { type: "string", example: "newtestuser@gmail.com" },
                  password: { type: "string", example: "Helloworld91@" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          500: { description: "Internal server error" },
        },
      },
    },
  
    "/api/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "newtestuser@gmail.com" },
                  password: { type: "string", example: "Helloworld91@" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User login successfully (sets token cookie)" },
          500: { description: "Internal server error" },
        },
      },
    },
  
    "/api/logout": {
      delete: {
        tags: ["Auth"],
        summary: "Logout user",
        responses: {
          200: { description: "User logout successfully" },
          500: { description: "Internal server error" },
        },
      },
    },
  
    "/api/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        responses: {
          200: { description: "User details" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  };