import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

class VectorDb {
  client: QdrantClient;
  openai: OpenAI;
  collectionName: string;

  constructor(
    collectionName: string,
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
    this.collectionName = collectionName;
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
    await this.client.createCollection(this.collectionName, {
      vectors: { size: 1536, distance: "Cosine" },
    });
  }

  async addMessage(message: string, metadata: any) {
    const vector = await this._getVector(message);

    await this.client.upsert(this.collectionName, {
      points: [
        {
          id: uuidv4(),
          payload: metadata,
          vector,
        },
      ],
    });
  }

  async search(message: string, userId?: string, limit: number = 20) {
    const vector = await this._getVector(message);

    // console.log(embedding.data[0].embedding);
    const points = await this.client.search(this.collectionName, {
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
}

export { VectorDb };
