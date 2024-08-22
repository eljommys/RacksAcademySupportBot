// import { connectDb } from "../mongoDB";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import env from "src/environment";
import * as fs from "fs";
import { ChatCompletionToolRunnerParams } from "openai/lib/ChatCompletionRunner";

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// if (OPENAI_API_KEY == undefined)
//   throw new Error("[.env] OPENAI_API_KEY is not defined");

// export type DbCost = {
//   userPhone: string;
//   inputTokens: number;
//   outputTokens: number;
//   modelName: "gpt-3.5-turbo-16k" | "gpt-4";
//   createdAt: number;
//   functionName: string;
// };

const REFORMULATION_TEMPLATE = `Dada la siguiente conversación y una pregunta de seguimiento, reformula la pregunta de seguimiento para que sea una pregunta independiente.

// Historial del chat:
// {%chat_history%}
// Pregunta de seguimiento: %question%
// Pregunta independiente:`;

// export async function monetizeUserOpenAI(
//   functionName: string,
//   userPhone: string,
//   inputTokens: number,
//   outputTokens: number,
//   modelName: "gpt-3.5-turbo-16k" | "gpt-4"
// ) {
//   const createdAt = Date.now();

//   const dbCost: DbCost = {
//     userPhone,
//     inputTokens,
//     outputTokens,
//     modelName,
//     createdAt,
//     functionName,
//   };

//   const db = await connectDb();
//   const collection = db.collection<DbCost>("cost");

//   await collection.insertOne(dbCost);
// }

//
// properties: {
//   userId: { type: "string" },
// },
type FunctionCallingType = {
  function: (_?: any) => Promise<any> | any | void;
  description: string;
  properties: any;
};

// export async function reformulateQuestion(
//   chat_history: string,
//   question: string,
//   userPhone: string
// ): Promise<string> {
//   const newQuestion = await predictGPT(
//     "reformulateQuestion",
//     REFORMULATION_TEMPLATE,
//     { chat_history, question },
//     userPhone
//   );

//   return newQuestion;
// }

class OpenAIService {
  private _getPrompt(template: string, templateValues: any) {
    for (const key in templateValues) {
      template = template.replace(`%${key}%`, templateValues[key]);
    }

    return template;
  }

  formatChatHistory(history: ChatCompletionMessageParam[]) {
    const tmp = [];

    for (let index = 0; index < 6; index++) {
      const element = history[index];
      if (element?.role === "assistant") {
        tmp.push(`Asistente:{${element.content}}`);
      }
      if (element?.role === "user") {
        tmp.push(`Cliente:{${element.content}}`);
      }
    }

    return tmp.join("\n");
  }

  async predictGPT(
    functionName: string,
    template: string,
    templateValues: any | null,
    // userPhone: string,
    model: "gpt-3.5-turbo-16k" | "gpt-4" = "gpt-3.5-turbo-16k",
    temperature: number = 1
  ): Promise<string> {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: 15 * 1000,
    });

    const prompt = templateValues
      ? this._getPrompt(template, templateValues)
      : template;

    console.log(`
    ------------------------${functionName}------------------------
    ${prompt}
    ------------------------------------------------
      `);
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: prompt,
      },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 256,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    // const inputTokens = completion.usage.prompt_tokens;
    // const outputTokens = completion.usage.completion_tokens;

    const result = completion.choices[0].message.content;

    // await monetizeUserOpenAI(
    //   functionName,
    //   userPhone,
    //   inputTokens,
    //   outputTokens,
    //   model
    // );

    return result;
  }

  // private async monetizeUserOpenAI(
  //     functionName: string,
  //     userPhone: string,
  //     inputTokens: number,
  //     outputTokens: number,
  //     modelName: "gpt-3.5-turbo-16k" | "gpt-4"
  //   ) {
  //     const createdAt = Date.now();

  //     const dbCost: DbCost = {
  //       userPhone,
  //       inputTokens,
  //       outputTokens,
  //       modelName,
  //       createdAt,
  //       functionName,
  //     };

  //     const collection = db.collection<DbCost>("cost");

  //     await collection.insertOne(dbCost);
  // }

  async assistantResponse(
    functionName: string,
    template: string,
    templateValues: any | null,
    functions: FunctionCallingType[],
    // userPhone: string,
    model: "gpt-4o-2024-05-13" | "gpt-3.5-turbo-16k" = "gpt-4o-2024-05-13",
    temperature: number = 1
  ) {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: 15 * 1000,
    });

    const prompt = templateValues
      ? this._getPrompt(template, templateValues)
      : template;

    console.log(`
      ------------------------${functionName}------------------------
      ${prompt}
      ------------------------------------------------
        `);

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: prompt,
      },
    ];

    const tools = functions.map((f) => {
      return {
        type: "function",
        function: {
          function: f.function,
          description: f.description,
          parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
          parameters: {
            type: "object",
            properties: f.properties,
          },
        },
      };
    });

    const runner = openai.beta.chat.completions.runTools({
      model,
      temperature,
      // max_tokens: 256,
      frequency_penalty: 0,
      presence_penalty: 0,
      messages,
      tools,
    } as ChatCompletionToolRunnerParams<any[]>);
    // .on("message", (message) => console.log(message));

    // const inputTokens = (await runner.totalUsage()).prompt_tokens;
    // const outputTokens = (await runner.totalUsage()).completion_tokens;

    // await _monetizeUserOpenAI(
    //   functionName,
    //   userPhone,
    //   inputTokens,
    //   outputTokens,
    //   model
    // );

    const finalContent = await runner.finalContent();

    return finalContent;
  }

  async reformulateQuestion(
    chat_history: string,
    question: string
  ): Promise<string> {
    const newQuestion = await this.predictGPT(
      "reformulateQuestion",
      REFORMULATION_TEMPLATE,
      { chat_history, question }
    );

    return newQuestion;
  }

  private async _voiceToText(path: any) {
    if (!fs.existsSync(path)) {
      throw new Error("No se encuentra el archivo");
    }
    try {
      const openai = new OpenAI();
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(path),
        model: "whisper-1",
      });

      return transcription.text;
    } catch (err) {
      return "ERROR";
    }
  }

  async useWhisper(filePath: string) {
    try {
      return await this._voiceToText(filePath);
    } catch (error) {
      console.error("Error en voiceToText:", error);
      throw error;
    }
  }
}

export default OpenAIService;
