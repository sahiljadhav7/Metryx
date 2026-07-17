import mongoose from "mongoose";
import config from "./index";
import logger from "./logger";

class MongoConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (this.connection) {
        logger.info("Mongodb already connected");
        return this.connection;
      }
      await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName,
      });
      logger.info(`Mongodb connected: ${config.mongo.uri}`);

      this.connection.on("error", (err) => {
        logger.error("Mongodb Connection unsuccesful ", err);
      });
      this.connection.on("disconnected", () => {
        logger.error("Mongodb Disconnected ", err);
      });

      return this.connection;
    } catch (error) {
      logger.error("failed to connnect to MongoDB:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info("Mongodb disconnected");
      }
    } catch (error) {
      logger.error("failed to disconnnect to MongoDB:", error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

export default MongoConnection;
