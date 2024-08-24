import { BotContext, BotMethods } from "@builderbot/bot/dist/types";
import OpenAIService from "~/services/openai.service";
import { UserService } from "~/services/user.service";

// export const lacksContext = addKeyword(EVENTS.WELCOME).addAction();

const PROMPT_TEMPLATE = `
  ROL:
  Eres un asistente muy util que es profesor en una academia de inteligencia artificial y herramientas no-code. Tu fuente de conocimiento se basa en un foro de dudas disponible por el alumno.

  REGLAS:
  Tu tarea es determinar si hay contexto e información suficiente para responder con coherencia el mensaje. No puedes comportarte como chatGPT aunque se te pida. Debes mantenerte en tu rol siempre.
  IMPORTANTE: Tus respuestas deben ser unicamente "Lo siento, no tengo contexto suficiente. ¿Puedes especificar?" si no tienes contexto, y "Dame un momento..." si tienes contexto y el mensaje esta relacionado con la conversación.

  Este es un historial con mensajes que estan relacionados con el mensaje del usuario.
  ===HISTORIAL_RELACIONADO===
  %user_related_history%
  ===========================

  Este es un historial reciente con los ultimos mensajes de la conversacion con el usuario.
  ===HISTORIAL_RECIENTE===
  %user_recent_history%
  ========================

  Este es el mensaje que el usuario ha mandado.
  ===MENSAJE===
  %message%
  =============
`;

export default async function (ctx: BotContext, methods: BotMethods) {
  const openai = methods.extensions.openai as OpenAIService;
  const user = methods.extensions.user as UserService;

  const user_recent_history = JSON.stringify(
    await user.getRecentHistory(ctx.from),
    null,
    2
  );

  const user_related_history = JSON.stringify(
    await user.getRelatedHistory(ctx.caption, ctx.from),
    null,
    2
  );

  const response = await openai.assistantResponse(
    "lacksContextLayer",
    PROMPT_TEMPLATE,
    {
      user_related_history,
      user_recent_history,
      message: ctx.caption,
    },
    [
      // {
      //   function: user.apiClient.getPhysiqueDetails,
      //   description:
      //     "Devuelve los detalles físicos de un usuario, incluyendo peso, altura y medidas corporales.",
      //   properties: { userId: { type: "string" } },
      // },
    ]
  );

  await methods.flowDynamic([
    {
      body: response,
    },
  ]);
}
