import { createBot, createProvider, createFlow } from "@builderbot/bot";
// import { MemoryDB as Database } from "@builderbot/bot";
import { MongoAdapter as Database } from "@builderbot/database-mongo";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import flows from "./flows";
import env from "./environment";
import { UserService } from "./services/user.service";
import { VectorDbService } from "./services/vectordb.service";
import { MongoDBService } from "./services/mongodb.service";

const PORT = env.PORT;

const main = async () => {
  const adapterFlow = createFlow(flows);

  const adapterProvider = createProvider(Provider);

  const mongoConnectionURL = `${env.MONGO_PROTOCOL}://${env.MONGO_ROOT_USERNAME}:${env.MONGO_ROOT_PASSWORD}@${env.MONGO_HOST}?retryWrites=true&w=majority&appName=${env.MONGO_APP_NAME}`;
  const adapterDB = new Database({
    dbUri: mongoConnectionURL,
    dbName: env.MONGO_DATABASE,
  });

  const vectorDb = new VectorDbService(
    env.QDRANT_HOST,
    Number(env.QDRANT_PORT),
    env.QDRANT_API_KEY
  );

  const mongodb = new MongoDBService(
    env.MONGO_PROTOCOL,
    env.MONGO_HOST,
    env.MONGO_DATABASE,
    env.MONGO_APP_NAME
  );
  await mongodb.connect();

  const user = new UserService(vectorDb);
  await user.initializeDb(mongodb);

  const extensions = {
    // chatwoot,
    database: adapterDB,
    user,
    // apiClient,
  };

  const settings = {
    globalState: {
      inbox_id: 1,
    },
    extensions,
  };

  const { handleCtx, httpServer } = await createBot(
    {
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    },
    settings
  );

  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end("sended");
    })
  );

  adapterProvider.server.post(
    "/v1/register",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("REGISTER_FLOW", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/samples",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("SAMPLES", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/blacklist",
    handleCtx(async (bot, req, res) => {
      const { number, intent } = req.body;
      if (intent === "remove") bot.blacklist.remove(number);
      if (intent === "add") bot.blacklist.add(number);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", number, intent }));
    })
  );

  httpServer(+PORT);
};

main();
