import * as dotenv from "dotenv";
import { join } from "node:path";

const envFilePath = join(process.cwd(), ".env");
dotenv.config({ path: envFilePath });

function processEnvironment() {
  const rawVars = {
    DISCOURSE_API_BASE_URL: process.env.DISCOURSE_API_BASE_URL,
    DISCOURSE_API_KEY: process.env.DISCOURSE_API_KEY,
    DISCOURSE_API_USERNAME: process.env.DISCOURSE_API_USERNAME,
    PORT: process.env.PORT,
    MONGO_DATABASE: process.env.MONGO_DATABASE,
    MONGO_APP_NAME: process.env.MONGO_APP_NAME,
    MONGO_PROTOCOL: process.env.MONGO_PROTOCOL,
    MONGO_HOST: process.env.MONGO_HOST,
    MONGO_ROOT_USERNAME: process.env.MONGO_ROOT_USERNAME,
    MONGO_ROOT_PASSWORD: process.env.MONGO_ROOT_PASSWORD,
    QDRANT_HOST: process.env.QDRANT_HOST,
    QDRANT_PORT: process.env.QDRANT_PORT,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME,
    IS_DEVELOP: process.env.IS_DEVELOP,
  };

  for (const key in rawVars) {
    if (rawVars[key] == undefined)
      throw new Error(`[.env] ${key} is not defined`);
  }

  return rawVars;
}

const env = processEnvironment();

export default env;
