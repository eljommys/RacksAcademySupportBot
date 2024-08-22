import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

type DiscourseEmbeddingMetadata = {
  post_id: number;
  topic_id: number;
  topic_title: string;
  content: string;
};

type ChatEmbeddingMetadata = {
  from: string;
  role: "assistant" | "user";
  message: string;
};

class VectorDbService {
  client: QdrantClient;
  openai: OpenAI;

  constructor(
    openai: OpenAI,
    host: string = "localhost",
    apiKey: string,
    port: number = 6333
  ) {
    console.log("🚀 ~ VectorDb ~ host:", host);

    this.client = new QdrantClient({
      host: host,
      apiKey: apiKey,
    });

    this.openai = openai;
  }

  private async _getVector(message: string) {
    const embedding = await this.openai.embeddings.create({
      input: message,
      model: "text-embedding-3-large",
      dimensions: 1536,
    });

    return embedding.data[0].embedding;
  }

  async initialize() {
    try {
      await this.client.createCollection("chat", {
        vectors: { size: 1536, distance: "Cosine" },
      });
      await this.client.createCollection("discourse", {
        vectors: { size: 1536, distance: "Cosine" },
      });
    } catch (error) {
      console.error(`VectorDbService: Error creating collections: ${error}`);
    }
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

  async addMessageChat(message: string, metadata: ChatEmbeddingMetadata) {
    const vector = await this._getVector(message);
    await this._addMessage("chat", vector, metadata);
  }

  async addMessageDiscourse(
    message: string,
    metadata: DiscourseEmbeddingMetadata
  ) {
    const vector = await this._getVector(message);
    await this._addMessage("discourse", vector, metadata);
  }

  private async _search<T>(
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

    return points.map((p) => p.payload) as T[];
  }

  async searchChat(message: string, limit: number = 20, userId?: string) {
    const vector = await this._getVector(message);
    const points = await this._search<ChatEmbeddingMetadata>(
      "chat",
      vector,
      limit,
      userId
    );
    return points;
  }

  async searchDiscourse(message: string, limit: number = 3) {
    const vector = await this._getVector(message);
    const points = await this._search<DiscourseEmbeddingMetadata>(
      "discourse",
      vector,
      limit
    );
    return points;
  }
}

export { VectorDbService };
