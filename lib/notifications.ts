import { prisma } from "@/lib/prisma";

export async function createFollowNotification(followerId: string, followingId: string) {
  try {
    await prisma.notification.create({
      data: {
        type: "FOLLOW",
        message: "started following you",
        recipientId: followingId,
        senderId: followerId,
      },
    });
  } catch (error) {
    console.error("Error creating follow notification:", error);
  }
}

export async function createLikeNotification(
  userId: string, 
  postId: string, 
  postAuthorId: string
) {
  try {
    // Don't notify if user likes their own post
    if (userId === postAuthorId) return;

    await prisma.notification.create({
      data: {
        type: "LIKE",
        message: "liked your post",
        recipientId: postAuthorId,
        senderId: userId,
        postId,
      },
    });
  } catch (error) {
    console.error("Error creating like notification:", error);
  }
}

export async function createCommentNotification(
  commenterId: string,
  postId: string,
  postAuthorId: string
) {
  try {
    // Don't notify if user comments on their own post
    if (commenterId === postAuthorId) return;

    await prisma.notification.create({
      data: {
        type: "COMMENT",
        message: "commented on your post",
        recipientId: postAuthorId,
        senderId: commenterId,
        postId,
      },
    });
  } catch (error) {
    console.error("Error creating comment notification:", error);
  }
}

export async function createPostNotification(authorId: string, postId: string) {
  try {
    // Get all followers of the post author
    const followers = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    const notifications = followers.map(follow => ({
      type: "POST" as const,
      message: "shared a new post",
      recipientId: follow.followerId,
      senderId: authorId,
      postId,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  } catch (error) {
    console.error("Error creating post notifications:", error);
  }
}
