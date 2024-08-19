import axios from "axios";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import env from "~/environment";
import { VectorDbService } from "~/services/vectordb.service";

dotenv.config();

// Configuración de la API de Discourse
const discourseApiUrl = env.DISCOURSE_API_BASE_URL;
const discourseApiKey = env.DISCOURSE_API_KEY;
const discourseApiUsername = env.DISCOURSE_API_USERNAME;

// Configuración de OpenAI
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Configuración de Qdrant
// const qdrantClient = new QdrantClient({ url: env.QDRANT_API_URL });
// const qdrantCollectionName =
//   env.QDRANT_COLLECTION_NAME || "discourse_embeddings";
const qdrant = new VectorDbService(env.QDRANT_COLLECTION_NAME);

async function getTopics() {
  const response = await axios.get(`${discourseApiUrl}/latest.json`, {
    params: {
      api_key: discourseApiKey,
      api_username: discourseApiUsername,
    },
  });

  return response.data.topic_list.topics;
}

async function getPostsFromTopic(topicId: number) {
  const response = await axios.get(`${discourseApiUrl}/t/${topicId}.json`, {
    params: {
      api_key: discourseApiKey,
      api_username: discourseApiUsername,
    },
  });

  return response.data.post_stream.posts;
}

async function generateEmbeddings(content: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002", // Modelo de OpenAI para generar embeddings
    input: content,
  });

  return response.data[0].embedding;
}

async function processTopic(topic: any) {
  const posts = await getPostsFromTopic(topic.id);

  for (const post of posts) {
    let content = post.cooked.replace(/(<([^>]+)>)/gi, ""); // Remover etiquetas HTML

    if (content.length > 8192) {
      // Dividir el mensaje si es demasiado largo
      const paragraphs = content.split("\n\n"); // Dividir por párrafos

      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          // const embedding = await generateEmbeddings(paragraph.trim());
          const metadata = {
            post_id: post.id,
            topic_id: topic.id,
            topic_title: topic.title,
            content: paragraph.trim(),
          };
          await qdrant.addMessageDiscourse(paragraph.trim(), metadata);
          // await saveEmbeddingToQdrant(embedding, metadata);
        }
      }
    } else {
      // const embedding = await generateEmbeddings(content);
      const metadata = {
        post_id: post.id,
        topic_id: topic.id,
        topic_title: topic.title,
        content: content,
      };
      // await saveEmbeddingToQdrant(embedding, metadata);
      await qdrant.addMessageDiscourse(content, metadata);
    }
  }
}

async function main() {
  try {
    const topics = await getTopics();

    for (const topic of topics) {
      await processTopic(topic);
    }

    console.log(
      "Todos los mensajes han sido procesados y almacenados en Qdrant."
    );
  } catch (error) {
    console.error("Error procesando los temas:", error);
  }
}

main();
