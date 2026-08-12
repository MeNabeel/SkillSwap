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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadge } from "@/components/skills/SkillBadge";
import { createExchangeRequest } from "@/lib/requests/queries";
import { getInitials } from "@/lib/utils";
import { Send, BookOpen, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SkillItem {
  skillId: string;
  name: string;
  category?: string;
  level: string;
}

interface RequestExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
    teaching_skills: SkillItem[];
  };
  currentUser: {
    id: string;
    teaching_skills: SkillItem[];
  };
  onSuccess?: () => void;
}

export function RequestExchangeModal({
  open,
  onOpenChange,
  targetUser,
  currentUser,
  onSuccess,
}: RequestExchangeModalProps) {
  const [requestedSkillId, setRequestedSkillId] = useState<string>(
    targetUser.teaching_skills[0]?.skillId || ""
  );
  const [offeredSkillId, setOfferedSkillId] = useState<string>(
    currentUser.teaching_skills[0]?.skillId || ""
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedSkillId || !offeredSkillId) {
      toast.error("Please select both a skill to learn and a skill to offer.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createExchangeRequest({
        senderId: currentUser.id,
        receiverId: targetUser.id,
        requestedSkillId,
        offeredSkillId,
        message,
      });

      if (res.success) {
        toast.success(`Skill exchange request sent to ${targetUser.full_name}!`);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to send request.");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-sans border-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border shrink-0">
              <AvatarImage src={targetUser.avatar_url || ""} alt={targetUser.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {getInitials(targetUser.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base flex items-center gap-1.5">
                Request Skill Exchange
              </DialogTitle>
              <DialogDescription className="text-xs">
                Exchange skills with <span className="font-semibold text-foreground">{targetUser.full_name}</span> (@{targetUser.username})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 1. Skill I Want to Learn (from Target User) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-600" /> I Want to Learn from {targetUser.full_name.split(" ")[0]}
            </Label>
            {targetUser.teaching_skills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                This student has not listed any teaching skills yet.
              </p>
            ) : (
              <Select value={requestedSkillId} onValueChange={setRequestedSkillId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select skill you want to learn" />
                </SelectTrigger>
                <SelectContent>
                  {targetUser.teaching_skills.map((s) => (
                    <SelectItem key={s.skillId} value={s.skillId} className="text-xs">
                      {s.name} ({s.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 2. Skill I Offer to Teach (from Current User) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> I Can Teach in Return
            </Label>
            {currentUser.teaching_skills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                You have not added any teaching skills yet. Update your profile skills first.
              </p>
            ) : (
              <Select value={offeredSkillId} onValueChange={setOfferedSkillId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select skill you can teach" />
                </SelectTrigger>
                <SelectContent>
                  {currentUser.teaching_skills.map((s) => (
                    <SelectItem key={s.skillId} value={s.skillId} className="text-xs">
                      {s.name} ({s.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 3. Optional Message */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Optional Message
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to learn Docker from you. I can help you with React in return!"
              className="h-20 text-xs resize-none"
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
              variant="emerald"
              disabled={submitting || !requestedSkillId || !offeredSkillId}
              className="text-xs font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send Exchange Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
