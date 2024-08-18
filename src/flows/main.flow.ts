import { addKeyword, EVENTS } from "@builderbot/bot";
import { BotContext, BotMethods } from "@builderbot/bot/dist/types";

export default addKeyword(EVENTS.WELCOME).addAction(
  (ctx: BotContext, methods: BotMethods) => {}
);
