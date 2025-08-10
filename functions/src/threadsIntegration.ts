import axios, { isAxiosError } from "axios";
import * as functions from "firebase-functions";
import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { db, FieldValue } from "./firebaseAdmin.js"; // Import db and FieldValue from firebaseAdmin.ts
// Dummy change to force redeployment

interface PublishThreadPostArgs {
  threadTitle: string;
  posts: string[];
  hashtags: string[];
  accountId: string; // This is the scheduledPost.accountId, which is the client-side ID
  userId: string; // The Firebase Auth UID
}

// Ensure you have your Facebook App ID and App Secret configured in Firebase environment variables
// firebase functions:config:set facebook.app_id="YOUR_APP_ID" facebook.app_secret="YOUR_APP_SECRET"

export const exchangeThreadsCodeForAccessToken = onCall(async (request: CallableRequest<{ code: string; redirectUri: string }>) => {
  console.log("exchangeThreadsCodeForAccessToken: Function started.");
  const { code, redirectUri } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  if (!code || !redirectUri) {
    throw new functions.https.HttpsError("invalid-argument", "Authorization code and redirect URI are required.");
  }

  try {
    console.log("Attempting to exchange Threads code for access token.");
    console.log("App ID from config:", process.env.FACEBOOK_APP_ID);
    console.log("App Secret from config:", process.env.FACEBOOK_APP_SECRET ? "[SET]" : "[NOT SET]");

    // 1. Exchange authorization code for a short-lived Threads access token
    const tokenExchangeResponse = await axios.post<{ access_token: string; expires_in: number }>(
      "https://graph.threads.net/oauth/access_token",
      null, // No body for GET, but axios.post expects it
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code: code,
        },
      }
    );

    const shortLivedAccessToken = tokenExchangeResponse.data.access_token;

    // Use the token from the first step directly, assuming it's long-lived enough or the next step is not needed
    const longLivedAccessToken = shortLivedAccessToken;

    // 3. Get Threads user ID and username
    const threadsMeResponse = await axios.get<{ id: string; username: string }>
      (`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${longLivedAccessToken}`)

    const threadsUserId = threadsMeResponse.data.id;
    const threadsUsername = threadsMeResponse.data.username;

    // 4. Store the long-lived token and Threads user ID in Firestore
    await db.collection("users").doc(userId).set({
      threads: {
        accessToken: longLivedAccessToken,
        threadsUserId: threadsUserId,
        username: threadsUsername,
        lastConnected: FieldValue.serverTimestamp(),
      },
    }, { merge: true });

    return { success: true, threadsUserId: threadsUserId, username: threadsUsername };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      console.error("Error in exchangeThreadsCodeForAccessToken:", JSON.stringify(error.response?.data) || error.message);
      throw new functions.https.HttpsError("internal", "Failed to exchange Threads code for access token.", JSON.stringify(error.response?.data) || error.message);
    } else if (error instanceof Error) {
      console.error("Error in exchangeThreadsCodeForAccessToken:", error.message);
      throw new functions.https.HttpsError("internal", "Failed to exchange Threads code for access token.", error.message);
    } else {
      console.error("Error in exchangeThreadsCodeForAccessToken:", error);
      throw new functions.https.HttpsError("internal", "Failed to exchange Threads code for access token.");
    }
  }
});

// Deprecate or remove exchangeFacebookTokenForThreadsInfo as it's replaced by the Threads-specific flow
export const exchangeFacebookTokenForThreadsInfo = onCall(async (request: CallableRequest<{ accessToken: string }>) => {
  throw new functions.https.HttpsError("unimplemented", "This function is deprecated. Use exchangeThreadsCodeForAccessToken instead.");
});

/**
 * Publishes a thread to Threads API.
 * @param {object} args - Arguments for publishing the thread.
 * @param {string} args.threadTitle - The title of the thread.
 * @param {string[]} args.posts - An array of post texts.
 * @param {string[]} args.hashtags - An array of hashtags.
 * @param {string} args.accountId - The client-side account ID.
 * @param {string} args.userId - The Firebase Auth UID.
 */
export async function _publishThreadPostLogic({ posts, hashtags, userId }: Omit<PublishThreadPostArgs, "threadTitle" | "accountId"> & { userId: string }) {
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User data not found.");
    }

    const userData = userDoc.data();
    const threadsData = userData?.threads;

    if (!threadsData || !threadsData.accessToken || !threadsData.threadsUserId) {
      throw new functions.https.HttpsError("failed-precondition", "Threads account not connected for this user.");
    }

    const { accessToken, threadsUserId } = threadsData;

    const hashtagString = hashtags.map((tag) => `#${tag}`).join(" ");
    const publishedPostIds: string[] = [];

    // Publish each post individually
    for (const postText of posts) {
      const postData = {
        text: postText + "\n" + hashtagString,
        media_type: "TEXT",
      };

      // Create media container
      const containerResponse = await axios.post<{ id: string }>(
        `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const containerId = containerResponse.data.id;

      // Publish media container
      const publishResponse = await axios.post<{ id: string }>(
        `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
        {
          creation_id: containerId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      publishedPostIds.push(publishResponse.data.id);
    }

    return { success: true, publishedPostIds };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      console.error("Error publishing Threads post:", JSON.stringify(error.response?.data) || error.message);
      throw new functions.https.HttpsError("internal", "Failed to publish Threads post.", JSON.stringify(error.response?.data) || error.message);
    } else {
      console.error("Error publishing Threads post:", error);
      throw new functions.https.HttpsError("internal", "Failed to publish Threads post.");
    }
  }
}

export const publishThreadPost = onCall(async (request: CallableRequest<{ threadTitle: string; posts: string[]; hashtags: string[]; accountId: string; }>) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  return _publishThreadPostLogic({ ...request.data, userId });
});