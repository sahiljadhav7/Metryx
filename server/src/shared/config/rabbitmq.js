import config from "./index";
import logger from "./logger";
import amqp from "amqplib";

class RabbitMQConection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
  }

  async connect() {
    if (this.channel) {
      return this.channel;
    }
    if (this.isConnecting) {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return this.channel;
    }

    try {
      this.isConnecting = true;
      logger.info("COnnecting to RabbitMQ", config.rabbitmq.url);
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      const dlqName = `${config.rabbitmq.queue}.dlq`;

      await this.channel.assertQueue(dlqName, {
        durable: true,
      });

      await this.channel.assertQueue();

      this.isConnecting = false;
    } catch (error) {}
  }
}
