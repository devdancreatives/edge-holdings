import { createAuthenticatedClient, supabase } from "@/lib/supabase";
import { getBscAddress } from "@/lib/wallet";
import { sendOtpEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/push-notifications";
import { syncSpecificWallet } from "@/lib/deposit-monitor";
import { addAddressToMoralisStream } from "@/lib/moralis-streams";

const getClient = (context: any) => {
  // Handle both standard Request (App Router) and NextApiRequest (Pages Router)
  const headers = context.request.headers;
  const token =
    typeof headers.get === "function"
      ? headers.get("authorization")
      : headers["authorization"];

  if (!token) return supabase;
  return createAuthenticatedClient(token);
};

const getUser = async (client: any) => {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
};
const getServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL",
    );
    throw new Error("Server misconfiguration: Missing Service Key");
  }
  return createClient(url, key);
};

const getBonusLabel = (milestone: number): string => {
  const labels: Record<number, string> = {
    5: "Bronze",
    10: "Silver",
    25: "Gold",
    50: "Platinum",
    100: "Diamond",
  };
  return labels[milestone] || "Unknown";
};

const getAvailableBalance = async (client: any, userId: string) => {
  // 1. Get Manual Balance (Admin Adjustments)
  const { data: user } = await client
    .from("users")
    .select("balance")
    .eq("id", userId)
    .single();
  const manualBalance = user?.balance || 0;

  // 2. Sum confirmed deposits
  const { data: deposits } = await client
    .from("deposits")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "confirmed");
  const totalDeposited =
    deposits?.reduce((a: number, b: any) => a + b.amount, 0) || 0;

  // 3. Sum investments (Amount for ACTIVE only, Fee for ALL)
  const { data: investments } = await client
    .from("investments")
    .select("amount, fee, status")
    .eq("user_id", userId);

  const activeInvestmentsAmount =
    investments
      ?.filter((i: any) => i.status === "active")
      .reduce((a: number, b: any) => a + b.amount, 0) || 0;

  const totalInvestmentFees =
    investments?.reduce((a: number, b: any) => a + (b.fee || 0), 0) || 0;

  // 4. Sum profits
  const { data: roi } = await client
    .from("roi_snapshots")
    .select("profit_amount")
    .eq("user_id", userId);
  const totalProfit =
    roi?.reduce((a: number, b: any) => a + b.profit_amount, 0) || 0;

  // 5. Sum pending or processed withdrawals
  const { data: withdrawals } = await client
    .from("withdrawal_requests")
    .select("amount, fee")
    .eq("user_id", userId)
    .neq("status", "rejected");

  const totalWithdrawals =
    withdrawals?.reduce(
      (sum: number, w: any) => sum + w.amount + (w.fee || 0),
      0,
    ) || 0;

  return (
    manualBalance +
    totalDeposited +
    totalProfit -
    activeInvestmentsAmount -
    totalInvestmentFees -
    totalWithdrawals
  );
};

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) return null;

      const { data: profile } = await client
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      return { ...user, ...profile };
    },
    myInvestments: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data;
    },
    myDeposits: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data;
    },
    myROI: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("roi_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      return data;
    },
    myTransactions: async (
      _: any,
      { limit = 50, offset = 0 }: any,
      context: any,
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      return data;
    },
    myReferralStats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // Get profile for referral data
      const { data: profile } = await client
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Get referral count
      const { count } = await client
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id);

      // Get total earned
      const { data: referralData } = await client
        .from("referrals")
        .select("total_earned")
        .eq("referrer_id", user.id);

      const totalEarned =
        referralData?.reduce((sum, r) => sum + (r.total_earned || 0), 0) || 0;

      // Check if can withdraw (minimum $50)
      const canWithdraw = (profile.referral_earnings || 0) >= 50;

      // Get next bonus
      const tiers = [5, 10, 25, 50, 100];
      const nextTier = tiers.find((t) => t > (count || 0));
      const nextBonus = nextTier
        ? {
            milestone: nextTier,
            bonus: nextTier * 10,
            label: getBonusLabel(nextTier),
          }
        : null;

      let referralCode = profile.referral_code;
      if (!referralCode) {
        // Generate a referral code if missing
        referralCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();
        await client
          .from("users")
          .update({ referral_code: referralCode })
          .eq("id", user.id);
      }

      return {
        referralCode: referralCode,
        totalReferrals: count || 0,
        totalEarned,
        activeReferrals: count || 0,
        canWithdraw,
        nextBonus,
      };
    },
    myReferrals: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("referrals")
        .select("*, referee:referee_id(*)")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      return data;
    },
    myReferralEarnings: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data: referrals } = await client
        .from("referrals")
        .select("id")
        .eq("referrer_id", user.id);

      if (!referrals || referrals.length === 0) return [];

      const referralIds = referrals.map((r) => r.id);

      const { data } = await client
        .from("referral_earnings")
        .select(
          "*, investment:investment_id(*), referredUser:referred_user_id(*)",
        )
        .in("referral_id", referralIds)
        .order("created_at", { ascending: false });

      return data;
    },
    myWithdrawals: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      return data;
    },
    myChats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("chats")
        .select("*, messages:chat_messages(*)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      return data;
    },
    chatDetails: async (_: any, { chatId }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // Verify ownership
      const { data: chat } = await client
        .from("chats")
        .select("*, messages:chat_messages(*)")
        .eq("id", chatId)
        .eq("user_id", user.id)
        .single();

      if (!chat) throw new Error("Chat not found");

      // Mark admin messages as read? (Optional)
      return chat;
    },
    adminStats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);

      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { count: totalUsers } = await serviceClient
        .from("users")
        .select("*", { count: "exact", head: true });

      const { data: deposits } = await serviceClient
        .from("deposits")
        .select("amount")
        .eq("status", "confirmed");
      const totalDeposited =
        deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;

      const { data: withdrawals } = await serviceClient
        .from("withdrawal_requests")
        .select("amount, fee")
        .eq("status", "completed");
      const totalWithdrawals =
        withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
      const withdrawalFees =
        withdrawals?.reduce((sum, w) => sum + (w.fee || 0), 0) || 0;

      const { data: investments } = await serviceClient
        .from("investments")
        .select("fee");
      const investmentFees =
        investments?.reduce((sum, i) => sum + (i.fee || 0), 0) || 0;

      const { count: pendingWithdrawals } = await serviceClient
        .from("withdrawal_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        totalUsers: totalUsers || 0,
        totalDeposits: totalDeposited,
        totalWithdrawals,
        pendingWithdrawals: pendingWithdrawals || 0,
        investmentFees,
        withdrawalFees,
        totalFees: investmentFees + withdrawalFees,
      };
    },

    adminUsers: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data } = await serviceClient
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      return data;
    },
    adminDeposits: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data } = await serviceClient
        .from("deposits")
        .select("*, user:user_id(email, full_name)")
        .order("created_at", { ascending: false });
      return data;
    },
    adminWithdrawals: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data } = await serviceClient
        .from("withdrawal_requests")
        .select("*, user:user_id(email, full_name)")
        .order("created_at", { ascending: false });
      return data;
    },
    adminChats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // 1. Get Chats
      const { data: chats, error: chatError } = await serviceClient
        .from("chats")
        .select("*")
        .order("updated_at", { ascending: false });

      if (chatError) throw new Error(chatError.message);
      if (!chats || chats.length === 0) return [];

      // 2. Get Users
      const userIds = [...new Set(chats.map((c: any) => c.user_id))];
      const { data: users } = await serviceClient
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      // 3. Get Messages
      const chatIds = chats.map((c: any) => c.id);
      const { data: messages } = await serviceClient
        .from("chat_messages")
        .select("*")
        .in("chat_id", chatIds)
        .order("created_at", { ascending: true });

      // 4. Stitch Relations
      return chats.map((chat: any) => ({
        ...chat,
        user: users?.find((u: any) => u.id === chat.user_id),
        messages: messages?.filter((m: any) => m.chat_id === chat.id),
      }));
    },
    adminInvestments: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // Fetch Investments
      const { data: investments } = await serviceClient
        .from("investments")
        .select("*, user:user_id(email, full_name)")
        .order("created_at", { ascending: false });

      // Fetch ALL ROI snapshots to calculate historical profit
      // Optimization: In prod, maybe limit by date or cache current ROI index.
      const { data: snapshots } = await serviceClient
        .from("roi_snapshots")
        .select("created_at, roi_percentage")
        .order("created_at", { ascending: true });

      // Map investments with calculated stats
      return investments?.map((inv: any) => {
        // Find all snapshots that happened AFTER this investment started
        // and BEFORE this investment ended (if it ended? No, if active or completed)
        // For active, it's just start_date to now.
        const relevantSnapshots =
          snapshots?.filter(
            (s: any) => new Date(s.created_at) >= new Date(inv.start_date),
          ) || [];

        const totalRoiPercent = relevantSnapshots.reduce(
          (acc: number, s: any) => acc + s.roi_percentage,
          0,
        );
        const expectedProfit = inv.amount * (totalRoiPercent / 100);

        return {
          ...inv,
          profitPercent: totalRoiPercent,
          expectedProfit: expectedProfit,
        };
      });
    },

    adminAiStats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);

      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data: transactions } = await serviceClient
        .from("transactions")
        .select("amount, type");

      console.log(
        `[AdminStats] Fetched ${transactions?.length || 0} transactions.`,
      );
      if (transactions && transactions.length > 0) {
        console.log(`[AdminStats] Sample:`, transactions[0]);
      }

      const entries =
        transactions?.filter((t: any) => t.type === "trade_entry") || [];
      const wins =
        transactions?.filter((t: any) => t.type === "trade_win") || [];

      const totalRevenue = entries.reduce(
        (acc: number, t: any) => acc + Math.abs(t.amount),
        0,
      );
      const totalPayouts = wins.reduce(
        (acc: number, t: any) => acc + t.amount,
        0,
      );

      const netHouseProfit = totalRevenue - totalPayouts;
      const safetyStatus = netHouseProfit > 0 ? "SAFE" : "AT RISK";

      return {
        totalRevenue,
        totalPayouts,
        netHouseProfit,
        safetyStatus,
      };
    },

    adminInvestmentStats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);

      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data: investments } = await serviceClient
        .from("investments")
        .select("amount, duration_months, start_date")
        .eq("status", "active");

      if (!investments)
        return {
          totalActiveCapital: 0,
          totalProjectedPayout: 0,
          activeCount: 0,
        };

      // Fetch ALL ROI snapshots to calculate historical profit for totals
      const { data: snapshots } = await serviceClient
        .from("roi_snapshots")
        .select("created_at, roi_percentage")
        .order("created_at", { ascending: true });

      let calculatedProfit = 0;
      if (investments && snapshots) {
        for (const inv of investments) {
          const relevantSnapshots = snapshots.filter(
            (s: any) => new Date(s.created_at) >= new Date(inv.start_date),
          );
          const totalRoiPercent = relevantSnapshots.reduce(
            (acc: number, s: any) => acc + s.roi_percentage,
            0,
          );
          calculatedProfit += inv.amount * (totalRoiPercent / 100);
        }
      }

      const totalActiveCapital =
        investments?.reduce((sum: number, inv: any) => sum + inv.amount, 0) ||
        0;

      const totalEstimatedProfit = calculatedProfit;
      const totalProjectedPayout = totalActiveCapital + totalEstimatedProfit;

      return {
        totalActiveCapital,
        totalProjectedPayout,
        totalEstimatedProfit,
        activeCount: investments?.length || 0,
      };
    },

    adminTransactions: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data } = await serviceClient
        .from("transactions")
        .select("*, user:user_id(email, full_name)")
        .order("created_at", { ascending: false });
      return data;
    },

    adminFees: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // 1. Fetch investment fees
      const { data: investments } = await serviceClient
        .from("investments")
        .select("id, amount, fee, created_at, user:user_id(email, full_name)")
        .gt("fee", 0);

      const investmentFees = (investments || []).map((inv) => ({
        id: `inv-fee-${inv.id}`,
        type: "investment",
        amount: inv.fee,
        originalAmount: inv.amount,
        user: inv.user,
        createdAt: inv.created_at,
      }));

      // 2. Fetch withdrawal fees
      const { data: withdrawals } = await serviceClient
        .from("withdrawal_requests")
        .select("id, amount, fee, created_at, user:user_id(email, full_name)")
        .eq("status", "completed")
        .gt("fee", 0);

      const withdrawalFees = (withdrawals || []).map((w) => ({
        id: `with-fee-${w.id}`,
        type: "withdrawal",
        amount: w.fee,
        originalAmount: w.amount,
        user: w.user,
        createdAt: w.created_at,
      }));

      // 3. Combine and sort
      return [...investmentFees, ...withdrawalFees].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },

    // End of New Admin Resolvers
  },
  Investment: {
    startDate: (parent: any) => parent.start_date,
    endDate: (parent: any) => parent.end_date,
    durationMonths: (parent: any) => parent.duration_months,
    createdAt: (parent: any) => parent.created_at,
    profitPercent: (parent: any) => parent.profitPercent || 0,
    expectedProfit: (parent: any) => parent.expectedProfit || 0,
    planType: (parent: any) => parent.plan_type,
    roiRate: (parent: any) => parent.roi_rate,
    isPaused: (parent: any) => parent.is_paused || false,
    pausedAt: (parent: any) => parent.paused_at,
  },
  Transaction: {
    createdAt: (parent: any) => parent.created_at,
    user: (parent: any) => parent.user, // For admin view if pre-stitched, or we could add a resolver here
  },
  Chat: {
    userId: (parent: any) => parent.user_id,
    createdAt: (parent: any) => parent.created_at,
    updatedAt: (parent: any) => parent.updated_at,
    user: (parent: any) => parent.user, // For admin view
  },
  ChatMessage: {
    chatId: (parent: any) => parent.chat_id,
    senderId: (parent: any) => parent.sender_id,
    senderRole: (parent: any) => parent.sender_role,
    createdAt: (parent: any) => parent.created_at,
  },
  User: {
    createdAt: (parent: any) => parent.created_at,
    fullName: (parent: any) => parent.full_name,
    referralCode: (parent: any) => parent.referral_code,
    referralEarnings: (parent: any) => parent.referral_earnings,
    availableBalance: async (parent: any, _: any, context: any) => {
      // If parent has availableBalance already (e.g. from custom query), use it?
      // Actually standard resolver is fine, but rigorous check:
      const client = getClient(context);
      return getAvailableBalance(client, parent.id);
    },
    wallet: async (parent: any, _: any, context: any) => {
      const client = getClient(context);
      // Admin might want to see any wallet?
      // Use service client if needed or reuse existing logic
      const serviceClient = getServiceClient();
      const { data } = await serviceClient
        .from("wallets")
        .select("*")
        .eq("user_id", parent.id)
        .single();
      return data;
    },
  },
  Wallet: {
    pathIndex: (parent: any) => parent.path_index,
    privateKey: async (parent: any, _: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) return null;

      // Check if requester is admin
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") return null;

      const mnemonic =
        process.env.WALLET_MNEMONIC ||
        "test mnemonic for dev environment only do not use in production";

      try {
        const { privateKey } = await getBscAddress(mnemonic, parent.path_index);
        return privateKey;
      } catch (e) {
        console.error("Error deriving key:", e);
        return null;
      }
    },
  },
  Deposit: {
    txHash: (parent: any) => parent.tx_hash,
    createdAt: (parent: any) => parent.created_at,
    confirmedAt: (parent: any) => parent.confirmed_at,
    user: (parent: any) => parent.user,
  },

  Referral: {
    totalEarned: (parent: any) => parent.total_earned,
    createdAt: (parent: any) => parent.created_at,
  },
  ReferralEarning: {
    investmentAmount: (parent: any) => parent.investment?.amount || 0,
    createdAt: (parent: any) => parent.created_at,
  },
  ROISnapshot: {
    profitAmount: (parent: any) => parent.profit_amount,
    roiPercentage: (parent: any) => parent.roi_percentage,
  },
  WithdrawalRequest: {
    walletAddress: (parent: any) => parent.wallet_address,
    txHash: (parent: any) => parent.tx_hash,
    createdAt: (parent: any) => parent.created_at,
    processedAt: (parent: any) => parent.processed_at,
    user: (parent: any) => parent.user,
  },
  PlatformFee: {
    createdAt: (parent: any) => parent.createdAt || parent.created_at,
  },

  Mutation: {
    createInvestment: async (
      _: any,
      { amount, durationMonths, durationHours, planType, roiRate }: any,
      context: any,
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // Check for Admin only for durationHours, unless it's a PIF plan
      if (durationHours !== undefined && planType !== "PIF") {
        const { data: profile } = await client
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
  
        if (profile?.role !== "admin") {
          throw new Error(
            "Only admins can create custom test investments",
          );
        }
      }

      // Calculate 0.1% Fee
      const FEE_PERCENTAGE = 0.001; // 0.1%
      const fee = amount * FEE_PERCENTAGE;
      const totalDeduction = amount + fee;

      const balance = await getAvailableBalance(client, user.id);
      if (balance < totalDeduction)
        throw new Error(
          `Insufficient balance including ${fee.toFixed(2)} USDT fee (0.1%)`,
        );

      const startDate = new Date();
      const endDate = new Date(startDate);

      if (durationHours !== undefined) {
        endDate.setHours(endDate.getHours() + durationHours);
      } else {
        endDate.setMonth(endDate.getMonth() + durationMonths);
      }

      const { data, error } = await client
        .from("investments")
        .insert({
          user_id: user.id,
          amount,
          fee: fee, // Record the fee separately
          duration_months: durationHours !== undefined ? 0 : durationMonths,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          last_payout_date: startDate.toISOString(),
          status: "active",
          plan_type: planType || "standard",
          roi_rate: roiRate || 0.25,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Log in transactions ledger
      const { error: txError } = await client.from("transactions").insert({
        user_id: user.id,
        type: "investment_start",
        amount: amount,
        description:
          durationHours !== undefined
            ? `Started ${durationHours}-hour test investment`
            : `Started ${durationMonths}-month investment`,
      });

      if (txError) {
        console.error("Failed to log transaction:", txError);
        // Optional: throw new Error(`Investment created but transaction logging failed: ${txError.message}`);
      }

      // Send Push Notification
      await sendPushNotification(user.id, {
        title: "Investment Active",
        body:
          durationHours !== undefined
            ? `Your test investment of $${amount} for ${durationHours} hours is now active.`
            : `Your investment of $${amount} for ${durationMonths} months is now active.`,
        url: "/dashboard/invest",
      });

      return data;
    },
    closeInvestment: async (
      _: any,
      { id, includeRoi = true }: any,
      context: any,
    ) => {
      const client = getClient(context);
      const user = await getUser(client);

      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // 1. Fetch investment
      const { data: inv, error: fetchError } = await serviceClient
        .from("investments")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !inv) throw new Error("Investment not found");
      if (inv.status !== "active") throw new Error("Investment is not active");

      // 2. Calculate Profit (similar to cron logic)
      let profit = 0;
      let roiPercentageTotal = 0;

      if (includeRoi) {
        const ROI_PERCENTAGE_PER_MONTH_DEFAULT = 0.25;
        if (inv.duration_months === 0) {
          // Test Investment
          roiPercentageTotal = 0.001;
          profit = inv.amount * roiPercentageTotal;
        } else {
          const rateToUse = inv.roi_rate || ROI_PERCENTAGE_PER_MONTH_DEFAULT;
          roiPercentageTotal = rateToUse * inv.duration_months;
          profit = inv.amount * roiPercentageTotal;
        }
      }

      // 3. Update status to completed
      const { data: updatedInv, error: updateError } = await serviceClient
        .from("investments")
        .update({ status: "completed" })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      // 4. Record ROI Snapshot (if profit > 0)
      if (profit > 0) {
        await serviceClient.from("roi_snapshots").insert({
          user_id: inv.user_id,
          date: new Date().toISOString(),
          profit_amount: profit,
          roi_percentage: roiPercentageTotal * 100,
        });

        // Profit Payout Transaction
        await serviceClient.from("transactions").insert({
          user_id: inv.user_id,
          type: "profit_payout",
          amount: profit,
          description: `Manual ROI Payout for ${inv.duration_months}-month investment`,
        });
      }

      // 5. Principal Return Transaction
      await serviceClient.from("transactions").insert({
        user_id: inv.user_id,
        type: "deposit",
        amount: inv.amount,
        description: `Principal returned from manually closed investment`,
      });

      // 6. Notify user
      const totalReturned = inv.amount + profit;
      await sendPushNotification(inv.user_id, {
        title: "Investment Closed",
        body: `Your investment of $${inv.amount} has been closed by admin. $${totalReturned.toFixed(2)} credited to your balance${profit > 0 ? " (includes profit)" : ""}.`,
        url: "/dashboard/investments",
      });

      return updatedInv;
    },
    toggleInvestmentPause: async (_: any, { id }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);

      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // 1. Fetch investment
      const { data: inv, error: fetchError } = await serviceClient
        .from("investments")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !inv) throw new Error("Investment not found");
      if (inv.status !== "active") throw new Error("Investment is not active");

      let updates: any = {};

      if (inv.is_paused) {
        // RESUME logic
        const pausedAt = new Date(inv.paused_at).getTime();
        const now = new Date().getTime();
        const durationPausedMs = now - pausedAt;

        const newEndDate = new Date(new Date(inv.end_date).getTime() + durationPausedMs);
        const newLastPayoutDate = new Date(new Date(inv.last_payout_date || inv.start_date).getTime() + durationPausedMs);

        updates = {
          is_paused: false,
          paused_at: null,
          end_date: newEndDate.toISOString(),
          last_payout_date: newLastPayoutDate.toISOString(),
        };

      } else {
        // PAUSE logic
        updates = {
          is_paused: true,
          paused_at: new Date().toISOString(),
        };
      }

      const { data: updatedInv, error: updateError } = await serviceClient
        .from("investments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      return updatedInv;
    },

    simulateDeposit: async (_: any, { amount, txHash }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await client
        .from("deposits")
        .insert({
          user_id: user.id,
          amount,
          tx_hash: txHash,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Log transaction for simulated deposit
      const { error: txError } = await client.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: amount,
        description: `Simulated deposit via admin - Tx: ${txHash.substring(0, 10)}...`,
      });

      if (txError)
        console.error("Failed to log simulated deposit transaction:", txError);

      return data;
    },
    createMyWallet: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data: existing } = await client
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existing) return existing;

      const mnemonic =
        process.env.WALLET_MNEMONIC ||
        "middle memory first priority detail point tree amount work move allow field";

      const serviceClient = getServiceClient();
      const { data: wallets } = await serviceClient
        .from("wallets")
        .select("path_index")
        .order("path_index", { ascending: false })
        .limit(1);

      const index = (wallets && wallets.length > 0 ? wallets[0].path_index : 0) + 1;

      const { address } = await getBscAddress(mnemonic, index);

      const { data, error } = await client
        .from("wallets")
        .insert({
          user_id: user.id,
          address,
          path_index: index,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Add new wallet to Moralis Stream
      addAddressToMoralisStream(address).catch((e) =>
        console.error("Moralis Stream Add Error:", e),
      );

      return data;
    },
    adminDistributeProfit: async (_: any, { amount }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      // Check role
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const { data: investments } = await serviceClient
        .from("investments")
        .select("*")
        .eq("status", "active");

      if (!investments || investments.length === 0)
        return "No active investments";

      const totalCapital = investments.reduce(
        (sum: number, inv: any) => sum + inv.amount,
        0,
      );
      if (totalCapital === 0) return "Total capital is 0";

      const roiPercentage = (amount / totalCapital) * 100;

      const snapshots = [];
      for (const inv of investments) {
        const profit = (inv.amount / totalCapital) * amount;
        snapshots.push({
          user_id: inv.user_id,
          date: new Date().toISOString(),
          profit_amount: profit,
          roi_percentage: roiPercentage,
        });
      }

      const { error } = await serviceClient
        .from("roi_snapshots")
        .insert(snapshots);
      if (error) throw new Error(error.message);

      return `Distributed ${amount} USDT to ${
        investments.length
      } investments (ROI: ${roiPercentage.toFixed(2)}%)`;
    },
    adminUpdateWithdrawalStatus: async (
      _: any,
      { id, status, txHash }: any,
      context: any,
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      const updateData: any = {
        status,
        processed_at: new Date().toISOString(),
      };
      if (txHash) updateData.tx_hash = txHash;

      const { data, error } = await serviceClient
        .from("withdrawal_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Notify User
      if (data) {
        const pushResult = await sendPushNotification(data.user_id, {
          title: `Withdrawal ${status === "processed" ? "Processed" : "Updated"}`,
          body: `Your withdrawal of $${data.amount} has been ${status}.`,
          url: "/dashboard/wallet",
        });
        console.log(
          `Withdrawal Push Result for user ${data.user_id}:`,
          pushResult,
        );
      }

      return data;
    },
    adminReplyChat: async (_: any, { chatId, content }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // Insert admin message
      const { data: message, error } = await serviceClient
        .from("chat_messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          sender_role: "admin", // Admin role
          content: content,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Update chat status if needed (e.g., waiting for user)
      await serviceClient
        .from("chats")
        .update({ updated_at: new Date().toISOString(), status: "answered" })
        .eq("id", chatId);

      // Notify User
      const { data: chat } = await serviceClient
        .from("chats")
        .select("user_id")
        .eq("id", chatId)
        .single();

      if (chat) {
        const pushResult = await sendPushNotification(chat.user_id, {
          title: "New Support Message",
          body:
            content.length > 50 ? content.substring(0, 50) + "..." : content,
          url: `/dashboard/chat`,
        });
        console.log(
          `Chat Reply Push Result for user ${chat.user_id}:`,
          pushResult,
        );
      }

      return message;
    },
    requestOtp: async (_: any, { email, fullName }: any) => {
      const serviceClient = getServiceClient();

      // Check if user already exists
      const { data: existingUser } = await serviceClient
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      const { error } = await serviceClient
        .from("verification_codes")
        .insert({ email, code, expires_at: expiresAt });

      if (error) {
        console.error("Supabase Error generating OTP:", error);
        throw new Error(`Failed to generate OTP: ${error.message}`);
      }

      await sendOtpEmail(email, code);

      return true;
    },
    registerWithOtp: async (
      _: any,
      { email, otp, password, fullName, referralCode }: any,
    ) => {
      const serviceClient = getServiceClient();

      const { data: codes } = await serviceClient
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .eq("code", otp)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!codes || codes.length === 0)
        throw new Error("Invalid or expired OTP");

      const { data: authData, error: authError } =
        await serviceClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (authError) throw new Error(authError.message);
      const newUser = authData.user;
      if (!newUser) throw new Error("User creation failed");

      // Generate a new unique referral code for this user
      const newReferralCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      await serviceClient.from("users").upsert({
        id: newUser.id,
        email: newUser.email,
        full_name: fullName,
        role: "user",
        referral_code: newReferralCode,
      });

      // If a referral code was provided (upline), record the referral
      if (referralCode) {
        const { data: referrer } = await serviceClient
          .from("users")
          .select("id")
          .eq("referral_code", referralCode.toUpperCase())
          .single();

        if (referrer) {
          await serviceClient.from("referrals").insert({
            referrer_id: referrer.id,
            referee_id: newUser.id,
            total_earned: 0,
          });
        }
      }

      await serviceClient
        .from("verification_codes")
        .delete()
        .eq("email", email);

      return { ...newUser, fullName, role: "user" };
    },
    updateProfile: async (_: any, { fullName }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await client
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { ...user, ...data };
    },
    requestWithdrawal: async (
      _: any,
      { amount, walletAddress }: any,
      context: any,
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // 1. Validation
      if (amount < 10) throw new Error("Minimum withdrawal is 10 USDT");

      // Validate BSC/EVM address (starts with 0x, 42 chars)
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!evmRegex.test(walletAddress)) {
        throw new Error(
          "Invalid BSC (BEP20) address. Must start with '0x' and be 42 characters long.",
        );
      }

      const FEE = 3.0;
      const totalDeduction = amount + FEE;

      // 2. Check Balance
      const availableBalance = await getAvailableBalance(client, user.id);
      if (availableBalance < totalDeduction) {
        throw new Error(
          `Insufficient balance. You need ${totalDeduction.toFixed(
            2,
          )} USDT (incl. $3 fee)`,
        );
      }

      // 3. Create Request
      const { data, error } = await client
        .from("withdrawal_requests")
        .insert({
          user_id: user.id,
          amount: amount,
          fee: FEE,
          wallet_address: walletAddress,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Notify User (Confirmation)
      await sendPushNotification(user.id, {
        title: "Withdrawal Requested",
        body: `Your request to withdraw $${amount} has been received.`,
        url: "/dashboard/wallet",
      });

      return data;
    },

    createChat: async (_: any, { initialMessage }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // 1. Create Chat
      const { data: chat, error: chatError } = await client
        .from("chats")
        .insert({
          user_id: user.id,
          status: "open",
        })
        .select()
        .single();

      if (chatError) throw new Error(chatError.message);

      // 2. Create Initial Message
      const { data: message, error: msgError } = await client
        .from("chat_messages")
        .insert({
          chat_id: chat.id,
          sender_id: user.id,
          sender_role: "user",
          content: initialMessage,
        })
        .select()
        .single();

      if (msgError) throw new Error(msgError.message);

      // Return the chat with messages
      return {
        ...chat,
        messages: [message],
      };
    },
    sendMessage: async (_: any, { chatId, content }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // Verify chat ownership
      const { data: chat } = await client
        .from("chats")
        .select("id")
        .eq("id", chatId)
        .eq("user_id", user.id)
        .single();

      if (!chat) throw new Error("Chat not found");

      // Insert message
      const { data: message, error } = await client
        .from("chat_messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          sender_role: "user",
          content: content,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Update chat updated_at
      await client
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId);

      return message;
    },
    syncMyDeposits: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      return await syncSpecificWallet(user.id);
    },

    adminUpdateUser: async (_: any, { id, input }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // Helper to convert camelCase to snake_case
      const updates: any = {};
      if (input.fullName !== undefined) updates.full_name = input.fullName;
      if (input.email !== undefined) updates.email = input.email;
      if (input.role !== undefined) updates.role = input.role;
      if (input.balance !== undefined) updates.balance = input.balance;

      const { data, error } = await serviceClient
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    adminDeleteUser: async (_: any, { id }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = getServiceClient();

      // 1. Chat messages for user's chats
      const { data: userChats } = await serviceClient.from("chats").select("id").eq("user_id", id);
      const userChatIds = userChats?.map((c) => c.id) || [];
      if (userChatIds.length > 0) {
        await serviceClient
          .from("chat_messages")
          .delete()
          .in("chat_id", userChatIds);
      }

      // 2. Chat messages sent by user
      await serviceClient.from("chat_messages").delete().eq("sender_id", id);

      // 3. Chats himself
      await serviceClient.from("chats").delete().eq("user_id", id);

      // 4. AI Trades
      await serviceClient.from("ai_trades").delete().eq("user_id", id);

      // 5. Push Subscriptions
      await serviceClient.from("push_subscriptions").delete().eq("user_id", id);

      // 6. Withdrawal Requests
      await serviceClient.from("withdrawal_requests").delete().eq("user_id", id);

      // 7. Referral Earnings (related to user's referrals)
      const { data: involvement } = await serviceClient
        .from("referrals")
        .select("id")
        .or(`referrer_id.eq.${id},referee_id.eq.${id}`);
      const involvementIds = involvement?.map((r) => r.id) || [];
      if (involvementIds.length > 0) {
        await serviceClient
          .from("referral_earnings")
          .delete()
          .in("referral_id", involvementIds);
      }

      // 8. Referral Earnings (related to user's investments)
      const { data: userInvestments } = await serviceClient
        .from("investments")
        .select("id")
        .eq("user_id", id);
      const userInvestmentIds = userInvestments?.map((i) => i.id) || [];
      if (userInvestmentIds.length > 0) {
        await serviceClient
          .from("referral_earnings")
          .delete()
          .in("investment_id", userInvestmentIds);
      }

      // 9. Referral Bonuses
      await serviceClient.from("referral_bonuses").delete().eq("user_id", id);

      // 10. Referrals
      await serviceClient
        .from("referrals")
        .delete()
        .or(`referrer_id.eq.${id},referee_id.eq.${id}`);

      // 11. Transactions
      await serviceClient.from("transactions").delete().eq("user_id", id);

      // 12. ROI Snapshots
      await serviceClient.from("roi_snapshots").delete().eq("user_id", id);

      // 13. Investments
      await serviceClient.from("investments").delete().eq("user_id", id);

      // 14. Deposits
      await serviceClient.from("deposits").delete().eq("user_id", id);

      // 15. Wallets
      await serviceClient.from("wallets").delete().eq("user_id", id);

      // 16. User Public Profile
      await serviceClient.from("users").delete().eq("id", id);

      // 17. Auth User (Supabase Auth)
      const { error: authError } = await serviceClient.auth.admin.deleteUser(id);
      if (authError)
        throw new Error(`Failed to delete auth user: ${authError.message}`);

      return true;
    },
    savePushSubscription: async (
      _: any,
      { endpoint, authKey, p256dhKey }: any,
      context: any,
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const serviceClient = getServiceClient();

      // Check if exists (globally, using service client)
      const { data: existing } = await serviceClient
        .from("push_subscriptions")
        .select("id")
        .eq("endpoint", endpoint)
        .single();

      if (existing) {
        // Update keys and OWNER if they changed (transfer ownership to current user)
        const { error } = await serviceClient
          .from("push_subscriptions")
          .update({
            user_id: user.id, // Ensure current user owns this endpoint
            auth_key: authKey,
            p256dh_key: p256dhKey,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        // Insert
        const { error } = await serviceClient
          .from("push_subscriptions")
          .insert({
            user_id: user.id,
            endpoint,
            auth_key: authKey,
            p256dh_key: p256dhKey,
          });
        if (error) throw new Error(error.message);
      }

      return true;
    },
    testPushNotification: async (_: any, { delay }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }

      const result = await sendPushNotification(user.id, {
        title: "Test Notification",
        body: "This is a test notification from EdgePoint Holdings to verify your device works.",
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      return true;
    },

    // AI Trading Resolvers
    startAiTrade: async (_: any, { amount, type }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // Validate stake amount
      if (amount <= 0) throw new Error("Stake must be positive");
      if (amount > 10000) throw new Error("Maximum stake is $10,000");

      const balance = await getAvailableBalance(client, user.id);
      if (balance < amount) throw new Error("Insufficient balance");

      const serviceClient = getServiceClient();

      // Check for existing pending trade (DB enforces uniqueness, but give nice error)
      const { data: existingTrade } = await serviceClient
        .from("ai_trades")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();

      if (existingTrade) {
        throw new Error(
          "You already have an active trade. Wait for it to resolve.",
        );
      }

      // Fetch current manual balance
      const { data: userData } = await serviceClient
        .from("users")
        .select("balance")
        .eq("id", user.id)
        .single();

      const currentManualBalance = userData?.balance || 0;

      // Determine Outcome (Server-Side Logic)
      // Calculate House Pool from all AI transactions
      const { data: transactions } = await serviceClient
        .from("transactions")
        .select("amount, type");

      const aiTransactions =
        transactions?.filter(
          (t: any) =>
            t.type === "trade_entry" ||
            t.type === "trade_win" ||
            t.type === "trade_loss",
        ) || [];

      // House Profit = -1 * (sum of user-side AI transactions)
      // Entry: -50 (user loses, house gains). Win: +90 (user gains, house loses).
      const userNetChange = aiTransactions.reduce(
        (acc: number, t: any) => acc + t.amount,
        0,
      );
      const housePool = -userNetChange;

      const potentialPayout = amount * 0.9;

      // 20% base win rate
      let isWin = Math.random() < 0.2;

      // SAFETY OVERRIDES
      if (housePool < 0) {
        console.log(
          `[AI TRADING] RECOVERY MODE. Pool: ${housePool}. Forcing LOSS.`,
        );
        isWin = false;
      } else if (isWin && housePool - potentialPayout < 0) {
        console.log(
          `[AI TRADING] Safety Override. Pool: ${housePool}, Payout: ${potentialPayout}. Forcing LOSS.`,
        );
        isWin = false;
      }

      const outcome = isWin ? "WIN" : "LOSS";
      const profit = isWin ? amount * 0.9 : 0;

      // Deduct balance
      const { error: updateError } = await serviceClient
        .from("users")
        .update({ balance: currentManualBalance - amount })
        .eq("id", user.id);

      if (updateError) throw new Error("Failed to deduct balance");

      // Record entry transaction
      const { error: txError } = await serviceClient
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "trade_entry",
          amount: -amount,
          description: `AI Trade Entry (${type})`,
        });

      if (txError) {
        console.error("[AI TRADING] Failed to record transaction:", txError);
      }

      // Store pending trade with server-determined outcome
      const { data: trade, error: tradeError } = await serviceClient
        .from("ai_trades")
        .insert({
          user_id: user.id,
          stake: amount,
          direction: type,
          outcome,
          profit,
          status: "pending",
        })
        .select("id")
        .single();

      if (tradeError) {
        console.error("[AI TRADING] Failed to store trade:", tradeError);
        throw new Error("Failed to create trade");
      }

      // Return trade ID — client does NOT learn the outcome until resolution
      return trade.id;
    },

    resolveAiTrade: async (_: any, { tradeId }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const serviceClient = getServiceClient();

      // Look up the pending trade
      const { data: trade, error: findError } = await serviceClient
        .from("ai_trades")
        .select("*")
        .eq("id", tradeId)
        .eq("user_id", user.id)
        .single();

      if (findError || !trade) {
        throw new Error("Trade not found");
      }

      if (trade.status !== "pending") {
        throw new Error("Trade already resolved");
      }

      // Check expiry (90 seconds max)
      const tradeAge =
        (Date.now() - new Date(trade.created_at).getTime()) / 1000;
      if (tradeAge > 90) {
        // Mark as expired
        await serviceClient
          .from("ai_trades")
          .update({ status: "expired", resolved_at: new Date().toISOString() })
          .eq("id", tradeId);

        // Record loss transaction (stake was already deducted)
        await serviceClient.from("transactions").insert({
          user_id: user.id,
          type: "trade_loss",
          amount: 0,
          description: `AI Trade Expired (Stake: $${trade.stake})`,
        });

        return JSON.stringify({ outcome: "LOSS", profit: 0, expired: true });
      }

      // Apply the SERVER-DETERMINED outcome
      const isWin = trade.outcome === "WIN";
      const profit = isWin ? trade.profit : 0;

      // Mark trade as resolved
      await serviceClient
        .from("ai_trades")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", tradeId);

      if (isWin) {
        const totalPayout = trade.stake + profit;

        // Credit balance
        const { data: userData } = await serviceClient
          .from("users")
          .select("balance")
          .eq("id", user.id)
          .single();
        const currentBalance = userData?.balance || 0;

        const { error: updateError } = await serviceClient
          .from("users")
          .update({ balance: currentBalance + totalPayout })
          .eq("id", user.id);

        if (updateError) throw new Error("Failed to credit winnings");

        // Record win transaction
        await serviceClient.from("transactions").insert({
          user_id: user.id,
          type: "trade_win",
          amount: totalPayout,
          description: `AI Trade Win (Profit: $${profit.toFixed(2)})`,
        });
      } else {
        // Record loss (stake already deducted at entry)
        await serviceClient.from("transactions").insert({
          user_id: user.id,
          type: "trade_loss",
          amount: 0,
          description: `AI Trade Loss (Stake: $${trade.stake})`,
        });
      }

      return JSON.stringify({ outcome: trade.outcome, profit });
    },
  },
};
