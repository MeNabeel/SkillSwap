import { createClient } from "@/lib/supabase/client";

export interface RatingSummary {
  averageRating: number | null; // e.g. 4.8 or null
  ratingCount: number;
  reviews: {
    id: string;
    rating: number;
    review: string | null;
    created_at: string;
    reviewerName: string;
    reviewerAvatar: string | null;
  }[];
}

export async function submitExchangeRating({
  exchangeId,
  reviewerId,
  reviewedUserId,
  rating,
  review,
}: {
  exchangeId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  review?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5 stars." };
    }

    if (reviewerId === reviewedUserId) {
      return { success: false, error: "You cannot rate yourself." };
    }

    const supabase = createClient();

    // Verify exchange is completed and user participated
    const { data: exchange } = await (supabase as any)
      .from("exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (!exchange || exchange.status !== "completed") {
      return { success: false, error: "Ratings can only be submitted for completed exchanges." };
    }

    if (exchange.user_one_id !== reviewerId && exchange.user_two_id !== reviewerId) {
      return { success: false, error: "You are not a participant in this exchange." };
    }

    // Insert Rating Record
    const { error } = await (supabase as any).from("ratings").insert({
      exchange_id: exchangeId,
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      review: review?.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "You have already submitted a rating for this exchange." };
      }
      throw error;
    }

    // Notify reviewed user
    const { data: reviewerProfile } = await (supabase as any)
      .from("profiles")
      .select("full_name")
      .eq("id", reviewerId)
      .single();

    const reviewerName = reviewerProfile?.full_name || "Your partner";

    await (supabase as any).from("notifications").insert({
      user_id: reviewedUserId,
      type: "rating_received",
      title: "New Review Received!",
      message: `${reviewerName} left you a ${rating}-star review for your skill exchange!`,
      reference_id: exchangeId,
      reference_type: "exchange",
      is_read: false,
    });

    return { success: true };
  } catch (err: any) {
    console.error("submitExchangeRating error:", err);
    return { success: false, error: err.message || "Failed to submit rating." };
  }
}

export async function fetchUserRatingSummary(userId: string): Promise<RatingSummary> {
  try {
    const supabase = createClient();
    const { data: ratings, error } = await (supabase as any)
      .from("ratings")
      .select("*, reviewer:profiles!ratings_reviewer_id_fkey(full_name, avatar_url)")
      .eq("reviewed_user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !ratings || ratings.length === 0) {
      return { averageRating: null, ratingCount: 0, reviews: [] };
    }

    const totalScore = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
    const avg = Math.round((totalScore / ratings.length) * 10) / 10;

    const reviews = ratings.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      review: r.review,
      created_at: r.created_at,
      reviewerName: r.reviewer?.full_name || "Student Peer",
      reviewerAvatar: r.reviewer?.avatar_url || null,
    }));

    return {
      averageRating: avg,
      ratingCount: ratings.length,
      reviews,
    };
  } catch (err) {
    console.error("fetchUserRatingSummary error:", err);
    return { averageRating: null, ratingCount: 0, reviews: [] };
  }
}
