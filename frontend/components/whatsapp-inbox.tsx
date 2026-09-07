"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Phone, User, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WhatsAppMessageItem {
  id: string;
  sender_name: string;
  sender_phone: string;
  message_text: string;
  received_at: string;
  status: "pending" | "resolved" | "handoff_required";
}

export function WhatsAppInboxCard() {
  const [messages, setMessages] = useState<WhatsAppMessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetches from GET /api/v1/patient-requests?source=whatsapp
    // Seeded initial mock state for staff dashboard demonstration
    setMessages([
      {
        id: "WA-001",
        sender_name: "Rohan Verma",
        sender_phone: "+91 98765 43210",
        message_text: "Can I reschedule my appointment for tomorrow afternoon?",
        received_at: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "handoff_required"
      },
      {
        id: "WA-002",
        sender_name: "Priya Sharma",
        sender_phone: "+91 98123 45678",
        message_text: "Selected slot 11:30 AM - 12:00 PM with Dr. Ananya Rao",
        received_at: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "pending"
      }
    ]);
    setLoading(false);
  }, []);

  const handleResolve = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status: "resolved" } : msg))
    );
  };

  return (
    <Card className="shadow-sm border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-base font-semibold">WhatsApp Live Patient Queue</CardTitle>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
          Phase 9 Cloud API Connected
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">No active WhatsApp requests</div>
        ) : (
          messages.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                item.status === "handoff_required"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : item.status === "resolved"
                  ? "bg-muted/40 border-muted/60 opacity-60"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{item.sender_name}</span>
                  <span className="text-xs text-muted-foreground">({item.sender_phone})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.received_at}
                </div>
              </div>

              <p className="text-xs text-foreground/90 bg-muted/30 p-2 rounded border border-border/30">
                "{item.message_text}"
              </p>

              <div className="flex items-center justify-between pt-1">
                {item.status === "handoff_required" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" /> Staff Handoff Requested
                  </span>
                ) : item.status === "resolved" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    <Clock className="h-3.5 w-3.5" /> Auto-Bot Processed
                  </span>
                )}

                {item.status !== "resolved" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => window.open(`https://wa.me/${item.sender_phone.replace(/\D/g, "")}`, "_blank")}
                    >
                      <Phone className="h-3 w-3" /> Call/Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleResolve(item.id)}
                    >
                      <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
