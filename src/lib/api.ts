const BASE_URL = 'https://water.mytx.fun';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

async function request<T>(path: string, options: ApiOptions = {}) {
  const { method = 'GET', params, body } = options;
  const url = new URL(path, BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as T;
  return data;
}

export type LoginResponse = {
  code: number;
  msg?: string;
  data?: {
    al?: {
      token: string;
    };
  };
};

export type DevicesResponse = {
  code: number;
  msg?: string;
  data?: {
    account?: {
      id: string;
      name: string;
      pn: string;
      useScore?: number;
      img?: string;
    };
    pltTotalScore?: string;
    favos?: Array<{
      id: string | number;
      name: string;
      status: number;
      gene?: {
        status?: number;
      };
      addr?: {
        detail?: string;
        dist?: string;
      };
      ep?: {
        name?: string;
      };
    }>;
  };
};

export type DeviceStatusResponse = {
  code: number;
  msg?: string;
  data?: {
    accScore?: string;
    device?: {
      gene?: {
        out?: number;
        vel?: number;
        status?: number;
      };
    };
  };
};

export type RecordsResponse = {
  total: number;
  page: number;
  page_size: number;
  items: Array<{
    id: string;
    did: string;
    dname?: string;
    ep?: string;
    start_at: number;
    end_at?: number;
    out_ml: number;
    score?: number;
  }>;
};

export function getCaptchaUrl(s: string, r: string) {
  const url = new URL('/captcha', BASE_URL);
  url.searchParams.set('s', s);
  url.searchParams.set('r', r);
  return url.toString();
}

export function sendLoginCode(s: string, authCode: string, un: string) {
  return request<{ code: number; msg?: string }>('/login/code', {
    method: 'POST',
    body: { s, authCode, un },
  });
}

export function login(un: string, authCode: string) {
  return request<LoginResponse>('/login', {
    method: 'POST',
    body: { openCode: '', authCode, un, cid: 'drinkwaterapp123456789' },
  });
}

export function getDevices(token: string) {
  return request<DevicesResponse>('/devices', { params: { token } });
}

export function toggleFavo(did: string, remove: boolean, token: string) {
  return request<{ code: number; msg?: string }>('/device/favo', {
    params: { did, remove, token },
  });
}

export function startDevice(did: string, token: string, uid: string, dname: string, ep: string) {
  return request<{ code: number; msg?: string }>('/device/start', {
    params: { did, token, uid, dname, ep },
  });
}

export function endDevice(did: string, token: string, uid: string, out_ml: number, score: string) {
  return request<{ code: number; msg?: string }>('/device/end', {
    params: { did, token, uid, out_ml, score },
  });
}

export function getDeviceStatus(did: string, token: string) {
  return request<DeviceStatusResponse>('/device/status', { params: { did, token } });
}

export function getRecords(uid: string, page: number, page_size: number) {
  return request<RecordsResponse>('/records', { params: { uid, page, page_size } });
}
