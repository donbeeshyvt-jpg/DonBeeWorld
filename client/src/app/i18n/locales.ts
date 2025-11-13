export type LocaleKey = "zh-TW" | "en-US";

type Messages = {
  title: string;
  subtitle: string;
  goldCoins: string;
  soulCoins: string;
  sponsor: string;
  language: string;
  gathering: string;
  activeRuns: string;
  startGather: string;
  selectNode: string;
  cycles: string;
  market: string;
  price: string;
  buyCoin: string;
  buySoul: string;
  sellCoin: string;
  sellSoul: string;
  chat: string;
  send: string;
  announcements: string;
  offlineReport: string;
  avatarUpload: string;
  changeLanguage: string;
  stockTicker: string;
  donationLabel: string;
  noActiveJobs: string;
  offlineCompletion: string;
  noAnnouncements: string;
  noOfflineRecords: string;
  tabGathering: string;
  tabMarket: string;
  tabInventory: string;
  tabLobby: string;
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  usernameLabel: string;
  passwordLabel: string;
  loginAction: string;
  registerAction: string;
  logoutAction: string;
  guestNotice: string;
  viewOnlyNotice: string;
  supportLink: string;
  inventoryPlaceholder: string;
};

export const messages: Record<LocaleKey, Messages> = {
  "zh-TW": {
    title: "DonBeeWorld",
    subtitle: "史萊姆酒館冒險者作戰面板",
    goldCoins: "金幣",
    soulCoins: "魂幣",
    sponsor: "支持酒館",
    language: "語系",
    gathering: "採集與冒險",
    activeRuns: "進行中的作業",
    startGather: "開始採集",
    selectNode: "選擇採集點",
    cycles: "循環次數",
    market: "市場與魂幣匯率",
    price: "價格",
    buyCoin: "以金幣購買",
    buySoul: "以魂幣購買",
    sellCoin: "以金幣出售",
    sellSoul: "以魂幣出售",
    chat: "酒館聊天室",
    send: "送出",
    announcements: "公告與跑馬燈",
    offlineReport: "離線收益報告",
    avatarUpload: "角色頭像",
    changeLanguage: "切換為英文",
    stockTicker: "市場走勢",
    donationLabel: "前往 DonBeeWorld 官方贊助頁面",
    noActiveJobs: "目前沒有進行中的派遣",
    offlineCompletion: "離線完成",
    noAnnouncements: "尚無公告",
    noOfflineRecords: "暫無離線收益紀錄",
    tabGathering: "採集",
    tabMarket: "市場",
    tabInventory: "背包",
    tabLobby: "大廳",
    loginTitle: "登入 DonBeeWorld",
    loginSubtitle: "輸入帳號密碼進入酒館，帳號與密碼至少 6 個字元。",
    registerTitle: "註冊新冒險者",
    registerSubtitle: "註冊後會建立預設角色，待 GM 審核後解鎖更多功能。",
    usernameLabel: "帳號",
    passwordLabel: "密碼",
    loginAction: "登入",
    registerAction: "註冊",
    logoutAction: "登出",
    guestNotice: "目前以觀察者身分瀏覽。",
    viewOnlyNotice: "登入後才能進行採集、交易與聊天。",
    supportLink: "造訪贊助頁面",
    inventoryPlaceholder: "背包系統開發中，敬請期待下一波更新。"
  },
  "en-US": {
    title: "DonBeeWorld",
    subtitle: "Slime Tavern Operations Console",
    goldCoins: "Gold Coins",
    soulCoins: "Soul Coins",
    sponsor: "Support Tavern",
    language: "Language",
    gathering: "Gathering & Adventures",
    activeRuns: "Active Jobs",
    startGather: "Start Gathering",
    selectNode: "Select Node",
    cycles: "Cycles",
    market: "Market & Soul Exchange",
    price: "Price",
    buyCoin: "Buy with Gold",
    buySoul: "Buy with Soul",
    sellCoin: "Sell for Gold",
    sellSoul: "Sell for Soul",
    chat: "Tavern Chat",
    send: "Send",
    announcements: "Announcements",
    offlineReport: "Offline Gains",
    avatarUpload: "Avatar",
    changeLanguage: "Switch to Chinese",
    stockTicker: "Market Ticker",
    donationLabel: "Visit the DonBeeWorld support page",
    noActiveJobs: "No assignments in progress",
    offlineCompletion: "Completed offline",
    noAnnouncements: "No announcements yet",
    noOfflineRecords: "No offline records",
    tabGathering: "Gathering",
    tabMarket: "Market",
    tabInventory: "Inventory",
    tabLobby: "Lobby",
    loginTitle: "Log in to DonBeeWorld",
    loginSubtitle: "Enter your account to access the tavern. Username & password must be at least 6 characters.",
    registerTitle: "Create New Adventurer",
    registerSubtitle: "Register to receive a default profile; more features unlock after GM approval.",
    usernameLabel: "Username",
    passwordLabel: "Password",
    loginAction: "Log In",
    registerAction: "Register",
    logoutAction: "Log Out",
    guestNotice: "Currently viewing as a guest.",
    viewOnlyNotice: "Log in to gather, trade, and chat.",
    supportLink: "Visit Support Page",
    inventoryPlaceholder: "Inventory system is under development. Stay tuned!"
  }
};

