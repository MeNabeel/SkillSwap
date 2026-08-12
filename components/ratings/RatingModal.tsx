"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { submitExchangeRating } from "@/lib/ratings/queries";
import { getInitials } from "@/lib/utils";
import { Star, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exchangeId: string;
  reviewerId: string;
  reviewedUser: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
  };
  onSuccess?: () => void;
}

export function RatingModal({
  open,
  onOpenChange,
  exchangeId,
  reviewerId,
  reviewedUser,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitExchangeRating({
        exchangeId,
        reviewerId,
        reviewedUserId: reviewedUser.id,
        rating,
        review,
      });

      if (res.success) {
        toast.success(`Thank you! Review submitted for ${reviewedUser.full_name}.`);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to submit rating.");
      }
    } catch (err) {
      toast.error("An error occurred while submitting rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStarDisplay = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-sans border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border shrink-0">
              <AvatarImage src={reviewedUser.avatar_url || ""} alt={reviewedUser.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {getInitials(reviewedUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base">Rate Your Skill Exchange</DialogTitle>
              <DialogDescription className="text-xs">
                How was your learning experience with <span className="font-semibold text-foreground">{reviewedUser.full_name}</span>?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Star Selection */}
          <div className="space-y-2 text-center py-2 bg-muted/30 rounded-xl border border-border/50">
            <Label className="text-xs font-semibold text-foreground block">Overall Rating</Label>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= currentStarDisplay
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted-foreground/30 fill-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block pt-1">
              {currentStarDisplay === 5 && "Excellent (5 Stars)"}
              {currentStarDisplay === 4 && "Very Good (4 Stars)"}
              {currentStarDisplay === 3 && "Good (3 Stars)"}
              {currentStarDisplay === 2 && "Fair (2 Stars)"}
              {currentStarDisplay === 1 && "Poor (1 Star)"}
            </span>
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Written Review (Optional)
            </Label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share details about your exchange. Was your mentor helpful, clear, and punctual?"
              className="h-24 text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
