import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

class VectorDbService {
  client: QdrantClient;
  openai: OpenAI;

  constructor(
    host: string = "localhost",
    port: number = 6333,
    apiKey: string = ""
  ) {
    console.log("🚀 ~ VectorDb ~ host:", host);

    this.client = new QdrantClient({
      host: host,
      apiKey: apiKey,
    });

    this.openai = new OpenAI();
  }

  private async _getVector(message: string) {
    const embedding = await this.openai.embeddings.create({
      input: message,
      model: "text-embedding-3-large",
      dimensions: 1536,
    });

    return embedding.data[0].embedding;
  }

  async createCollection() {
    await this.client.createCollection("chat", {
      vectors: { size: 1536, distance: "Cosine" },
    });
    await this.client.createCollection("discourse", {
      vectors: { size: 1536, distance: "Cosine" },
    });
  }

  private async _addMessage(
    collectionName: string,
    vector: number[],
    metadata: any
  ) {
    await this.client.upsert(collectionName, {
      points: [
        {
          id: uuidv4(),
          payload: metadata,
          vector,
        },
      ],
    });
  }

  async addMessageChat(
    message: string,
    metadata: { user_id: string; role: "assistant" | "user"; message: string }
  ) {
    const vector = await this._getVector(message);
    await this._addMessage("chat", vector, metadata);
  }

  async addMessageDiscourse(
    message: string,
    metadata: {
      post_id: string;
      topic_id: string;
      topic_title: string;
      content: string;
    }
  ) {
    const vector = await this._getVector(message);
    await this._addMessage("discourse", vector, metadata);
  }

  private async _search(
    collectionName: string,
    vector: number[],
    limit: number = 5,
    userId?: string
  ) {
    const points = await this.client.search(collectionName, {
      vector,
      filter: {
        must: [
          {
            key: "userId",
            match: {
              value: userId,
            },
          },
          {
            key: "role",
            match: {
              value: "assistant",
            },
          },
        ],
      },
      limit,
    });

    return points;
  }

  async searchChat(message: string, limit: number = 20, userId?: string) {
    const vector = await this._getVector(message);
    const points = await this._search("chat", vector, limit, userId);
    return points;
  }

  async searchDiscourse(message: string, limit: number = 3) {
    const vector = await this._getVector(message);
    const points = await this._search("discourse", vector, limit);
  }
}

export { VectorDbService };
