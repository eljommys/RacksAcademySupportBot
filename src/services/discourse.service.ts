import axios, { AxiosInstance, AxiosResponse } from "axios";
import { MongoDBService } from "./mongodb.service";

export interface DiscourseConfig {
  baseUrl: string;
  apiKey: string;
  apiUsername: string;
}

export interface DiscoursePost {
  id: number;
  name: string;
  username: string;
  avatar_template: string;
  created_at: string;
  cooked: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number?: number;
  quote_count: number;
  incoming_link_count: number;
  reads: number;
  score: number;
  yours: boolean;
  topic_id: number;
  topic_slug: string;
  display_username: string;
  primary_group_name?: string;
  primary_group_flair_url?: string;
  primary_group_flair_bg_color?: string;
  primary_group_flair_color?: string;
  version: number;
  can_edit: boolean;
  can_delete: boolean;
  can_recover: boolean;
  can_wiki: boolean;
  user_title?: string;
  actions_summary: Array<{
    id: number;
    can_act: boolean;
  }>;
  moderator: boolean;
  admin: boolean;
  staff: boolean;
  user_id: number;
  hidden: boolean;
  trust_level: number;
  deleted_at?: string;
  user_deleted: boolean;
  edit_reason?: string;
  can_view_edit_history: boolean;
  wiki: boolean;
}

export interface DiscourseTopic {
  id: number;
  title: string;
  last_posted_at: string;
  last_poster_username: string;
  last_poster_user_id: number;
  slug: string;
  category_id: number;
  closed: boolean;
}

export interface DiscourseCategory {
  id: number;
  name: string;
  parent_category_id?: number;
}

export interface DiscourseCategoryDetailsResponse {
  category: DiscourseCategory;
}

export interface DiscourseTopicWithCategory {
  id: number;
  url: string;
  title: string;
  last_posted_at: string;
  category: {
    id: number;
    name: string;
  };
}

export class DiscourseService {
  axiosInstance: AxiosInstance;

  constructor(private config: DiscourseConfig) {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        "Api-Key": this.config.apiKey,
        "Api-Username": this.config.apiUsername,
        "Content-Type": "application/json",
      },
    });
  }

  // Método para obtener temas recientes
  async getLatestTopics(): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.get("/latest.json");
      return response;
    } catch (error) {
      throw new Error(`Error fetching latest topics: ${error}`);
    }
  }

  // Método para crear un nuevo tema
  async createTopic(
    title: string,
    raw: string,
    category?: number
  ): Promise<AxiosResponse> {
    try {
      const payload = {
        title,
        raw,
        category,
      };
      const response = await this.axiosInstance.post("/posts", payload);
      return response;
    } catch (error) {
      throw new Error(`Error creating topic: ${error}`);
    }
  }

  // Método para obtener la información de un usuario por su nombre de usuario
  async getUserByUsername(username: string): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.get(`/u/${username}.json`);
      return response;
    } catch (error) {
      throw new Error(`Error fetching user data: ${error}`);
    }
  }

  // Método para crear un post en un tema existente
  async createPost(topicId: number, raw: string): Promise<AxiosResponse> {
    try {
      const payload = {
        topic_id: topicId,
        raw,
      };
      const response = await this.axiosInstance.post("/posts", payload);
      return response;
    } catch (error) {
      throw new Error(`Error creating post: ${error}`);
    }
  }

  // Método para obtener la lista de categorías
  async getCategories(): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.get("/categories.json");
      return response;
    } catch (error) {
      throw new Error(`Error fetching categories: ${error}`);
    }
  }

  // Método para obtener mensajes privados del usuario autenticado
  async getPrivateMessages(): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.get(
        "/topics/private-messages.json"
      );
      return response;
    } catch (error) {
      throw new Error(`Error fetching private messages: ${error}`);
    }
  }

  // Método para enviar un mensaje privado
  async sendPrivateMessage(
    title: string,
    raw: string,
    targetUsernames: string[]
  ): Promise<AxiosResponse> {
    try {
      const payload = {
        title,
        raw,
        target_usernames: targetUsernames.join(","), // Lista de nombres de usuario a los que se envía el mensaje
        archetype: "private_message",
      };
      const response = await this.axiosInstance.post("/posts", payload);
      return response;
    } catch (error) {
      throw new Error(`Error sending private message: ${error}`);
    }
  }

  // Método para responder a un mensaje privado
  async replyToPrivateMessage(
    topicId: number,
    raw: string
  ): Promise<AxiosResponse> {
    try {
      const payload = {
        topic_id: topicId,
        raw,
      };
      const response = await this.axiosInstance.post("/posts", payload);
      return response;
    } catch (error) {
      throw new Error(`Error replying to private message: ${error}`);
    }
  }

  async getTopicUrl(topicId: number): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/t/${topicId}.json`);
      const topicSlug = response.data.slug;
      const topicUrl = `${this.axiosInstance.defaults.baseURL}/t/${topicSlug}/${topicId}`;
      return topicUrl;
    } catch (error) {
      throw new Error(`Error fetching topic URL: ${error}`);
    }
  }
}
