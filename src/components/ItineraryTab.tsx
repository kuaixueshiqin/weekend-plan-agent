import { useState } from "react";
import { MapPin, Utensils, Hotel, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Bookmark, Plus, Map as MapIcon, List, Trash2, RefreshCw, X, Heart, ShoppingCart, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "unbooked" | "pending" | "completed" | "expired";
type ViewMode = "timeline" | "map";

interface ItineraryItem {
  id: string;
  time: string;
  name: string;
  type: "scenic" | "food" | "hotel";
  description: string;
  price: string;
  status: Status;
  code?: string;
}

interface DayPlan {
  day: number;
  date: string;
  period: string;
  items: ItineraryItem[];
}

interface Trip {
  id: string;
  title: string;
  dates: string;
  days: DayPlan[];
  active: boolean;
  favorited: boolean;
}

const mockTrips: Trip[] = [
  {
    id: "1",
    title: "杭州2天1夜之旅",
    dates: "4月5日 - 4月6日",
    active: true,
    favorited: false,
    days: [
      {
        day: 1, date: "4月5日", period: "周六",
        items: [
          { id: "1", time: "09:00", name: "西湖风景区", type: "scenic", description: "漫步苏堤，赏断桥残雪", price: "免费", status: "completed" },
          { id: "2", time: "12:00", name: "楼外楼", type: "food", description: "西湖醋鱼、龙井虾仁双人套餐", price: "¥198", status: "completed", code: "MT20250405-8832" },
          { id: "3", time: "14:00", name: "灵隐寺", type: "scenic", description: "千年古刹，飞来峰石窟", price: "¥75", status: "pending", code: "MT20250405-7721" },
          { id: "4", time: "18:00", name: "河坊街夜市", type: "food", description: "定胜糕、葱包桧等地道小吃", price: "人均¥50", status: "unbooked" },
          { id: "5", time: "20:00", name: "西湖亚朵酒店", type: "hotel", description: "西湖步行5分钟，含双早", price: "¥458", status: "unbooked" },
        ],
      },
      {
        day: 2, date: "4月6日", period: "周日",
        items: [
          { id: "6", time: "09:00", name: "龙井茶园", type: "scenic", description: "采茶制茶体验", price: "¥120", status: "unbooked" },
          { id: "7", time: "12:00", name: "知味观·总店", type: "food", description: "小笼包、猫耳朵", price: "人均¥85", status: "unbooked" },
          { id: "8", time: "14:00", name: "宋城景区", type: "scenic", description: "宋城千古情演出", price: "¥280", status: "unbooked" },
          { id: "9", time: "18:00", name: "外婆家·西湖店", type: "food", description: "茶香鸡、杭帮菜", price: "人均¥75", status: "expired" },
        ],
      },
    ],
  },
];

const mockFavorites: Trip[] = [
  {
    id: "f1",
    title: "上海3日购物之旅",
    dates: "3月15日 - 3月17日",
    active: false,
    favorited: true,
    days: [],
  },
  {
    id: "f2",
    title: "南京2日历史文化游",
    dates: "2月20日 - 2月21日",
    active: false,
    favorited: true,
    days: [],
  },
];

const statusConfig = {
  unbooked: { icon: CircleDot, label: "未预定", className: "bg-primary/10 text-primary" },
  pending: { icon: Clock, label: "待核销", className: "bg-muted text-muted-foreground" },
  completed: { icon: CheckCircle2, label: "已核销", className: "bg-meituan-green/10 text-meituan-green" },
  expired: { icon: AlertCircle, label: "已过期", className: "bg-meituan-red/10 text-meituan-red" },
};

const typeIcon = { scenic: MapPin, food: Utensils, hotel: Hotel };
const typeColor = { scenic: "border-l-meituan-blue", food: "border-l-meituan-orange", hotel: "border-l-purple-500" };

const ItineraryTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [trips, setTrips] = useState(mockTrips);
  const [favorites] = useState(mockFavorites);
  

  // New trip form
  const [newTitle, setNewTitle] = useState("");
  const [newDates, setNewDates] = useState("");

  const activeTrip = trips.find((t) => t.active);

  const handleDeleteItem = (dayIdx: number, itemId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.active
          ? { ...t, days: t.days.map((d, i) => (i === dayIdx ? { ...d, items: d.items.filter((item) => item.id !== itemId) } : d)) }
          : t
      )
    );
  };

  const handleRefreshItem = (dayIdx: number, itemId: string) => {
    const replacements: Record<string, { name: string; description: string; price: string }> = {
      scenic: { name: "太子湾公园", description: "赏花胜地，春日必去", price: "免费" },
      food: { name: "弄堂里·杭帮菜", description: "地道杭帮菜，环境雅致", price: "人均¥95" },
      hotel: { name: "桂语山房酒店", description: "隐于山林，禅意体验", price: "¥528" },
    };
    setTrips((prev) =>
      prev.map((t) =>
        t.active
          ? {
              ...t,
              days: t.days.map((d, i) =>
                i === dayIdx
                  ? {
                      ...d,
                      items: d.items.map((item) =>
                        item.id === itemId
                          ? { ...item, ...replacements[item.type], id: Date.now().toString() }
                          : item
                      ),
                    }
                  : d
              ),
            }
          : t
      )
    );
    
  };

  const handleAddTrip = () => {
    if (!newTitle.trim()) return;
    const newTrip: Trip = {
      id: Date.now().toString(),
      title: newTitle,
      dates: newDates || "待定",
      active: false,
      favorited: false,
      days: [],
    };
    setTrips((prev) => [...prev, newTrip]);
    setNewTitle("");
    setNewDates("");
    setShowAddTrip(false);
  };

  const unbookedCount = activeTrip?.days.reduce((sum, d) => sum + d.items.filter((i) => i.status === "unbooked").length, 0) || 0;

  const handleBookAll = () => {
    setTrips((prev) =>
      prev.map((t) =>
        t.active
          ? {
              ...t,
              days: t.days.map((d) => ({
                ...d,
                items: d.items.map((item) =>
                  item.status === "unbooked"
                    ? { ...item, status: "pending" as Status, code: `MT${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 9000 + 1000)}` }
                    : item
                ),
              })),
            }
          : t
      )
    );
  };

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">{activeTrip?.title || "我的行程"}</h2>
          <p className="text-xs text-muted-foreground">{activeTrip?.dates || ""} · {activeTrip ? `${activeTrip.days.length}天${activeTrip.days.length - 1}夜` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFavorites(true)} className="p-2 rounded-lg bg-muted hover:bg-secondary transition-colors relative">
            <Heart className="w-4 h-4" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-meituan-red text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">{favorites.length}</span>
            )}
          </button>
          <button onClick={() => setShowAddTrip(true)} className="p-2 rounded-lg bg-muted hover:bg-secondary transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-muted rounded-xl p-1 mb-4">
        <button
          onClick={() => setViewMode("timeline")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "timeline" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          <List className="w-4 h-4" /> 时间轴
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "map" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          <MapIcon className="w-4 h-4" /> 地图路线
        </button>
      </div>

      {/* One-click Book All */}
      {activeTrip && unbookedCount > 0 && (
        <button
          onClick={handleBookAll}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-meituan-orange text-destructive-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity shadow-card"
        >
          <ShoppingCart className="w-4 h-4" />
          一键预定全部（{unbookedCount}项未预定）
        </button>
      )}

      {/* Progress */}
      {activeTrip && (
        <div className="bg-card rounded-xl border border-border p-3 mb-4 shadow-card">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">行程进度</span>
            <span className="font-medium">2/9 已完成</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "22%" }} className="h-full bg-meituan-green rounded-full" transition={{ duration: 0.8 }} />
          </div>
        </div>
      )}

      {viewMode === "timeline" && activeTrip ? (
        <div className="space-y-3">
          {activeTrip.days.map((day, dayIdx) => (
            <div key={day.day} className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
              <button
                onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">D{day.day}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{day.date} {day.period}</p>
                    <p className="text-xs text-muted-foreground">{day.items.length} 个行程点</p>
                  </div>
                </div>
                {expandedDay === day.day ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {expandedDay === day.day && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-3 space-y-2">
                      {day.items.map((item) => {
                        const Icon = typeIcon[item.type];
                        const StatusIcon = statusConfig[item.status].icon;
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`rounded-lg border-l-4 ${typeColor[item.type]} bg-muted/30 hover:bg-muted cursor-pointer transition-colors p-3`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{item.time}</span>
                                  <span className="font-medium text-sm truncate">{item.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusConfig[item.status].className}`}>
                                  <StatusIcon className="w-3 h-3" /> {statusConfig[item.status].label}
                                </span>
                                <span className="text-xs font-medium text-meituan-red">{item.price}</span>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRefreshItem(dayIdx, item.id); }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-meituan-blue/10 text-meituan-blue text-[11px] font-medium hover:bg-meituan-blue/20 transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" /> 换一个
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteItem(dayIdx, item.id); }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-meituan-red/10 text-meituan-red text-[11px] font-medium hover:bg-meituan-red/20 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> 删除
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : viewMode === "map" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          <div className="aspect-[4/3] bg-[hsl(210_20%_95%)] relative overflow-hidden">
            <div className="absolute top-[25%] left-[20%] w-[35%] h-[30%] rounded-[50%] bg-[hsl(200_60%_85%)] opacity-60" />
            <div className="absolute top-[30%] left-[25%] w-[25%] h-[20%] rounded-[50%] bg-[hsl(200_60%_80%)] opacity-50" />
            <p className="absolute top-[38%] left-[30%] text-[10px] text-[hsl(200_50%_55%)] font-medium">西湖</p>
            <div className="absolute top-[15%] left-[10%] w-[80%] h-[1px] bg-[hsl(0_0%_75%)]" />
            <div className="absolute top-[55%] left-[5%] w-[90%] h-[1px] bg-[hsl(0_0%_75%)]" />
            <div className="absolute top-[10%] left-[50%] w-[1px] h-[80%] bg-[hsl(0_0%_75%)]" />
            <div className="absolute top-[10%] left-[75%] w-[1px] h-[70%] bg-[hsl(0_0%_75%)]" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
              <polyline points="120,60 200,100 300,80 280,170 160,200 240,250" fill="none" stroke="hsl(43 100% 50%)" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
            </svg>
            <div className="absolute top-[18%] left-[28%] flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-meituan-blue flex items-center justify-center shadow-md border-2 border-card"><MapPin className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-[9px] mt-0.5 font-medium bg-card/80 px-1 rounded">西湖风景区</span>
            </div>
            <div className="absolute top-[30%] left-[72%] flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-meituan-blue flex items-center justify-center shadow-md border-2 border-card"><MapPin className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-[9px] mt-0.5 font-medium bg-card/80 px-1 rounded">灵隐寺</span>
            </div>
            <div className="absolute top-[22%] left-[48%] flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-meituan-blue flex items-center justify-center shadow-md border-2 border-card"><MapPin className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-[9px] mt-0.5 font-medium bg-card/80 px-1 rounded">龙井茶园</span>
            </div>
            <div className="absolute top-[55%] left-[65%] flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-meituan-orange flex items-center justify-center shadow-md border-2 border-card"><Utensils className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-[9px] mt-0.5 font-medium bg-card/80 px-1 rounded">楼外楼</span>
            </div>
            <div className="absolute top-[63%] left-[35%] flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-meituan-orange flex items-center justify-center shadow-md border-2 border-card"><Utensils className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-[9px] mt-0.5 font-medium bg-card/80 px-1 rounded">河坊街夜市</span>
            </div>
            <div className="absolute top-[78%] left-[55%] flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center shadow-md border-2 border-card"><Hotel className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-[9px] mt-0.5 font-medium bg-card/80 px-1 rounded">西湖亚朵酒店</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 py-2 border-t border-border">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-meituan-blue" /><span className="text-[10px] text-muted-foreground">景点</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-meituan-orange" /><span className="text-[10px] text-muted-foreground">美食</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-[10px] text-muted-foreground">酒店</span></div>
          </div>
        </div>
      ) : null}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.time} · {selectedItem.description}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${statusConfig[selectedItem.status].className}`}>
                  {statusConfig[selectedItem.status].label}
                </span>
              </div>
              <div className="bg-muted rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">价格</span>
                  <span className="font-bold text-meituan-red">{selectedItem.price}</span>
                </div>
                {selectedItem.code && (
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-1">核销码</p>
                    <p className="text-2xl font-mono font-bold tracking-wider text-center py-2">{selectedItem.code}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {selectedItem.status === "unbooked" && (
                  <button className="flex-1 py-2.5 bg-meituan-orange text-destructive-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
                    立即预定
                  </button>
                )}
                {selectedItem.status === "pending" && (
                  <>
                    <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-meituan-yellow-hover transition-colors">
                      {selectedItem.code ? "去核销" : "立即购买"}
                    </button>
                    <button className="px-4 py-2.5 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-secondary transition-colors">导航</button>
                  </>
                )}
                {selectedItem.status === "expired" && (
                  <button className="flex-1 py-2.5 bg-meituan-red text-destructive-foreground rounded-xl font-medium text-sm">申请退款</button>
                )}
                {selectedItem.status === "completed" && (
                  <div className="flex-1 py-2.5 bg-meituan-green/10 text-meituan-green rounded-xl font-medium text-sm text-center">✓ 核销成功</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites Drawer */}
      <AnimatePresence>
        {showFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end justify-center"
            onClick={() => setShowFavorites(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-t-2xl w-full max-w-[430px] max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-bold text-base">📌 收藏夹</h3>
                <button onClick={() => setShowFavorites(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-3">
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">暂无收藏的行程</p>
                ) : (
                  favorites.map((trip) => (
                    <div key={trip.id} className="p-4 rounded-xl bg-muted/50 border border-border">
                      <h4 className="font-medium text-sm">{trip.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{trip.dates}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-meituan-yellow-hover transition-colors">查看详情</button>
                        <button className="px-3 py-2 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-secondary transition-colors">取消收藏</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Trip Modal */}
      <AnimatePresence>
        {showAddTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end justify-center"
            onClick={() => setShowAddTrip(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-t-2xl w-full max-w-[430px]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-bold text-base">✈️ 新建行程</h3>
                <button onClick={() => setShowAddTrip(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">行程名称</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="例如：成都3日美食之旅"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">出行日期</label>
                  <input
                    value={newDates}
                    onChange={(e) => setNewDates(e.target.value)}
                    placeholder="例如：5月1日 - 5月3日"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={handleAddTrip}
                  disabled={!newTitle.trim()}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-meituan-yellow-hover transition-colors disabled:opacity-40"
                >
                  创建行程
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItineraryTab;
