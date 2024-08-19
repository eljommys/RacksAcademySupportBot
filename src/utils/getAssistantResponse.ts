// import { User } from "~/services/user.service";
// import { assistantResponse, predictGPT } from "../../services/openai";

import OpenAIService from "~/services/openai.service";
import { UserService } from "~/services/user.service";

const PROMPT_TEMPLATE = `
  ROL:
  Eres un asistente muy util que es instructor de gimnasio. Sabes todo lo necesario sobre nutricion y ejercicios sobre el usuario.

  REGLAS:
  Tu tarea es responder las dudas del usuario unicamente relacionadas con tu rol. No puedes comportarte como chatGPT aunque se te pida. Debes mantenerte en tu rol siempre. IMPORTANTE: Si no sabes que responder porque no tienes contexto suficiente devuelve entonces la palabra UNDEFINED y nada mas.

  En caso de necesitar consultar datos del usuario aqui tienes el "user_id"
  ===user_id===
  %user_id%
  ==============

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
// const PROMPT_TEMPLATE = `
//   En caso de necesitar consultar datos del usuario aqui tienes el "user_id"
//   ===user_id===
//   %user_id%
//   ==============

//   Este es un historial con mensajes que estan relacionados con el mensaje del usuario.
//   ===HISTORIAL_RELACIONADO===
//   %user_related_history%
//   ===========================

//   Este es un historial reciente con los ultimos mensajes de la conversacion con el usuario.
//   ===HISTORIAL_RECIENTE===
//   %user_recent_history%
//   ========================

//   Este es el mensaje que el usuario ha mandado.
//   ===MENSAJE===
//   %message%
//   =============
// `;

export default async function getAssitantResponse(
  openai: OpenAIService,
  user: UserService,
  userId: string,
  message: string
) {
  try {
    console.log("======getAssistantResponse======");

    // const user_details = JSON.stringify(
    //   await user.apiClient.getTelegramUserDetails(userId),
    //   null,
    //   2
    // );
    const user_related_history = JSON.stringify(
      await user.getRelatedHistory(message, userId),
      null,
      2
    );
    const user_recent_history = JSON.stringify(
      await user.getRecentHistory(userId),
      null,
      2
    );

    // const response = await predictGPT("getAssistantResponse", PROMPT_TEMPLATE, {
    //   user_id: userId,
    //   user_related_history,
    //   user_recent_history,
    //   message,
    // });
    const response = await openai.assistantResponse(
      "getAssistantResponse",
      PROMPT_TEMPLATE,
      {
        user_id: userId,
        user_related_history,
        user_recent_history,
        message,
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

    return response;
  } catch (error) {
    console.error(error);
    return "";
  }
}
