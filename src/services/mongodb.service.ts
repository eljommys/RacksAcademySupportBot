import { MongoClient, Db, Collection, ServerApiVersion } from "mongodb";
import env from "~/environment";

type DbChatHistory = {
  createdAt: Date;
  message: string;
  userId: string;
  role: "user" | "assistant";
};

type DbTeacher = {
  whatsappNumber: string;
  discourse: {
    username: string;
    categories: number[];
  };
};

class MongoDBService {
  private client: MongoClient;
  private db: Db;
  public teachersCollection: Collection<DbTeacher>;
  public chatHistoryCollection: Collection<DbChatHistory>;
  private host: string;

  constructor(protocol: string, host: string, dbName: string, appName: string) {
    const username = env.MONGO_ROOT_USERNAME;
    const password = env.MONGO_ROOT_PASSWORD;
    const fullUri = `${protocol}://${username}:${password}@${host}?retryWrites=true&w=majority&appName=${appName}`;

    console.log(fullUri);
    this.host = host;
    this.client = new MongoClient(fullUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    this.db = this.client.db(dbName);
    this.teachersCollection = this.db.collection("teachers");
  }

  async connect() {
    console.log("Connecting to...", this.host);
    try {
      await this.client.connect();
      console.log("Connected successfully to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log("Disconnected successfully from MongoDB");
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }
}

export { DbChatHistory, MongoDBService, DbTeacher };
