import axios, { isAxiosError } from "axios";
import * as functions from "firebase-functions";
import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { admin, db } from "./firebaseAdmin.js"; // Import admin and db from firebaseAdmin.ts

interface PublishThreadPostArgs {
  threadTitle: string;
  posts: string[];
  hashtags: string[];
  accountId: string; // This is the scheduledPost.accountId, which is the client-side ID
  userId: string; // The Firebase Auth UID
}

// Ensure you have your Facebook App ID and App Secret configured in Firebase environment variables
// firebase functions:config:set facebook.app_id="YOUR_APP_ID" facebook.app_secret="YOUR_APP_SECRET"


export const exchangeFacebookTokenForThreadsInfo = onCall(async (request: CallableRequest<{ accessToken: string }>) => {
  const { accessToken } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  if (!accessToken) {
    throw new functions.https.HttpsError("invalid-argument", "Facebook Access Token is required.");
  }

  try {
    // 1. Exchange short-lived token for a long-lived token (recommended by Facebook)
    const longLivedTokenResponse = await axios.get<{ access_token: string }>(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${functions.config().facebook.app_id}&client_secret=${functions.config().facebook.app_secret}&fb_exchange_token=${accessToken}`
    );

    const longLivedAccessToken = longLivedTokenResponse.data.access_token;

    // 2. Get the Threads user ID (Instagram Business Account ID linked to Threads)
    // This requires the 'instagram_basic' and 'pages_show_list' permissions,
    // which are usually granted when connecting a Facebook Page.
    // For Threads, you typically get the Instagram Business Account ID first.
    const instagramAccountsResponse = await axios.get<{ data: { id: string }[] }>(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedAccessToken}`
    );

    const pages = instagramAccountsResponse.data.data;
    let instagramBusinessAccountId = null;

    for (const page of pages) {
      const instagramBusinessAccountResponse = await axios.get<{ instagram_business_account?: { id: string } }>(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${longLivedAccessToken}`
      );
      if (instagramBusinessAccountResponse.data.instagram_business_account) {
        instagramBusinessAccountId = instagramBusinessAccountResponse.data.instagram_business_account.id;
        break;
      }
    }

    if (!instagramBusinessAccountId) {
      throw new functions.https.HttpsError("failed-precondition", "No Instagram Business Account linked to a connected Facebook Page found.");
    }

    // Get the Instagram Business Account username
    const instagramUserResponse = await axios.get<{ username: string }>(
      `https://graph.facebook.com/v19.0/${instagramBusinessAccountId}?fields=username&access_token=${longLivedAccessToken}`
    );
    const threadsUsername = instagramUserResponse.data.username;

    // 3. Store the long-lived token and Threads user ID in Firestore
    await db.collection("users").doc(userId).set({
      threads: {
        accessToken: longLivedAccessToken,
        instagramBusinessAccountId: instagramBusinessAccountId, // This is effectively the Threads user ID for API calls
        username: threadsUsername,
        lastConnected: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, { merge: true });

    return { success: true, instagramBusinessAccountId: instagramBusinessAccountId, username: threadsUsername };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      console.error("Error in exchangeFacebookTokenForThreadsInfo:", error.response?.data || error.message);
      throw new functions.https.HttpsError("internal", "Failed to connect Threads account.", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Error in exchangeFacebookTokenForThreadsInfo:", error.message);
      throw new functions.https.HttpsError("internal", "Failed to connect Threads account.", error.message);
    } else {
      console.error("Error in exchangeFacebookTokenForThreadsInfo:", error);
      throw new functions.https.HttpsError("internal", "Failed to connect Threads account.");
    }
  }
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

    if (!threadsData || !threadsData.accessToken || !threadsData.instagramBusinessAccountId) {
      throw new functions.https.HttpsError("failed-precondition", "Threads account not connected for this user.");
    }

    const { accessToken, instagramBusinessAccountId } = threadsData;

    let previousPostId: string | null = null;
    const publishedPostIds: string[] = [];

    for (const postText of posts) {
      const postData: { caption: string; media_type: string; children?: string; } = {
        caption: postText + "\n" + hashtags.map((tag) => `#${tag}`).join(" "),
        media_type: "TEXT",
      };

      if (previousPostId) {
        postData.children = previousPostId;
      }

      // Create media container
      const containerResponse = await axios.post<{ id: string }>(
        `https://graph.threads.net/v1.0/${instagramBusinessAccountId}/media?access_token=${accessToken}`,
        postData
      );
      const containerId = containerResponse.data.id;

      // Publish media container
      const publishResponse = await axios.post<{ id: string }>(
        `https://graph.threads.net/v1.0/${instagramBusinessAccountId}/media_publish?creation_id=${containerId}&access_token=${accessToken}`
      );
      const publishedPostId = publishResponse.data.id;

      publishedPostIds.push(publishedPostId);
      previousPostId = publishedPostId;
    }

    return { success: true, publishedPostIds };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      console.error("Error publishing Threads post:", error.response?.data || error.message);
      throw new functions.https.HttpsError("internal", "Failed to publish Threads post.", error.response?.data || error.message);
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
