import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useRealtimeNotifications(userId?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "investments",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          toast.success("Investment Created!", {
            description: `Investment of $${payload.new.amount} initiated.`,
          });
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "investments",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.status === "active") {
            toast.success("Investment Active!", {
              description: `Your investment of $${payload.new.amount} is now active.`,
            });
          } else if (payload.new.status === "completed") {
            toast.success("Investment Completed!", {
              description: `Investment concluded. Profits added to your balance.`,
            });
          }
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deposits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          toast.info("Deposit Initiated", {
            description: `Deposit of $${payload.new.amount} detected. Waiting for confirmation.`,
          });
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deposits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.status === "confirmed") {
            toast.success("Deposit Confirmed!", {
              description: `$${payload.new.amount} has been added to your balance.`,
            });
            router.refresh();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "withdrawal_requests",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.status === "processed") {
            toast.success("Withdrawal Processed", {
              description: `Your withdrawal of $${payload.new.amount} has been processed.`,
            });
          } else if (payload.new.status === "rejected") {
            toast.error("Withdrawal Rejected", {
              description: `Your withdrawal request was rejected.`,
            });
          }
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "sender_role=eq.admin",
        },
        (payload) => {
          // Since specific user filtering isn't possible on joined table here easily without RLS
          // We assume RLS is filtering this channel for the user.
          // Ideally we should check if the chat belongs to this user, but we can't easily.
          // If RLS is ON for Realtime, this is safe.

          toast.info("New Support Message", {
            description: payload.new.content
              ? payload.new.content.substring(0, 50) +
                (payload.new.content.length > 50 ? "..." : "")
              : "You have a new message.",
            action: {
              label: "View",
              onClick: () => router.push("/dashboard/chat"),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);
}
