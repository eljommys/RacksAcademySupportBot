import { Collection } from "mongodb";
import { VectorDbService } from "./vectordb.service";
import { DbChatHistory, MongoDBService } from "./mongodb.service";
// import { VectorDb } from "./vector.db.class";
// import { ApiClient } from "../services/api.client";
// import { DbChatHistory, MongoDb } from "src/services/mongo.db";

class UserService {
  mongoCollection: Collection<DbChatHistory>;
  vectorDb: VectorDbService;

  constructor(vectorDb: VectorDbService) {
    this.mongoCollection = null;
    this.vectorDb = vectorDb;
  }

  async initializeDb(mongoDb: MongoDBService) {
    this.mongoCollection = mongoDb.chatHistoryCollection;
    try {
      await this.vectorDb.createCollection();
    } catch (error) {
      console.error("[ERROR]initializeDb():", error);
    }
  }

  async addHistory(
    message: string,
    userId: string,
    role: "user" | "assistant"
  ) {
    await this.vectorDb.addMessageChat(message, {
      user_id: userId,
      role,
      message,
    });
    await this.mongoCollection.insertOne({
      createdAt: new Date(),
      message,
      userId,
      role,
    });
  }

  async getRecentHistory(userId: string) {
    return await this.getHistory(userId, 6);
  }

  async getHistory(userId: string, rows = 25) {
    const rawHistory = await this.mongoCollection
      .find({ userId })
      .sort({ _id: -1 })
      .limit(rows)
      .toArray();

    const history = rawHistory
      .slice(1)
      .map((e) => ({
        message: e.message,
        role: e.role,
      }))
      .reverse();

    return history;
  }

  async getRelatedHistory(message: string, userId: string) {
    const rawHistory = await this.vectorDb.searchChat(message, 5, userId);
    const history = rawHistory.map((e) => ({
      message: e.payload.message,
      role: e.payload.role,
    }));

    return history;
  }

  async getQAPrompt() {
    return "";
  }

  async finishSetup(userId: number) {}
}

export { UserService };
