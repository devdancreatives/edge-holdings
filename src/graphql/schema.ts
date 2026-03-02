export const typeDefs = `
  scalar DateTime

  type User {
    id: ID!
    email: String
    fullName: String
    role: String
    balance: Float
    referralCode: String
    referralEarnings: Float
    wallet: Wallet
    investments: [Investment]
    deposits: [Deposit]
    transactions: [Transaction]
    availableBalance: Float
    createdAt: DateTime
  }

  type Wallet {
    address: String!
    pathIndex: Int!
    privateKey: String # Admin only
  }

  type Deposit {
    id: ID!
    amount: Float!
    txHash: String!
    status: String!
    createdAt: DateTime!
    confirmedAt: DateTime
    user: User
  }

  type Investment {
    id: ID!
    amount: Float!
    durationMonths: Int!
    startDate: DateTime!
    endDate: DateTime!
    status: String!
    user: User
    createdAt: DateTime
    profitPercent: Float # Calculated on the fly
    expectedProfit: Float # Calculated on the fly
  }

  type ROISnapshot {
    date: String!
    profitAmount: Float!
    roiPercentage: Float!
  }

  type Transaction {
    id: ID!
    type: String!
    amount: Float!
    description: String
    createdAt: DateTime!
    user: User
  }

  type ReferralStats {
    referralCode: String
    totalReferrals: Int!
    totalEarned: Float!
    activeReferrals: Int!
    canWithdraw: Boolean!
    nextBonus: ReferralBonus
  }

  type Referral {
    id: ID!
    referee: User!
    totalEarned: Float!
    createdAt: DateTime!
  }

  type ReferralEarning {
    id: ID!
    amount: Float!
    investmentAmount: Float
    referredUser: User
    investment: Investment!
    createdAt: DateTime!
  }

  type ReferralBonus {
    milestone: Int!
    bonus: Float!
    label: String!
  }

  type WithdrawalRequest {
    id: ID!
    amount: Float!
    fee: Float
    walletAddress: String!
    status: String!
    txHash: String
    createdAt: DateTime!
    processedAt: DateTime
    user: User
  }

  type Chat {
    id: ID!
    userId: ID!
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User
    messages: [ChatMessage]
  }

  type ChatMessage {
    id: ID!
    chatId: ID!
    senderId: ID
    senderRole: String
    content: String!
    read: Boolean!
    createdAt: DateTime!
  }

  type Query {
    me: User
    myInvestments: [Investment]
    myDeposits: [Deposit]
    myROI: [ROISnapshot]
    myTransactions(limit: Int, offset: Int): [Transaction]
    myReferralStats: ReferralStats
    myReferrals: [Referral]
    myReferralEarnings: [ReferralEarning]
    myWithdrawals: [WithdrawalRequest]
    myChats: [Chat]
    chatDetails(chatId: ID!): Chat
    
    # Admin Queries
    adminStats: AdminStats
    adminUsers: [User]
    adminDeposits: [Deposit]
    adminWithdrawals: [WithdrawalRequest]
    adminChats: [Chat]
    adminInvestments: [Investment]
    adminAiStats: AdminAiStats
    adminInvestmentStats: AdminInvestmentStats
    adminTransactions: [Transaction]
  }

  type AdminStats {
    totalUsers: Int!
    totalDeposits: Float!
    totalWithdrawals: Float!
    pendingWithdrawals: Int!
  }

  input AdminUpdateUserInput {
    fullName: String
    email: String
    role: String
    balance: Float
  }

  type Mutation {
    createInvestment(amount: Float!, durationMonths: Int!, durationHours: Int): Investment
    simulateDeposit(amount: Float!, txHash: String!): Deposit
    createMyWallet: Wallet
    requestOtp(email: String!, fullName: String!): Boolean
    registerWithOtp(email: String!, otp: String!, password: String!, fullName: String!, referralCode: String): User
    updateProfile(fullName: String): User
    requestWithdrawal(amount: Float!, walletAddress: String!): WithdrawalRequest
    createChat(initialMessage: String!): Chat
    sendMessage(chatId: ID!, content: String!): ChatMessage
    changePassword(password: String!): Boolean
    syncMyDeposits: Int
    
    # Admin Mutations
    adminDistributeProfit(amount: Float!): String
    adminUpdateWithdrawalStatus(id: ID!, status: String!, txHash: String): WithdrawalRequest
    adminReplyChat(chatId: ID!, content: String!): ChatMessage
    adminCloseChat(chatId: ID!): Chat
    adminUpdateUser(id: ID!, input: AdminUpdateUserInput!): User
    
    # Push Notifications
    savePushSubscription(endpoint: String!, authKey: String!, p256dhKey: String!): Boolean
    testPushNotification(delay: Int): Boolean
    

    # Investment Management
    processMatureInvestments: String # Returns summary message

    # AI Trading
    startAiTrade(amount: Float!, type: String!): String # Returns 'WIN' or 'LOSS'
    resolveAiTrade(amount: Float!, profit: Float!, isWin: Boolean!): Boolean
  }

  type AdminAiStats {
    totalRevenue: Float! # Total money users stuck (Losses)
    totalPayouts: Float! # Total money paid to users (Wins)
    netHouseProfit: Float! # Revenue - Payouts
    safetyStatus: String! # "SAFE" or "RISK"
  }

  type AdminInvestmentStats {
    totalActiveCapital: Float!
    totalProjectedPayout: Float!
    totalEstimatedProfit: Float!
    activeCount: Int!
  }
`;
