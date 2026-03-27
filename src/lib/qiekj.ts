import { Linking } from 'react-native';

type ScanResponse = {
  code: number;
  msg?: string;
  data?: {
    id?: string | number;
  };
};

const QIE_SCAN_URL = 'https://userapi.qiekj.com/goods/scan/v2';
const QIE_USER_AGENT = 'QEUser/1.114.0 (com.qiekj.QEUser; build:1.1; iOS 26.3.0) Alamofire/5.6.4';

function normalizeSn(value: string) {
  return value.trim();
}

export function extractSnFromScan(rawValue: string) {
  const raw = rawValue.trim();

  if (!raw) {
    return '';
  }

  try {
    const url = new URL(raw);
    const paramKeys = ['SN', 'sn', 'goodsSn', 'goodsSN', 'deviceSn', 'deviceSN'];

    for (const key of paramKeys) {
      const value = url.searchParams.get(key);
      if (value) {
        return normalizeSn(value);
      }
    }

    const pathSegments = url.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .reverse();

    const pathSn = pathSegments.find((segment) => /^\d{8,20}$/.test(segment));
    if (pathSn) {
      return normalizeSn(pathSn);
    }
  } catch {
    /**
     * 2026-03-27
     * 扫码内容不一定是合法 URL，继续走纯文本回退解析。
     */
  }

  const matches = raw.match(/\d{8,20}/g);
  if (!matches || matches.length === 0) {
    return '';
  }

  const longest = matches.sort((a, b) => b.length - a.length)[0];
  return normalizeSn(longest);
}

export async function fetchGoodsIdBySn(sn: string) {
  const timestamp = String(Date.now());
  const body = new URLSearchParams({ SN: sn }).toString();

  const response = await fetch(QIE_SCAN_URL, {
    method: 'POST',
    headers: {
      Version: '1.114.0',
      channel: 'ios_app',
      timestamp,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': QIE_USER_AGENT,
    },
    body,
  });

  const json = (await response.json()) as ScanResponse;
  const goodsId = json.data?.id;

  if (!response.ok || json.code !== 0 || !goodsId) {
    throw new Error(json.msg || '未获取到 goodsId');
  }

  return String(goodsId);
}

export function buildAlipayGoodsUrl(goodsId: string) {
  const page = `pages/chooseShowerMachine/showerMachine/showerMachine?__appxPageId=8&goodsId=${goodsId}`;
  return `alipays://platformapi/startapp?appId=2018072460764274&page=${encodeURIComponent(page)}`;
}

export async function openAlipayDeviceBySn(sn: string) {
  const goodsId = await fetchGoodsIdBySn(sn);
  const url = buildAlipayGoodsUrl(goodsId);
  await Linking.openURL(url);
  return { goodsId, url };
}
