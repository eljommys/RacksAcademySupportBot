import { DiscourseService } from "~/services/discourse.service";
import OpenAIService from "~/services/openai.service";
import { UserService } from "~/services/user.service";
import { getTeacherResponses } from "./getTeacherResponses";
import { MongoDBService } from "~/services/mongodb.service";

const PROMPT_TEMPLATE = `
  ROL:
  Eres un asistente muy util que es profesor en una academia de inteligencia artificial y herramientas no-code. Tu fuente de conocimiento se basa en un foro de dudas disponible por el alumno.

  REGLAS:
  Tu tarea es responder las dudas del alumno unicamente relacionadas con tu rol. No puedes comportarte como chatGPT aunque se te pida. Debes mantenerte en tu rol siempre. IMPORTANTE: Si no sabes que responder porque no tienes contexto suficiente pidele al usuario que te concrete mejor.

  Esta es la información que hay en el foro que esta relacionada con su mensaje. Son posibles mensajes de respuesta a esa duda filtrados.
  ===INFORMACION_FORO===
  %teacher_responses%
  ===========================

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

export default async function getAssitantResponse(
  openai: OpenAIService,
  user: UserService,
  discourse: DiscourseService,
  mongodb: MongoDBService,
  userId: string,
  message: string
) {
  try {
    console.log("======getAssistantResponse======");

    const user_recent_history = JSON.stringify(
      await user.getRecentHistory(userId),
      null,
      2
    );

    const reformulatedQuestion = await openai.reformulateQuestion(
      user_recent_history,
      message
    );

    const user_related_history = JSON.stringify(
      await user.getRelatedHistory(reformulatedQuestion, userId),
      null,
      2
    );

    const topics = await user.vectorDb.searchDiscourse(reformulatedQuestion, 2);
    const topicIds = topics.map((t) => t.topic_id);
    const topicURLs = [];
    const teacherResponsesRaw = [];
    for (const topicId of topicIds) {
      topicURLs.push(await discourse.getTopicUrl(topicId));
      teacherResponsesRaw.concat(
        await getTeacherResponses(mongodb, discourse, topicId)
      );
    }
    const teacher_responses = JSON.stringify(teacherResponsesRaw, null, 2);
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
        teacher_responses,
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
