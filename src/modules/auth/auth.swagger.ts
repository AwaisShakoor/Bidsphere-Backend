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
        201: {
          description:
            "User created or existing inactive user updated. OTP sent successfully.",
        },
        400: { description: "User already exists (active account)" },
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
        200: { description: "Email verified successfully (sets auth cookie)" },
        400: { description: "Invalid or expired OTP" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/resend-otp": {
    post: {
      tags: ["Auth"],
      summary: "Resend email verification OTP for an inactive account",
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
        200: { description: "OTP sent successfully." },
        400: { description: "Email already verified" },
        404: { description: "User not found" },
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
        200: { description: "User login successfully (sets accessToken cookie)" },
        401: { description: "Invalid email or password" },
        403: {
          description:
            "Email not verified (code: EMAIL_NOT_VERIFIED). Show OTP screen.",
        },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Issue a new access token from the refreshToken cookie",
      parameters: [
        {
          in: "cookie",
          name: "refreshToken",
          required: true,
          schema: { type: "string" },
          description: "Set by login, verify-email, or reset-password",
        },
      ],
      responses: {
        200: { description: "New token and refreshToken cookies set" },
        401: { description: "Missing or invalid refresh token" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/logout": {
    delete: {
      tags: ["Auth"],
      summary: "Logout user and clear accessToken and refreshToken cookies",
      responses: {
        200: { description: "Both cookies cleared and refresh token removed from Redis" },
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
        200: { description: "OTP sent successfully." },
        400: { description: "User not found" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/verify-reset-otp": {
    post: {
      tags: ["Auth"],
      summary: "Verify password-reset OTP and get a short-lived resetToken",
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
        200: { description: "OTP verified. Returns resetToken (valid 10 minutes)." },
        400: { description: "Invalid or expired OTP" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Set a new password using resetToken from verify-reset-otp",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["resetToken", "newPassword"],
              properties: {
                resetToken: { type: "string", example: "a1b2c3..." },
                newPassword: { type: "string", example: "NewPass123@" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Password reset successfully (sets auth cookie)" },
        400: { description: "Invalid or expired reset token" },
        500: { description: "Internal server error" },
      },
    },
  },
};
