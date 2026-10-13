import swaggerJsdoc from "swagger-jsdoc";
import { authPaths } from "../modules/auth/auth.swagger";
import { categoryPaths } from "../modules/category/category.swagger";
import { itemPaths } from "../modules/items/item.swagger";
import { auctionPaths } from "../modules/auction/auction.swagger";

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
      ...categoryPaths,
      ...itemPaths,
      ...auctionPaths,
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;