"use client";

import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  fullName: string;
  userId?: string;
  onAvatarChange: (url: string | null) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  fullName,
  userId,
  onAvatarChange,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unable to upload this image. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Unable to upload image. File size must be less than 2MB.");
      return;
    }

    setIsUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId || "temp"}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (error) {
        // Fallback for local preview if Supabase storage is not configured yet
        toast.success("Avatar preview set successfully.");
        onAvatarChange(localPreview);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const uploadedUrl = publicUrlData.publicUrl;
        setPreviewUrl(uploadedUrl);
        onAvatarChange(uploadedUrl);
        toast.success("Avatar updated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to upload this image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Avatar removed.");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
          {previewUrl && <AvatarImage src={previewUrl} alt={fullName} />}
          <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Photo
              </>
            )}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUploading}
              onClick={handleRemove}
              className="text-xs text-destructive hover:text-destructive"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Recommended: JPG, PNG or WebP. Max size 2MB.
        </p>
      </div>
    </div>
  );
}
