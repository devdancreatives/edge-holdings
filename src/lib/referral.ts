import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate a unique 8-character referral code
 */
export async function generateReferralCode(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_referral_code");

  if (error || !data) {
    // Fallback to client-side generation
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  return data;
}

/**
 * Validate if a referral code exists
 */
export async function validateReferralCode(
  code: string
): Promise<{ valid: boolean; userId?: string }> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", code.toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false };
  }

  return { valid: true, userId: data.id };
}

/**
 * Calculate referral earnings (0.5% commission)
 */
export function calculateReferralEarnings(investmentAmount: number): number {
  return investmentAmount * 0.005; // 0.5%
}

/**
 * Credit referral earnings to referrer
 * This is called automatically via database trigger
 */
export async function creditReferralEarnings(
  investmentId: string,
  investmentAmount: number
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("credit_referral_earnings", {
      p_investment_id: investmentId,
      p_investment_amount: investmentAmount,
    });

    return !error;
  } catch (error) {
    console.error("Error crediting referral earnings:", error);
    return false;
  }
}

/**
 * Check and award referral bonuses for milestones
 */
export async function checkReferralBonuses(userId: string): Promise<void> {
  try {
    await supabase.rpc("check_referral_bonuses", {
      p_user_id: userId,
    });
  } catch (error) {
    console.error("Error checking referral bonuses:", error);
  }
}

/**
 * Get referral bonus tiers
 */
export function getReferralBonusTiers() {
  return [
    { referrals: 5, bonus: 50, label: "Bronze" },
    { referrals: 10, bonus: 100, label: "Silver" },
    { referrals: 25, bonus: 250, label: "Gold" },
    { referrals: 50, bonus: 500, label: "Platinum" },
    { referrals: 100, bonus: 1000, label: "Diamond" },
  ];
}

/**
 * Check if user can withdraw (minimum $50)
 */
export function canWithdraw(referralEarnings: number): boolean {
  const MIN_WITHDRAWAL = 50;
  return referralEarnings >= MIN_WITHDRAWAL;
}

/**
 * Get minimum withdrawal amount
 */
export function getMinWithdrawal(): number {
  return 50;
}
