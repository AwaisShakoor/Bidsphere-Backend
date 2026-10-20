import swaggerJsdoc from "swagger-jsdoc";
import { authPaths } from "../modules/auth/auth.swagger";
import { auctionPaths } from "../modules/auction/auction.swagger";
import { categoryPaths } from "../modules/categories/categories.swagger";
import { itemPaths } from "../modules/items/items.swagger";

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
      ...auctionPaths,
      ...categoryPaths,
      ...itemPaths,
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
