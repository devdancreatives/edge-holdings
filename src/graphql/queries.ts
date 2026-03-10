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
    $durationMonths: Int!
    $durationHours: Int
    $planType: String
    $roiRate: Float
  ) {
    createInvestment(
      amount: $amount
      durationMonths: $durationMonths
      durationHours: $durationHours
      planType: $planType
      roiRate: $roiRate
    ) {
      id
      amount
      durationMonths
      startDate
      endDate
      status
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
  mutation CloseInvestment($id: ID!) {
    closeInvestment(id: $id) {
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
    }
    myROI {
      date
      profitAmount
    }
    myTransactions(limit: 5) {
      id
      type
      amount
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
      createdAt
      user {
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
