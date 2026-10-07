export const authPaths = {
  "/api/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user and send email OTP",
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
        201: { description: "User created (inactive). OTP sent to email" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Verify email with OTP after register",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: { type: "string", example: "newtestuser@gmail.com" },
                otp: { type: "string", example: "123456" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Email verified successfully" },
        400: { description: "Invalid or expired OTP" },
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
  "/api/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request password reset OTP",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", example: "newtestuser@gmail.com" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "OTP sent to email" },
        400: { description: "User not found" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password with OTP",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp", "newPassword"],
              properties: {
                email: { type: "string", example: "newtestuser@gmail.com" },
                otp: { type: "string", example: "123456" },
                newPassword: { type: "string", example: "NewPass123@" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Password reset successfully" },
        400: { description: "Invalid or expired OTP" },
        500: { description: "Internal server error" },
      },
    },
  },
};
