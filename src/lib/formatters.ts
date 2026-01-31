import { BN } from "@coral-xyz/anchor";

/**
 * 格式化市场赔率
 * @param yesSupply YES 份额供应量
 * @param noSupply NO 份额供应量
 * @returns { yes: number, no: number } 百分比赔率
 */
export const formatOdds = (yesSupply: number | BN, noSupply: number | BN) => {
  const yes = typeof yesSupply === "number" ? yesSupply : yesSupply.toNumber();
  const no = typeof noSupply === "number" ? noSupply : noSupply.toNumber();
  const total = yes + no;

  if (total === 0) return { yes: 50, no: 50 };

  return {
    yes: Math.round((yes / total) * 100),
    no: Math.round((no / total) * 100),
  };
};

/**
 * 格式化日期
 * @param timestamp 秒级或毫秒级时间戳
 * @returns ISO 格式日期字符串
 */
export const formatDate = (timestamp: number | BN) => {
  let ts = typeof timestamp === "number" ? timestamp : timestamp.toNumber();
  // 如果是秒级时间戳（Solana通常是秒），转换为毫秒
  if (ts < 10000000000) {
    ts *= 1000;
  }
  return new Date(ts).toISOString();
};

/**
 * 格式化交易量
 * @param yesSupply
 * @param noSupply
 * @returns 总交易量
 */
export const formatVolume = (yesSupply: number | BN, noSupply: number | BN) => {
  const yes = typeof yesSupply === "number" ? yesSupply : yesSupply.toNumber();
  const no = typeof noSupply === "number" ? noSupply : noSupply.toNumber();
  return yes + no;
};

/**
 * 将链上事件数据转换为前端统一的市场数据格式
 */
export const transformEventToMarket = (
  event: any,
  participantCount: number = 0,
) => {
  const odds = formatOdds(event.account.yesSupply, event.account.noSupply);

  return {
    marketId: event.publicKey.toString(),
    title: event.account.description, // 链上字段名为 description，但用作 title
    category: "crypto", // 目前链上无 category，默认
    volume: formatVolume(event.account.yesSupply, event.account.noSupply),
    participants: participantCount,
    odds,
    resolutionDate: formatDate(event.account.deadline),
    thumbnail: `https://placeholdit.com/600x400/F7931A/ffffff?text=${encodeURIComponent(event.account.description)}`, // Random crypto image
    status: event.account.status,
    description: event.account.description,
    trendingScore: 0, // 默认值
  };
};

/**
 * 从当前 URL 中提取 pathname 和 querystring 里的 id，
 * 并拼接成 `${pathname}/market/${id}`
 */
export function buildMarketUrlFromLocation() {
  const { origin, search } = window.location;

  // 使用 URLSearchParams 解析 querystring
  const params = new URLSearchParams(search);
  const id = params.get("id");

  if (!id) {
    throw new Error("URL 中未找到 id 参数");
  }

  return `${origin}/market/${id}`;
}
