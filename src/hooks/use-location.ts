import { useState, useEffect, useCallback } from "react";

export interface SavedAddress {
  id: string;
  label: string;      // 家 / 公司 / 自定义
  name: string;       // 显示名称
  detail: string;     // 详细地址
  tag?: "家" | "公司" | string;
}

export type LocationStatus = "idle" | "locating" | "located" | "denied" | "manual";

export interface LocationState {
  status: LocationStatus;
  displayName: string;          // 首页显示的简短名称
  fullAddress: string;          // 完整地址
  coords?: { lat: number; lng: number };
}

const STORAGE_KEY = "zhoumoumiao_location";
const ADDRESSES_KEY = "zhoumoumiao_saved_addresses";

const DEFAULT_ADDRESSES: SavedAddress[] = [
  { id: "home", label: "家", name: "三里屯太古里", detail: "北京市朝阳区三里屯路19号", tag: "家" },
  { id: "work", label: "公司", name: "中关村创业大街", detail: "北京市海淀区中关村大街18号", tag: "公司" },
];

function loadLocation(): LocationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocation(loc: LocationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {}
}

export function loadSavedAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ADDRESSES;
  } catch {
    return DEFAULT_ADDRESSES;
  }
}

export function saveAddresses(addresses: SavedAddress[]) {
  try {
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
  } catch {}
}

/** 粗略地将经纬度转为显示名（真实场景走逆地理编码 API） */
function coordsToDisplayName(_lat: number, _lng: number): string {
  return "当前位置";
}

export function useLocation() {
  const [location, setLocationState] = useState<LocationState>(() => {
    const saved = loadLocation();
    return saved ?? { status: "idle", displayName: "", fullAddress: "" };
  });

  const updateLocation = useCallback((loc: LocationState) => {
    setLocationState(loc);
    saveLocation(loc);
  }, []);

  /** 触发 GPS 定位 */
  const requestGPS = useCallback(() => {
    updateLocation({ status: "locating", displayName: "定位中…", fullAddress: "" });

    if (!navigator.geolocation) {
      updateLocation({ status: "denied", displayName: "定位不可用", fullAddress: "" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const name = coordsToDisplayName(pos.coords.latitude, pos.coords.longitude);
        updateLocation({
          status: "located",
          displayName: name,
          fullAddress: name,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      () => {
        updateLocation({ status: "denied", displayName: "定位失败", fullAddress: "" });
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, [updateLocation]);

  /** 手动选择地址 */
  const selectAddress = useCallback(
    (name: string, detail: string) => {
      updateLocation({ status: "manual", displayName: name, fullAddress: detail });
    },
    [updateLocation]
  );

  /** 初始化：如果从未定位，尝试静默请求 GPS */
  useEffect(() => {
    if (location.status === "idle") {
      requestGPS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, requestGPS, selectAddress, updateLocation };
}
