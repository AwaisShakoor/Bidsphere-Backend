import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRouter from './src/modules/auth/auth.routes';
import cookieParser from 'cookie-parser';
import swaggerSpec from './src/config/swagger';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      docExpansion: 'none',
      tryItOutEnabled: true,
      withCredentials: true,
    },
  })
);
app.use("/api", authRouter);

app.get('/', (_request, response) => {
  response.json({ message: 'Bidsphere API is running' });
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Bidsphere API listening on port ${port}`);
});
