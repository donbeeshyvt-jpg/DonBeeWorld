type ChatPayload = {
  channelKey: string;
  message: string;
  profile?: {
    name: string;
  };
};

let isConfigured = false;

export function configureDiscord(options: { enabled: boolean }) {
  isConfigured = options.enabled;
}

export async function relayChatToDiscord(payload: ChatPayload, source: string) {
  if (!isConfigured) return;
  // TODO: 使用 discord.js 將訊息同步至指定頻道
  console.info(`[Discord:${source}] ${payload.channelKey} > ${payload.message}`);
}

