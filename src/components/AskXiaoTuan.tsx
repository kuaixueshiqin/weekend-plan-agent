import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, SlidersHorizontal, X, Calendar, Map as MapIcon, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import mascotImg from "@/assets/xiaotuan-mascot.png";
import QuickFillTemplate from "@/components/QuickFillTemplate";
import ChatItineraryCard from "@/components/chat/ChatItineraryCard";
import ChatRouteMap, { type MapPoint } from "@/components/chat/ChatRouteMap";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DayPlan } from "@/types/itinerary";

type ChatViewMode = "list" | "map";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  itinerary?: DayPlan[];
  routePoints?: MapPoint[];
  nearbyPoints?: MapPoint[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Parse AI markdown response into structured itinerary
function parseItinerary(text: string): { days: DayPlan[]; routePoints: MapPoint[]; nearbyPoints: MapPoint[] } | null {
  const dayRegex = /(?:第(\d+)天|Day\s*(\d+))/gi;
  const matches = [...text.matchAll(dayRegex)];
  if (matches.length === 0) return null;

  const days: DayPlan[] = [];
  const routePoints: MapPoint[] = [];
  // Approximate positions for map
  const positions = [
    { x: 30, y: 20 }, { x: 50, y: 30 }, { x: 25, y: 45 },
    { x: 60, y: 55 }, { x: 40, y: 70 }, { x: 70, y: 25 },
    { x: 35, y: 60 }, { x: 55, y: 45 }, { x: 20, y: 35 },
  ];

  for (let i = 0; i < matches.length; i++) {
    const dayNum = parseInt(matches[i][1] || matches[i][2]);
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const section = text.slice(start, end);

    const items: DayPlan["items"] = [];
    // Match time-name patterns like "09:00 西湖" or "- 09:00 西湖风景区"
    const itemRegex = /(\d{1,2}[:：]\d{2})\s*[-–]?\s*\*{0,2}([^*\n（(]+)/g;
    let itemMatch;
    let itemIdx = 0;
    while ((itemMatch = itemRegex.exec(section)) !== null) {
      const time = itemMatch[1].replace("：", ":");
      const name = itemMatch[2].trim().replace(/\*+/g, "");
      const type = name.includes("酒店") || name.includes("民宿") || name.includes("客栈")
        ? "hotel" as const
        : name.includes("餐") || name.includes("小吃") || name.includes("美食") || name.includes("夜市") || name.includes("楼") || name.includes("观") || name.includes("家")
        ? "food" as const
        : "scenic" as const;

      const id = `ai-${dayNum}-${itemIdx}`;
      items.push({
        id,
        time,
        name: name.slice(0, 20),
        type,
        description: "AI推荐",
        price: "查看详情",
        status: "unbooked",
      });

      const posIdx = (routePoints.length) % positions.length;
      routePoints.push({
        id,
        name: name.slice(0, 10),
        type,
        x: positions[posIdx].x,
        y: positions[posIdx].y,
        inRoute: true,
        description: "AI推荐",
        price: "查看详情",
      });
      itemIdx++;
    }

    if (items.length > 0) {
      days.push({ day: dayNum, date: `第${dayNum}天`, period: "", items });
    }
  }

  const nearbyPoints: MapPoint[] = [
    { id: "nb1", name: "雷峰塔", type: "scenic", x: 38, y: 48, inRoute: false, description: "西湖十景", price: "¥40" },
    { id: "nb2", name: "苏堤春晓", type: "scenic", x: 28, y: 38, inRoute: false, description: "湖边漫步", price: "免费" },
    { id: "nb3", name: "外婆家", type: "food", x: 72, y: 50, inRoute: false, description: "杭帮菜", price: "人均¥75" },
  ];

  return days.length > 0 ? { days, routePoints, nearbyPoints } : null;
}

const AskXiaoTuan = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [viewMode, setViewMode] = useState<ChatViewMode>("list");
  const [travelDate, setTravelDate] = useState<Date | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "杭州2天1夜，想吃本帮菜，住西湖附近",
    "上海周末游，预算1000，带女朋友",
    "成都3日美食之旅，不辣的也要有",
    "北京故宫+长城2日经典路线",
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    let msg = text || input.trim();
    if (!msg || isTyping) return;

    // Append date if selected
    if (travelDate) {
      msg += `，出发日期：${format(travelDate, "yyyy年M月d日")}`;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to connect to AI");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // After streaming done, try to parse itinerary
      const parsed = parseItinerary(assistantContent);
      if (parsed) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1
                ? { ...m, itinerary: parsed.days, routePoints: parsed.routePoints, nearbyPoints: parsed.nearbyPoints }
                : m
            );
          }
          return prev;
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "抱歉，AI暂时无法响应，请稍后再试 😅" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTemplateSubmit = (text: string) => {
    setShowTemplate(false);
    handleSend(text);
  };

  const handleUpdateItinerary = (msgId: string, days: DayPlan[]) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, itinerary: days } : m)));
  };

  const handleUpdateRoute = (msgId: string, points: MapPoint[]) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, routePoints: points } : m)));
  };

  const handleAddToRoute = (msgId: string, point: MapPoint) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const newRoute = [...(m.routePoints || []), { ...point, inRoute: true }];
        const newNearby = (m.nearbyPoints || []).filter((p) => p.id !== point.id);
        return { ...m, routePoints: newRoute, nearbyPoints: newNearby };
      })
    );
  };

  const handleRemoveFromRoute = (msgId: string, pointId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const removed = (m.routePoints || []).find((p) => p.id === pointId);
        const newRoute = (m.routePoints || []).filter((p) => p.id !== pointId);
        const newNearby = removed ? [...(m.nearbyPoints || []), { ...removed, inRoute: false }] : m.nearbyPoints || [];
        return { ...m, routePoints: newRoute, nearbyPoints: newNearby };
      })
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-12">
            <img src={mascotImg} alt="小团" className="w-24 h-24 mb-4" />
            <h2 className="text-xl font-bold mb-2">你好，我是小团 👋</h2>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">告诉我你的旅行需求，我帮你智能规划行程！</p>

            <button
              onClick={() => setShowTemplate(true)}
              className="flex items-center gap-2 px-4 py-2.5 mb-6 bg-accent text-accent-foreground rounded-full text-sm font-medium border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              快捷填写旅行需求
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-card transition-all text-left text-sm"
                >
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[90%] sm:max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-start gap-2">
                    <img src={mascotImg} alt="小团" className="w-8 h-8 rounded-full shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="bg-card rounded-2xl rounded-bl-md px-4 py-2.5 shadow-card border border-border prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* View mode toggle for itinerary messages */}
                      {msg.itinerary && msg.itinerary.length > 0 && (
                        <div className="mt-2">
                          <div className="flex bg-muted rounded-lg p-0.5 mb-2">
                            <button
                              onClick={() => setViewMode("list")}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                            >
                              <List className="w-3 h-3" /> 行程表
                            </button>
                            <button
                              onClick={() => setViewMode("map")}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "map" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                            >
                              <MapIcon className="w-3 h-3" /> 地图路线
                            </button>
                          </div>

                          {viewMode === "list" ? (
                            <ChatItineraryCard
                              days={msg.itinerary}
                              onUpdate={(days) => handleUpdateItinerary(msg.id, days)}
                              onAddToTrip={() => {}}
                            />
                          ) : (
                            <ChatRouteMap
                              routePoints={msg.routePoints || []}
                              nearbyPoints={msg.nearbyPoints || []}
                              onUpdateRoute={(points) => handleUpdateRoute(msg.id, points)}
                              onAddToRoute={(point) => handleAddToRoute(msg.id, point)}
                              onRemoveFromRoute={(pointId) => handleRemoveFromRoute(msg.id, pointId)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {msg.role === "user" && <p className="text-sm">{msg.content}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && !messages.some((m) => m.role === "assistant" && m.content === "") && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 mb-4">
            <img src={mascotImg} alt="小团" className="w-8 h-8 rounded-full shrink-0" />
            <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3 shadow-card border border-border flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card px-4 py-3">
        {/* Date chip */}
        {travelDate && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
              <Calendar className="w-3 h-3" />
              {format(travelDate, "M月d日")}
              <button onClick={() => setTravelDate(undefined)} className="ml-0.5 hover:text-primary/70"><X className="w-3 h-3" /></button>
            </span>
          </div>
        )}
        <div className="max-w-screen-lg mx-auto flex items-end gap-2">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="shrink-0 w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-secondary transition-colors">
                <Calendar className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarWidget
                mode="single"
                selected={travelDate}
                onSelect={setTravelDate}
                disabled={(date) => date < new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Template button */}
          <button
            onClick={() => setShowTemplate(true)}
            className="shrink-0 w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="输入旅行需求，小团帮你规划..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-meituan-yellow-hover transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Fill Template Modal */}
      <AnimatePresence>
        {showTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end justify-center"
            onClick={() => setShowTemplate(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-t-2xl w-full max-w-[430px] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-bold text-base">快捷填写旅行需求</h3>
                <button onClick={() => setShowTemplate(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <QuickFillTemplate onSubmit={handleTemplateSubmit} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AskXiaoTuan;
