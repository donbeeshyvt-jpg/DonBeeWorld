/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useI18n } from "./i18n/useI18n";
import { API_BASE } from "../config";
import { apiGet, apiPost } from "../lib/api";
import { useInterval } from "../hooks/useInterval";
import { CurrencyPanel } from "../components/CurrencyPanel";
import { GatheringPanel } from "../components/GatheringPanel";
import { MarketPanel } from "../components/MarketPanel";
import { ChatPanel } from "../components/ChatPanel";
import { AnnouncementsPanel } from "../components/AnnouncementsPanel";
import { AvatarPanel } from "../components/AvatarPanel";
import { InventoryPanel } from "../components/InventoryPanel";
import { useAuth } from "./auth/AuthContext";

type WalletResponse = {
  balances: Record<string, { balance: number; lockedAmount: number }>;
};

type GatherJobsResponse = {
  jobs: {
    id: number;
    nodeKey: string;
    nodeName: string;
    status: string;
    startedAt: string;
    expectedEndAt: string;
    progressPercentage: number;
    result?: {
      items: { itemKey: string; quantity: number }[];
      experience: number;
      claimed: boolean;
      offline: boolean;
    };
  }[];
};

type MarketResponse = {
  items: {
    marketItemKey: string;
    displayName: string;
    price: number;
    delta: number;
    occurredAt: string | null;
  }[];
};

type ChatResponse = {
  messages: {
    id: number;
    channelKey: string;
    message: string;
    formatting: string | null;
    createdAt: string;
    profile?: { id: number; name: string; avatarUrl: string | null };
  }[];
};

type AnnouncementsResponse = {
  announcements: {
    id: number;
    title: string;
    content: string;
    startAt: string;
    endAt: string | null;
  }[];
};

const GATHER_NODES = [
  {
    nodeKey: "tent_honey_harvest",
    label: {
      "zh-TW": "蜜泉林採集",
      "en-US": "Honey Spring Harvest"
    }
  },
  {
    nodeKey: "tent_ice_mine",
    label: {
      "zh-TW": "冰晶礦脈",
      "en-US": "Crystalized Ice Mine"
    }
  },
  {
    nodeKey: "workshop_fungi_lab",
    label: {
      "zh-TW": "地下真菌培養",
      "en-US": "Underground Fungus Lab"
    }
  }
] as const;

type TabKey = "gather" | "market" | "inventory" | "lobby";

export default function HomePage() {
  const { t, locale, switchLocale } = useI18n();
  const {
    status,
    account,
    profile,
    login,
    register,
    logout,
    token
  } = useAuth();

  const isAuthenticated = status === "authenticated";
  const isLoadingAuth = status === "loading";

  const [wallets, setWallets] = useState<
    Record<string, { balance: number; lockedAmount: number }>
  >({});
  const [gatherJobs, setGatherJobs] = useState<GatherJobsResponse["jobs"]>([]);
  const [marketItems, setMarketItems] = useState<MarketResponse["items"]>([]);
  const [messages, setMessages] = useState<ChatResponse["messages"]>([]);
  const [announcements, setAnnouncements] = useState<
    AnnouncementsResponse["announcements"]
  >([]);
  const [socketRef, setSocketRef] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("lobby");

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const refreshWallets = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiGet<WalletResponse>("/api/economy/wallets");
      setWallets(data.balances);
    } catch (error) {
      console.error("Wallet refresh failed", error);
    }
  }, [isAuthenticated]);

  const refreshGatherJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiGet<GatherJobsResponse>("/api/gather/jobs");
      setGatherJobs(data.jobs);
    } catch (error) {
      console.error("Gather refresh failed", error);
    }
  }, [isAuthenticated]);

  const refreshMarket = useCallback(async () => {
    try {
      const data = await apiGet<MarketResponse>("/api/market/items");
      setMarketItems(data.items);
    } catch (error) {
      console.error("Market refresh failed", error);
    }
  }, []);

  const refreshChat = useCallback(async () => {
    try {
      const data = await apiGet<ChatResponse>(
        "/api/chat/channels/global/messages?limit=60"
      );
      setMessages(data.messages);
    } catch (error) {
      console.error("Chat refresh failed", error);
    }
  }, []);

  const refreshAnnouncements = useCallback(async () => {
    try {
      const data = await apiGet<AnnouncementsResponse>("/api/chat/announcements");
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error("Announcement refresh failed", error);
    }
  }, []);

  useEffect(() => {
    refreshChat();
    refreshAnnouncements();
  }, [refreshChat, refreshAnnouncements]);

  useEffect(() => {
    if (!isAuthenticated) {
      setWallets({});
      setGatherJobs([]);
      if (activeTab !== "lobby") {
        setActiveTab("lobby");
      }
      return;
    }
    refreshWallets();
    refreshGatherJobs();
    refreshMarket();
  }, [
    isAuthenticated,
    refreshWallets,
    refreshGatherJobs,
    refreshMarket,
    activeTab
  ]);

  useInterval(isAuthenticated ? refreshWallets : null, 30000);
  useInterval(isAuthenticated ? refreshGatherJobs : null, 20000);
  useInterval(refreshMarket, 60000);
  useInterval(refreshAnnouncements, 90000);
  useInterval(refreshChat, 15000);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined
    });
    socket.emit("joinChannel", "global");
    socket.on("chat:message", (payload) => {
      setMessages((prev) => [...prev.slice(-59), payload]);
    });
    socket.on("chat:announcement", () => {
      refreshAnnouncements();
    });
    setSocketRef(socket);
    return () => {
      socket.disconnect();
    };
  }, [token, refreshAnnouncements]);

  const handleSponsorClick = useCallback(() => {
    window.open("https://donbeeworld.com/support", "_blank");
  }, []);

  const handleLanguageToggle = useCallback(() => {
    switchLocale(locale === "zh-TW" ? "en-US" : "zh-TW");
  }, [locale, switchLocale]);

  const handleStartGather = useCallback(
    async (nodeKey: string, cycles: number) => {
      if (!isAuthenticated) return;
      await apiPost(`/api/gather/jobs`, {
        nodeKey,
        cycles
      });
      await refreshGatherJobs();
    },
    [isAuthenticated, refreshGatherJobs]
  );

  const handleMarketTrade = useCallback(
    async (
      mode: "buy-coin" | "buy-soul" | "sell-coin" | "sell-soul",
      marketItemKey: string
    ) => {
      if (!isAuthenticated) return;
      const [action, currency] = mode.split("-");
      await apiPost(
        `/api/market/${action === "buy" ? "buy" : "sell"}`,
        {
          marketItemKey,
          quantity: 1,
          currency: currency === "coin" ? "coin" : "soul"
        }
      );
      await Promise.all([refreshWallets(), refreshMarket()]);
    },
    [isAuthenticated, refreshMarket, refreshWallets]
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!isAuthenticated) return;
      const payload = await apiPost(`/api/chat/channels/global/messages`, {
        message
      });
      setMessages((prev) => [...prev.slice(-59), payload]);
    },
    [isAuthenticated]
  );

  const handleAuthSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthSubmitting(true);
      setAuthError(null);
      try {
        if (authMode === "login") {
          await login(authUsername.trim(), authPassword);
        } else {
          await register(authUsername.trim(), authPassword);
        }
        setAuthUsername("");
        setAuthPassword("");
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "Authentication failed"
        );
      } finally {
        setAuthSubmitting(false);
      }
    },
    [authMode, authPassword, authUsername, login, register]
  );

  const goldCoins = wallets.coin?.balance ?? 0;
  const soulCoins = wallets.soul?.balance ?? 0;

  const gatherNodeOptions = useMemo(
    () =>
      GATHER_NODES.map((node) => ({
        nodeKey: node.nodeKey,
        label: node.label[locale]
      })),
    [locale]
  );

  const offlineNotes = useMemo(() => {
    return gatherJobs
      .filter((job) => job.result?.offline)
      .map(
        (job) =>
          `${job.nodeName} · ${job.result?.items
            .map((item) => `${item.itemKey}×${item.quantity}`)
            .join("、")} · EXP +${job.result?.experience}`
      );
  }, [gatherJobs]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "lobby") {
      setActiveTab("gather");
    }
  }, [isAuthenticated, activeTab]);

  const tabItems: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: "gather", label: t("tabGathering") },
      { key: "market", label: t("tabMarket") },
      { key: "inventory", label: t("tabInventory") },
      { key: "lobby", label: t("tabLobby") }
    ],
    [t]
  );

  return (
    <main className="app-shell">
      <header className="brand-header">
        <div className="brand-title">
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <div className="brand-actions">
          <button className="btn btn-link" onClick={handleLanguageToggle}>
            {t("language")}
          </button>
          <button className="btn btn-accent" onClick={handleSponsorClick}>
            {t("supportLink")}
          </button>
          {isAuthenticated ? (
            <button className="btn btn-ghost" onClick={logout}>
              {t("logoutAction")}
            </button>
          ) : null}
        </div>
      </header>

      <div className="app-body">
        <section className="workspace">
          <nav className="tab-bar">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="tab-content">
            {activeTab === "gather" && (
              <GatheringPanel
                jobs={gatherJobs}
                nodes={gatherNodeOptions}
                t={t}
                onStartGather={handleStartGather}
                disabled={!isAuthenticated}
              />
            )}
            {activeTab === "market" && (
              <MarketPanel
                items={marketItems}
                t={t}
                onTrade={handleMarketTrade}
                disabled={!isAuthenticated}
              />
            )}
            {activeTab === "inventory" && <InventoryPanel t={t} />}
            {activeTab === "lobby" && (
              <div className="lobby-panels">
                <AnnouncementsPanel
                  announcements={announcements}
                  offlineNotes={offlineNotes}
                  t={t}
                />
                <ChatPanel
                  messages={messages}
                  t={t}
                  onSend={handleSendMessage}
                  disabled={!isAuthenticated}
                />
              </div>
            )}
          </div>
        </section>

        <aside className="sidebar">
          <AvatarPanel t={t} avatarUrl={profile?.avatarUrl} />
          <CurrencyPanel
            gold={goldCoins}
            soul={soulCoins}
            t={t}
            onSponsor={handleSponsorClick}
            onToggleLanguage={handleLanguageToggle}
            languageLabel={t("language")}
            donationLabel={t("donationLabel")}
          />
          <div className="sidebar-card">
            <h3>Adventurer</h3>
            {isAuthenticated ? (
              <ul className="stats-list">
                <li>
                  <span>ID</span>
                  <span>{profile?.id}</span>
                </li>
                <li>
                  <span>{t("usernameLabel")}</span>
                  <span>{account?.username}</span>
                </li>
                <li>
                  <span>{t("tabInventory")}</span>
                  <span>{profile?.profileName}</span>
                </li>
              </ul>
            ) : (
              <div className="muted">
                <p>{t("guestNotice")}</p>
                <p>{t("viewOnlyNotice")}</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {status !== "authenticated" && (
        <div className="auth-overlay">
          <div className="auth-modal card">
            {isLoadingAuth ? (
              <p>Loading...</p>
            ) : (
              <form onSubmit={handleAuthSubmit}>
                <header>
                  <div className="auth-tabs">
                    <button
                      type="button"
                      className={authMode === "login" ? "active" : ""}
                      onClick={() => setAuthMode("login")}
                    >
                      {t("loginAction")}
                    </button>
                    <button
                      type="button"
                      className={authMode === "register" ? "active" : ""}
                      onClick={() => setAuthMode("register")}
                    >
                      {t("registerAction")}
                    </button>
                  </div>
                  <h2>
                    {authMode === "login" ? t("loginTitle") : t("registerTitle")}
                  </h2>
                  <p className="muted">
                    {authMode === "login"
                      ? t("loginSubtitle")
                      : t("registerSubtitle")}
                  </p>
                </header>
                <label>
                  <span>{t("usernameLabel")}</span>
                  <input
                    value={authUsername}
                    onChange={(event) => setAuthUsername(event.target.value)}
                    minLength={3}
                    required
                  />
                </label>
                <label>
                  <span>{t("passwordLabel")}</span>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </label>
                {authError ? <p className="error-text">{authError}</p> : null}
                <button className="btn btn-primary" type="submit" disabled={authSubmitting}>
                  {authSubmitting
                    ? "..."
                    : authMode === "login"
                    ? t("loginAction")
                    : t("registerAction")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
