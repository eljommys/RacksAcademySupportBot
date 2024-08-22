import { DiscoursePost, DiscourseService } from "~/services/discourse.service";
import { MongoDBService } from "~/services/mongodb.service";

// Placeholder for the method to get the teacher's username from the database
async function _getTeacherUsernamesFromDb(
  mongodb: MongoDBService
): Promise<string[]> {
  const teachers = await this.mongodb.teachersCollection.find().toArray();
  const usernames = teachers.map((t) => t.discourse.username);
  // Implement the logic to fetch the teacher's username from your database
  return usernames; // Replace with actual implementation
}

export async function getTeacherResponses(
  mongodb: MongoDBService,
  discourse: DiscourseService,
  topicId: number
) {
  try {
    const topicResponse = await discourse.axiosInstance.get(
      `/t/${topicId}.json`
    );
    const posts = topicResponse.data.post_stream.posts;

    // Assuming you have a method to get the teacher's username from the database
    const teacherUsernames = await this._getTeacherUsernamesFromDb(mongodb);

    const teacherResponses = posts.filter((post: DiscoursePost) =>
      teacherUsernames.includes(post.username)
    );

    return teacherResponses;
  } catch (error) {
    console.error(`Error fetching teacher responses: ${error}`);
    return [];
  }
}
