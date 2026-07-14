import dotenv from "dotenv";

dotenv.config();

const config = {
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/Metryx",
    dbName: process.env.MONGO_DB_NAME || "Metryx",
  },

  postgres: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "metryx",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "password",
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    queue: process.env.RABBITMQ_QUEUE || "api_hits",
    publisherConfirm:
      process.env.RABBITMQ_PUBLISHER_CONFIRM === "true" || false,
    retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || "1000", 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "1000", 10), // limit each IP to 100 requests per windowMs
  },
};

export default config;
