import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import {
  endDevice,
  getDevices,
  getDeviceStatus,
  getRecords,
  startDevice,
  toggleFavo,
} from '../lib/api';
import { getDeviceRemark, setDeviceRemark } from '../lib/storage';

type Account = {
  id: string;
  name: string;
  pn: string;
  useScore: number;
  img?: string;
};

type Device = {
  id: string;
  name: string;
  status: number;
  online: boolean;
  addr: string;
  ep: string;
  remark: string;
};

type DeviceStatus = {
  out: number;
  vel: number;
  status: number;
};

type RecordItem = {
  id: string;
  did: string;
  dname?: string;
  ep?: string;
  start_at: number;
  end_at?: number;
  out_ml: number;
  score?: number;
};

type AppDataContextValue = {
  loading: boolean;
  recordsLoading: boolean;
  actionLoading: boolean;
  message: string;
  account: Account | null;
  devices: Device[];
  selectedId: string;
  isDrinking: boolean;
  deviceStatus: DeviceStatus | null;
  accScore: string;
  records: RecordItem[];
  recordsTotal: number;
  setSelectedId: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  refreshRecords: () => Promise<void>;
  startDrinking: () => Promise<void>;
  stopDrinking: () => Promise<void>;
  bindDevice: (deviceId: string) => Promise<boolean>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  saveDeviceRemark: (deviceId: string, remark: string) => Promise<void>;
  clearMessage: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

type AppDataProviderProps = {
  children: ReactNode;
  token: string;
  onExpired: () => Promise<void>;
};

export function AppDataProvider({ children, token, onExpired }: AppDataProviderProps) {
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isDrinking, setIsDrinking] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [accScore, setAccScore] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedIdRef = useRef('');
  const isDrinkingRef = useRef(false);
  const deviceStatusRef = useRef<DeviceStatus | null>(null);
  const accScoreRef = useRef('');
  const accountRef = useRef<Account | null>(null);
  const devicesRef = useRef<Device[]>([]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    isDrinkingRef.current = isDrinking;
  }, [isDrinking]);

  useEffect(() => {
    deviceStatusRef.current = deviceStatus;
  }, [deviceStatus]);

  useEffect(() => {
    accScoreRef.current = accScore;
  }, [accScore]);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  function clearMessage() {
    setMessage('');
  }

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
  }

  function cleanupTimer() {
    if (!statusTimerRef.current) return;
    clearInterval(statusTimerRef.current);
    statusTimerRef.current = null;
  }

  useEffect(() => {
    if (!token) {
      cleanupTimer();
      setLoading(false);
      setRecordsLoading(false);
      setActionLoading(false);
      setMessage('');
      setAccount(null);
      setDevices([]);
      setSelectedId('');
      setIsDrinking(false);
      setDeviceStatus(null);
      setAccScore('');
      setRecords([]);
      setRecordsTotal(0);
      return;
    }

    refreshDevices();

    return () => {
      cleanupTimer();
    };
  }, [token]);

  async function refreshDevices() {
    if (!token) return;

    setLoading(true);

    try {
      const response = await getDevices(token);
      const data = response.data;

      if (response.code !== 0) {
        await onExpired();
        return;
      }

      if (!data?.account) {
        showMessage('获取账户信息失败');
        return;
      }

      const nextAccount: Account = {
        id: String(data.account.id),
        name: String(data.account.name || ''),
        pn: String(data.account.pn || ''),
        useScore: Number(data.account.useScore || 0),
        img: data.account.img,
      };

      const nextDevices: Device[] = await Promise.all(
        (data.favos || []).map(async (item) => ({
          id: String(item.id),
          name: String(item.name || ''),
          status: item.gene?.status ?? 99,
          online: item.status === 1,
          addr: item.addr?.detail || item.addr?.dist || '',
          ep: item.ep?.name || '',
          remark: (await getDeviceRemark(String(item.id))) || '',
        })),
      );

      nextDevices.reverse();

      setAccount(nextAccount);
      setDevices(nextDevices);
      setAccScore(String(nextAccount.useScore || ''));

      setSelectedId((current) => {
        if (current && nextDevices.some((item) => item.id === current)) return current;
        return nextDevices[0]?.id ?? '';
      });
    } catch {
      showMessage('加载设备失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedId || !token) return;

    checkDeviceInUse(selectedId);
  }, [selectedId, token]);

  async function checkDeviceInUse(deviceId: string) {
    try {
      const response = await getDeviceStatus(deviceId, token);

      if (response.code === -99) {
        await onExpired();
        return;
      }

      const gene = response.data?.device?.gene;
      if (gene?.status !== undefined && gene.status !== 99) {
        setIsDrinking(true);
        setDeviceStatus({
          out: gene.out ?? 0,
          vel: gene.vel ?? 0,
          status: gene.status,
        });
        if (response.data?.accScore) setAccScore(response.data.accScore);
        showMessage('检测到设备正在使用，已恢复接水状态');
        startStatusCheck(true);
      }
    } catch {
      // ignore
    }
  }

  /*
   * 2026-03-26:
   * 轮询状态时不能把“短暂空闲”立即当成结束，否则设备抖动会导致错误结算。
   * 这里保留和 Web 端一致的宽容判断，后续改这段时要先保证结算时机不被提前触发。
   */
  function startStatusCheck(alreadyBusy = false) {
    cleanupTimer();

    let busyConfirmed = alreadyBusy;
    let idleCount = 0;

    statusTimerRef.current = setInterval(async () => {
      if (!selectedId || !token || !account?.id || !isDrinking) {
        cleanupTimer();
        return;
      }

      try {
        const response = await getDeviceStatus(selectedId, token);

        if (response.code === -99) {
          cleanupTimer();
          await onExpired();
          return;
        }

        const gene = response.data?.device?.gene;
        if (!gene) return;

        const nextStatus = gene.status ?? 99;
        setDeviceStatus({
          out: gene.out ?? 0,
          vel: gene.vel ?? 0,
          status: nextStatus,
        });

        if (response.data?.accScore) setAccScore(response.data.accScore);

        setDevices((current) =>
          current.map((item) => (item.id === selectedId ? { ...item, status: nextStatus } : item)),
        );

        if (nextStatus !== 99) {
          busyConfirmed = true;
          idleCount = 0;
          return;
        }

        if (!busyConfirmed) {
          idleCount += 1;
          if (idleCount > 15) {
            cleanupTimer();
            setIsDrinking(false);
            setDeviceStatus(null);
            showMessage('设备未响应，已取消');
          }
          return;
        }

        idleCount += 1;
        if (idleCount < 5) return;

        cleanupTimer();

        const outMl = gene.out ?? 0;
        setIsDrinking(false);
        setDeviceStatus(null);
        setDevices((current) =>
          current.map((item) => (item.id === selectedId ? { ...item, status: 99 } : item)),
        );

        try {
          await endDevice(selectedId, token, account.id, outMl, accScore);
        } catch {
          // ignore
        }

        showMessage('接水完成，已自动结算');
      } catch {
        // ignore
      }
    }, 1000);
  }

  async function startDrinkingAction() {
    await startDrinkingById(selectedId);
  }

  async function startDrinkingById(deviceId: string) {
    if (!deviceId || !accountRef.current?.id) {
      showMessage('请先选择设备');
      return;
    }

    const currentDevice = devicesRef.current.find((item) => item.id === deviceId);
    if (!currentDevice) {
      showMessage('未找到设备');
      return;
    }

    setActionLoading(true);

    try {
      const response = await startDevice(
        deviceId,
        token,
        accountRef.current.id,
        currentDevice.name,
        currentDevice.ep,
      );

      if (response.code === -99) {
        await onExpired();
        return;
      }

      if (response.code !== 0) {
        showMessage(response.msg || '设备无响应');
        return;
      }

      setSelectedId(deviceId);
      setIsDrinking(true);
      showMessage('开始接水');
      startStatusCheck();
    } catch {
      showMessage('操作失败');
    } finally {
      setActionLoading(false);
    }
  }

  async function stopDrinkingAction() {
    await stopDrinkingById(selectedIdRef.current);
  }

  async function stopDrinkingById(deviceId: string) {
    if (!deviceId || !accountRef.current?.id) {
      showMessage('当前没有可结算设备');
      return;
    }

    cleanupTimer();
    setActionLoading(true);

    try {
      await endDevice(
        deviceId,
        token,
        accountRef.current.id,
        deviceStatusRef.current?.out ?? 0,
        accScoreRef.current,
      );
      setIsDrinking(false);
      setDeviceStatus(null);
      setDevices((current) =>
        current.map((item) => (item.id === deviceId ? { ...item, status: 99 } : item)),
      );
      setSelectedId(deviceId);
      showMessage('已结算');
    } catch {
      showMessage('结算可能未成功，请检查');
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshRecords() {
    if (!account?.id) return;

    setRecordsLoading(true);

    try {
      const response = await getRecords(account.id, 1, 50);
      setRecords(response.items || []);
      setRecordsTotal(response.total || 0);
    } catch {
      showMessage('加载记录失败');
    } finally {
      setRecordsLoading(false);
    }
  }

  async function bindDeviceAction(deviceId: string) {
    try {
      const response = await toggleFavo(deviceId, false, token);

      if (response.code === -99) {
        await onExpired();
        return false;
      }

      if (response.code !== 0) {
        showMessage(response.msg || '绑定失败');
        return false;
      }

      await refreshDevices();
      showMessage('设备添加成功');
      return true;
    } catch {
      showMessage('网络错误');
      return false;
    }
  }

  async function removeDeviceAction(deviceId: string) {
    try {
      const response = await toggleFavo(deviceId, true, token);

      if (response.code === -99) {
        await onExpired();
        return false;
      }

      if (response.code !== 0) {
        showMessage(response.msg || '删除失败');
        return false;
      }

      setDevices((current) => current.filter((item) => item.id !== deviceId));
      setSelectedId((current) => (current === deviceId ? '' : current));
      showMessage('设备已删除');
      return true;
    } catch {
      showMessage('删除失败');
      return false;
    }
  }

  async function saveDeviceRemarkAction(deviceId: string, remark: string) {
    const nextRemark = remark.trim();
    await setDeviceRemark(deviceId, nextRemark);
    setDevices((current) =>
      current.map((item) => (item.id === deviceId ? { ...item, remark: nextRemark } : item)),
    );
    showMessage(nextRemark ? '备注已保存' : '备注已清空');
  }

  return (
    <AppDataContext.Provider
      value={{
        loading,
        recordsLoading,
        actionLoading,
        message,
        account,
        devices,
        selectedId,
        isDrinking,
        deviceStatus,
        accScore,
        records,
        recordsTotal,
        setSelectedId,
        refreshDevices,
        refreshRecords,
        startDrinking: startDrinkingAction,
        stopDrinking: stopDrinkingAction,
        bindDevice: bindDeviceAction,
        removeDevice: removeDeviceAction,
        saveDeviceRemark: saveDeviceRemarkAction,
        clearMessage,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
}
