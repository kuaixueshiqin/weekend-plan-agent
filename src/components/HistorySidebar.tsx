import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Search, Settings, Plus,
  MessageSquare, Clock, ChevronRight,
} from "lucide-react";

// ── Mock history data (按时间分组)
interface HistoryItem {
  id: string;
  title: string;
  time?: string;       // relative time label
}

const HISTORY_GROUPS = [
  {
    label: "今天",
    items: [
      { id: "h1", title: "带5岁孩子去朝阳公园半日游" },
      { id: "h2", title: "三里屯附近亲子餐厅推荐" },
      { id: "h3", title: "周末带父母去颐和园轻松游" },
    ],
  },
  {
    label: "本周",
    items: [
      { id: "h4", title: "望京SOHO附近下午茶+逛街" },
      { id: "h5", title: "798艺术区拍照打卡路线" },
      { id: "h6", title: "中关村科技馆一日游规划" },
    ],
  },
  {
    label: "本月",
    items: [
      { id: "h7", title: "奥林匹克森林公园骑行" },
      { id: "h8", title: "南锣鼓巷美食探店攻略" },
      { id: "h9", title: "什刹海划船+周边游玩" },
    ],
  },
  {
    label: "更早",
    items: [
      { id: "h10", title: "故宫半日游路线推荐" },
      { id: "h11", title: "天坛公园游览建议" },
      { id: "h12", title: "北海公园野餐安排" },
    ],
  },
];

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
  onSelectChat: (id: string) => void;
  currentLocationName: string;
  onLocationClick: () => void;
}

const HistorySidebar = ({
  open,
  onClose,
  onSelectChat,
  currentLocationName,
  onLocationClick,
}: HistorySidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter groups by search
  const filteredGroups = searchQuery.trim()
    ? HISTORY_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((g) => g.items.length > 0)
    : HISTORY_GROUPS;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55]"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] h-full w-full max-w-[430px] bg-background flex flex-col"
            style={{ boxShadow: "8px 0 32px rgba(0,0,0,0.12)" }}
          >
            {/* ── Header ── */}
            <div
              className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3 border-b border-border/50"
              style={{
                background: "rgba(247,244,240,0.95)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              {/* Left: menu icon + title */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors shrink-0 mr-2"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold tracking-tight">周末喵</h1>
                <button
                  onClick={onLocationClick}
                  className="flex items-center gap-1 mt-0.5 group w-fit"
                >
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[180px]">
                    {currentLocationName || "选择位置"}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors"
                  aria-label="搜索"
                >
                  <Search className="w-4.5 h-4.5 text-foreground/70" />
                </button>
                <button
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors"
                  aria-label="设置"
                >
                  <Settings className="w-4.5 h-4.5 text-foreground/70" />
                </button>
              </div>
            </div>

            {/* ── Search bar (inside sidebar) ── */}
            <div className="shrink-0 px-4 py-3 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索对话…"
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                />
              </div>
            </div>

            {/* ── Scrollable list ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {filteredGroups.length === 0 && (
                <p className="text-sm text-muted-foreground text-center pt-10">没有找到相关对话</p>
              )}

              {filteredGroups.map((group) => (
                <div key={group.label}>
                  {/* Group header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      {group.label}
                    </span>
                    {group.label === "今天" && (
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border/30">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { onSelectChat(item.id); onClose(); }}
                        className="w-full text-left px-5 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors group"
                      >
                        <p className="text-sm font-medium truncate pr-6">{item.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom padding */}
              <div className="h-6" />
            </div>

            {/* ── New chat button (bottom) ── */}
            <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-background">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-amber-900 active:scale-[0.98] transition-all"
                style={{
                  boxShadow: "0 4px 16px hsl(43 100% 50% / 0.35)",
                }}
              >
                <Plus className="w-4 h-4" />
                新建对话
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistorySidebar;
