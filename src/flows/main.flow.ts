import { addKeyword, EVENTS } from "@builderbot/bot";
import { BotContext, BotMethods } from "@builderbot/bot/dist/types";
import lacksContextLayer from "~/layers/lacksContext.layer";
import { DiscourseService } from "~/services/discourse.service";
import { MongoDBService } from "~/services/mongodb.service";
import OpenAIService from "~/services/openai.service";
import { UserService } from "~/services/user.service";
import getAssistantResponse from "~/utils/getAssistantResponse";

export default addKeyword(EVENTS.WELCOME)
  .addAction(lacksContextLayer)
  .addAction(async (ctx: BotContext, methods: BotMethods) => {
    // console.log("======QA======");
    const user = methods.extensions.user as UserService;
    const openai = methods.extensions.openai as OpenAIService;
    const discourse = methods.extensions.discourse as DiscourseService;
    const mongodb = methods.extensions.mongodb as MongoDBService;

    const { response, topics } = await getAssistantResponse(
      openai,
      user,
      discourse,
      mongodb,
      ctx.from,
      ctx.caption
    );
    // console.log(response);
    await methods.flowDynamic([
      {
        body: response,
      },
    ]);
    await methods.flowDynamic("Puede que estos hilos te sean de utilidad");
    for (const topic of topics) {
      await methods.flowDynamic(`${topic.topicTitle}\n${topic.topicURL}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  });
