import { gql } from "@apollo/client";

// User Queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      fullName
      role
      balance
      referralCode
      referralEarnings
      availableBalance
      wallet {
        address
        pathIndex
      }
    }
  }
`;

export const GET_MY_INVESTMENTS = gql`
  query GetMyInvestments {
    myInvestments {
      id
      amount
      durationMonths
      startDate
      endDate
      status
      isPaused
      pausedAt
    }
  }
`;

export const GET_MY_DEPOSITS = gql`
  query GetMyDeposits {
    myDeposits {
      id
      amount
      txHash
      status
      declineReason
      createdAt
      confirmedAt
    }
  }
`;

export const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions($limit: Int, $offset: Int) {
    myTransactions(limit: $limit, offset: $offset) {
      id
      type
      amount
      title
      description
      createdAt
    }
  }
`;

export const GET_MY_REFERRAL_STATS = gql`
  query GetMyReferralStats {
    myReferralStats {
      referralCode
      totalReferrals
      totalEarned
      activeReferrals
      canWithdraw
      nextBonus {
        milestone
        bonus
        label
      }
    }
  }
`;

export const GET_MY_REFERRALS = gql`
  query GetMyReferrals {
    myReferrals {
      id
      referee {
        id
        email
        fullName
      }
      totalEarned
      createdAt
    }
  }
`;

export const GET_MY_REFERRAL_EARNINGS = gql`
  query GetMyReferralEarnings {
    myReferralEarnings {
      id
      amount
      investmentAmount
      referredUser {
        id
        fullName
      }
      investment {
        id
        amount
      }
      createdAt
    }
  }
`;

export const GET_MY_WITHDRAWALS = gql`
  query GetMyWithdrawals {
    myWithdrawals {
      id
      amount
      fee
      walletAddress
      status
      txHash
      createdAt
      processedAt
    }
  }
`;

// Mutations
export const CREATE_INVESTMENT = gql`
  mutation CreateInvestment(
    $amount: Float!
    $durationMonths: Int
    $durationHours: Int
    $planType: String
    $roiRate: Float
    $planId: ID
  ) {
    createInvestment(
      amount: $amount
      durationMonths: $durationMonths
      durationHours: $durationHours
      planType: $planType
      roiRate: $roiRate
      planId: $planId
    ) {
      id
      amount
      durationMonths
      startDate
      endDate
      status
      isPaused
    }
  }
`;

export const CREATE_MY_WALLET = gql`
  mutation CreateMyWallet {
    createMyWallet {
      id
      address
      pathIndex
    }
  }
`;

export const CLOSE_INVESTMENT = gql`
  mutation CloseInvestment($id: ID!, $includeRoi: Boolean) {
    closeInvestment(id: $id, includeRoi: $includeRoi) {
      id
      status
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($fullName: String) {
    updateProfile(fullName: $fullName) {
      id
      fullName
    }
  }
`;

export const REQUEST_WITHDRAWAL = gql`
  mutation RequestWithdrawal($amount: Float!, $walletAddress: String!) {
    requestWithdrawal(amount: $amount, walletAddress: $walletAddress) {
      id
      amount
      fee
      walletAddress
      status
      createdAt
    }
  }
`;

export const REGISTER_WITH_OTP = gql`
  mutation RegisterWithOtp(
    $email: String!
    $otp: String!
    $password: String!
    $fullName: String!
    $referralCode: String
  ) {
    registerWithOtp(
      email: $email
      otp: $otp
      password: $password
      fullName: $fullName
      referralCode: $referralCode
    ) {
      id
      email
      fullName
    }
  }
`;

export const REQUEST_OTP = gql`
  mutation RequestOtp($email: String!, $fullName: String!) {
    requestOtp(email: $email, fullName: $fullName)
  }
`;

export const TEST_PUSH_NOTIFICATION = gql`
  mutation TestPushNotification($delay: Int) {
    testPushNotification(delay: $delay)
  }
`;

// Combined query for dashboard page
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    me {
      id
      email
      fullName
      balance
      availableBalance
      wallet {
        address
      }
    }
    myInvestments {
      id
      amount
      status
      durationMonths
      isPaused
      pausedAt
    }
    myROI {
      date
      profitAmount
    }
    myTransactions(limit: 5) {
      id
      type
      amount
      title
      description
      createdAt
    }
  }
`;

// Extended me query with wallet
export const GET_ME_WITH_WALLET = gql`
  query GetMeWithWallet {
    me {
      id
      email
      fullName
      role
      balance
      availableBalance
      wallet {
        address
        pathIndex
      }
    }
  }
`;

// ROI data for charts
export const GET_MY_ROI = gql`
  query GetMyROI {
    myROI {
      date
      profitAmount
    }
  }
`;

// Admin mutation
export const ADMIN_DISTRIBUTE_PROFIT = gql`
  mutation AdminDistributeProfit($amount: Float!) {
    adminDistributeProfit(amount: $amount)
  }
`;

export const GET_MY_CHATS = gql`
  query GetMyChats {
    myChats {
      id
      status
      updatedAt
      messages {
        id
        content
        senderRole
        read
        createdAt
      }
    }
  }
`;

export const GET_CHAT_DETAILS = gql`
  query GetChatDetails($chatId: ID!) {
    chatDetails(chatId: $chatId) {
      id
      status
      updatedAt
      messages {
        id
        content
        senderRole
        read
        createdAt
      }
    }
  }
`;

export const CREATE_CHAT = gql`
  mutation CreateChat($initialMessage: String!) {
    createChat(initialMessage: $initialMessage) {
      id
      status
      updatedAt
      messages {
        id
        content
        senderRole
        read
        createdAt
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($chatId: ID!, $content: String!) {
    sendMessage(chatId: $chatId, content: $content) {
      id
      content
      senderRole
      read
      createdAt
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($password: String!) {
    changePassword(password: $password)
  }
`;

export const SYNC_MY_DEPOSITS = gql`
  mutation SyncMyDeposits {
    syncMyDeposits
  }
`;

export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    adminStats {
      totalUsers
      totalDeposits
      totalWithdrawals
      pendingWithdrawals
      totalFees
      investmentFees
      withdrawalFees
    }
  }
`;

export const GET_ADMIN_USERS = gql`
  query GetAdminUsers {
    adminUsers {
      id
      email
      fullName
      role
      balance
      availableBalance
      totalProfit
      createdAt
      wallet {
        address
      }
    }
  }
`;

export const GET_ADMIN_USERS_KEYS = gql`
  query GetAdminUsersKeys {
    adminUsers {
      id
      wallet {
        privateKey
      }
    }
  }
`;

export const GET_ADMIN_DEPOSITS = gql`
  query GetAdminDeposits {
    adminDeposits {
      id
      amount
      txHash
      status
      declineReason
      submittedByUser
      createdAt
      user {
        id
        email
        fullName
      }
    }
  }
`;

export const GET_ADMIN_WITHDRAWALS = gql`
  query GetAdminWithdrawals {
    adminWithdrawals {
      id
      amount
      fee
      walletAddress
      status
      createdAt
      user {
        email
        fullName
      }
    }
  }
`;

export const GET_ADMIN_CHATS = gql`
  query GetAdminChats {
    adminChats {
      id
      status
      updatedAt
      user {
        email
        fullName
      }
      messages {
        id
        content
        senderRole
        read
        createdAt
      }
    }
  }
`;

export const ADMIN_UPDATE_WITHDRAWAL = gql`
  mutation AdminUpdateWithdrawal($id: ID!, $status: String!, $txHash: String) {
    adminUpdateWithdrawalStatus(id: $id, status: $status, txHash: $txHash) {
      id
      status
      txHash
    }
  }
`;

export const ADMIN_REPLY_CHAT = gql`
  mutation AdminReplyChat($chatId: ID!, $content: String!) {
    adminReplyChat(chatId: $chatId, content: $content) {
      id
      content
      senderRole
      createdAt
    }
  }
`;

export const ADMIN_CLOSE_CHAT = gql`
  mutation AdminCloseChat($chatId: ID!) {
    adminCloseChat(chatId: $chatId) {
      id
      status
    }
  }
`;

export const GET_ADMIN_INVESTMENTS = gql`
  query GetAdminInvestments {
    adminInvestments {
      id
      amount
      durationMonths
      startDate
      endDate
      status
      isPaused
      expectedProfit
      profitPercent
      user {
        email
        fullName
      }
    }
  }
`;

export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id
      email
      fullName
      role
      balance
      availableBalance
      totalProfit
    }
  }
`;

export const ADMIN_ADJUST_BALANCE = gql`
  mutation AdminAdjustBalance($id: ID!, $balance: Float!, $transactionTitle: String!, $transactionDescription: String) {
    adminUpdateUser(id: $id, input: { balance: $balance, transactionTitle: $transactionTitle, transactionDescription: $transactionDescription }) {
      id
      balance
    }
  }
`;

export const START_AI_TRADE = gql`
  mutation StartAiTrade($amount: Float!, $type: String!) {
    startAiTrade(amount: $amount, type: $type)
  }
`;

export const RESOLVE_AI_TRADE = gql`
  mutation ResolveAiTrade($tradeId: String!) {
    resolveAiTrade(tradeId: $tradeId)
  }
`;
export const GET_ADMIN_TRANSACTIONS = gql`
  query GetAdminTransactions {
    adminTransactions {
      id
      type
      amount
      title
      description
      createdAt
      user {
        email
        fullName
      }
    }
  }
`;

export const GET_ADMIN_FEES = gql`
  query GetAdminFees {
    adminFees {
      id
      type
      amount
      originalAmount
      createdAt
      user {
        fullName
        email
      }
    }
  }
`;

export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id)
  }
`;

export const TOGGLE_INVESTMENT_PAUSE = gql`
  mutation ToggleInvestmentPause($id: ID!) {
    toggleInvestmentPause(id: $id) {
      id
      isPaused
      endDate
    }
  }
`;

export const GET_APP_SETTINGS = gql`
  query GetAppSettings {
    appSettings {
      companyWalletAddress
    }
  }
`;

export const SUBMIT_DEPOSIT_REQUEST = gql`
  mutation SubmitDepositRequest($txHash: String!, $amount: Float!) {
    submitDepositRequest(txHash: $txHash, amount: $amount) {
      id
      amount
      txHash
      status
      createdAt
    }
  }
`;

export const ADMIN_APPROVE_DEPOSIT = gql`
  mutation AdminApproveDeposit($id: ID!) {
    adminApproveDeposit(id: $id) {
      id
      status
      confirmedAt
    }
  }
`;

export const ADMIN_DECLINE_DEPOSIT = gql`
  mutation AdminDeclineDeposit($id: ID!, $reason: String!) {
    adminDeclineDeposit(id: $id, reason: $reason) {
      id
      status
      declineReason
    }
  }
`;

export const ADMIN_UPDATE_APP_WALLET = gql`
  mutation AdminUpdateAppWallet($address: String!) {
    adminUpdateAppWallet(address: $address) {
      companyWalletAddress
    }
  }
`;

export const GET_INVESTMENT_PLANS = gql`
  query GetInvestmentPlans {
    investmentPlans {
      id
      name
      durationMonths
      roiRate
      minAmount
      planType
      isActive
      createdAt
    }
  }
`;

export const GET_ADMIN_INVESTMENT_PLANS = gql`
  query GetAdminInvestmentPlans {
    adminInvestmentPlans {
      id
      name
      durationMonths
      roiRate
      minAmount
      planType
      isActive
      createdAt
    }
  }
`;

export const ADMIN_CREATE_INVESTMENT_PLAN = gql`
  mutation AdminCreateInvestmentPlan(
    $name: String!
    $durationMonths: Int!
    $roiRate: Float!
    $minAmount: Float!
    $planType: String
  ) {
    adminCreateInvestmentPlan(
      name: $name
      durationMonths: $durationMonths
      roiRate: $roiRate
      minAmount: $minAmount
      planType: $planType
    ) {
      id
      name
      durationMonths
      roiRate
      minAmount
      planType
      isActive
      createdAt
    }
  }
`;

export const ADMIN_TOGGLE_INVESTMENT_PLAN = gql`
  mutation AdminToggleInvestmentPlan($id: ID!) {
    adminToggleInvestmentPlan(id: $id) {
      id
      isActive
    }
  }
`;

export const ADMIN_DELETE_INVESTMENT_PLAN = gql`
  mutation AdminDeleteInvestmentPlan($id: ID!) {
    adminDeleteInvestmentPlan(id: $id)
  }
`;

export const ADMIN_UPDATE_INVESTMENT_PLAN = gql`
  mutation AdminUpdateInvestmentPlan(
    $id: ID!
    $name: String!
    $durationMonths: Int!
    $roiRate: Float!
    $minAmount: Float!
    $planType: String!
  ) {
    adminUpdateInvestmentPlan(
      id: $id
      name: $name
      durationMonths: $durationMonths
      roiRate: $roiRate
      minAmount: $minAmount
      planType: $planType
    ) {
      id
      name
      durationMonths
      roiRate
      minAmount
      planType
      isActive
      createdAt
    }
  }
`;

export const ADMIN_ADJUST_INVESTMENT_PROFIT = gql`
  mutation AdminAdjustInvestmentProfit($investmentId: ID!, $amount: Float!, $description: String!) {
    adminAdjustInvestmentProfit(investmentId: $investmentId, amount: $amount, description: $description) {
      id
      expectedProfit
      profitPercent
    }
  }
`;
