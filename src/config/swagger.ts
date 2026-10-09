import swaggerJsdoc from "swagger-jsdoc";
import { authPaths } from "../modules/auth/auth.swagger";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bidsphere API",
      version: "1.0.0",
      description: "Bidsphere backend APIs",
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
    ],
    paths: {
      ...authPaths,
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;