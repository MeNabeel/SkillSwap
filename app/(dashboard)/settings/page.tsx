"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Lock, User, Shield, Moon, Sun, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("public");

  const handleSave = () => {
    toast.success("Settings updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your account preferences, privacy, and notifications
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Privacy & Visibility
          </CardTitle>
          <CardDescription className="text-xs">
            Control who can discover your student profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Profile Visibility</p>
              <p className="text-xs text-muted-foreground">
                Public profiles can be discovered by other verified students
              </p>
            </div>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="public">Public (Recommended)</option>
              <option value="private">Private (Invite Only)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
          <CardDescription className="text-xs">
            Choose how you receive skill exchange alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Alerts</p>
              <p className="text-xs text-muted-foreground">
                Receive emails when a student requests a skill exchange with you
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} variant="emerald">
          <Save className="h-4 w-4 mr-2" /> Save Preferences
        </Button>
      </div>
    </div>
  );
}
