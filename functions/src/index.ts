import { onSchedule } from "firebase-functions/v2/scheduler";
import { _publishThreadPostLogic, exchangeThreadsCodeForAccessToken, publishThreadPost } from "./threadsIntegration.js";
import { admin, db } from "./firebaseAdmin.js";

export { exchangeThreadsCodeForAccessToken, publishThreadPost };

// This function will be triggered periodically (e.g., every hour)
// to check for scheduled posts that are due.
export const processScheduledPosts = onSchedule("every 1 hours", async () => {
  console.log("Running scheduled post processor...");

    const now = admin.firestore.Timestamp.now();

    // Get all users
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const scheduledPosts = userData.scheduledPosts || [];

      const postsToPublish = [];
      const remainingScheduledPosts = [];

      for (const post of scheduledPosts) {
        const postDateTime = new Date(`${post.date}T${post.time}`);
        if (postDateTime <= now.toDate()) {
          postsToPublish.push(post);
        } else {
          remainingScheduledPosts.push(post);
        }
      }

      if (postsToPublish.length > 0) {
        console.log(
          `User ${userId}: Found ${postsToPublish.length} posts to publish.`
        );
        // In a real application, you would integrate with social media APIs here
        // For now, we just log them and remove them from scheduledPosts
        for (const publishedPost of postsToPublish) {
          if (publishedPost.platform === "Threads") {
            try {
              console.log(`Attempting to publish Threads post for user ${userId}: ${publishedPost.threadTitle}`);
              // Call the publishThreadPost function
              await _publishThreadPostLogic({
                posts: publishedPost.posts,
                hashtags: publishedPost.hashtags,
                userId: userId,
              });
              console.log(`SUCCESS: Threads post published for user ${userId}: ${publishedPost.threadTitle}`);
            } catch (publishError) {
              const error = publishError as Error;
              console.error(`ERROR: Failed to publish Threads post for user ${userId}: ${publishedPost.threadTitle}`, error.message);
            }
          } else {
            console.log(
              `PUBLISHING (simulated) for user ${userId} on ${publishedPost.platform}: ${publishedPost.threadTitle}`
            );
          }
        }

        // Update the user's scheduledPosts in Firestore
        await userDoc.ref.update({ scheduledPosts: remainingScheduledPosts });
        console.log(`User ${userId}: Updated scheduled posts.`);
      }
    }

    console.log("Scheduled post processor finished.");
    return;
  });
