import config from "../../shared/config/index.js";
import logger from "../../shared/config/logger.js";
import mongodb from "../../shared/config/mongodb.js";
import postgres from "../../shared/config/postgres.js";
import rabbitmq from "../../shared/config/rabbitmq.js";

async function initializeConnections() {
  logger.info("Initializing consumer connections...");

  await mongodb.connect();
  await postgres.testConnection();
  await rabbitmq.connect();
}

async function startConsumer() {
  try {
    await initializeConnections();

    const channel = rabbitmq.getchannel();
    if (!channel) {
      throw new Error("RabbitMQ channel is not available");
    }

    await channel.prefetch(10);

    await channel.consume(config.rabbitmq.queue, async (message) => {
      if (!message) {
        logger.warn("Consumer received an empty message");
        return;
      }

      try {
        const payload = JSON.parse(message.content.toString());
        logger.info("Processed queue message", {
          queue: config.rabbitmq.queue,
          eventId: payload.eventId ?? null,
        });

        channel.ack(message);
      } catch (error) {
        logger.error("Failed to process queue message", error);
        channel.nack(message, false, false);
      }
    });

    logger.info(`Consumer listening on queue ${config.rabbitmq.queue}`);
  } catch (error) {
    logger.error("Failed to start consumer", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down consumer gracefully`);

  try {
    await rabbitmq.close();
    await postgres.close();
    await mongodb.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Error during consumer shutdown", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

startConsumer();
