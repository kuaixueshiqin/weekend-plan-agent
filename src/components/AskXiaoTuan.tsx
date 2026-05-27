import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, SlidersHorizontal, X, Calendar, Map as MapIcon, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import mascotImg from "@/assets/xiaotuan-mascot.png";
import QuickFillTemplate from "@/components/QuickFillTemplate";
import ChatItineraryCard from "@/components/chat/ChatItineraryCard";
import ChatRouteMap, { type MapPoint } from "@/components/chat/ChatRouteMap";
import ArticleCard from "@/components/chat/ArticleCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DayPlan } from "@/types/itinerary";

type ChatViewMode = "list" | "map";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;       // true while SSE is still in flight
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
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent, streaming: true } : m));
                }
                return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: assistantContent, streaming: true }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // After streaming done: mark streaming=false, then parse itinerary
      const parsed = parseItinerary(assistantContent);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? {
                  ...m,
                  streaming: false,
                  ...(parsed
                    ? { itinerary: parsed.days, routePoints: parsed.routePoints, nearbyPoints: parsed.nearbyPoints }
                    : {}),
                }
              : m
          );
        }
        return prev;
      });
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
    <div className="flex flex-col h-full bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center px-5 pt-14 pb-6"
          >
            {/* Hero mascot area */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
              className="relative mb-5"
            >
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/30 to-meituan-orange/20 flex items-center justify-center shadow-lg">
                <img src={mascotImg} alt="小团" className="w-14 h-14 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-meituan-green rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">AI</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <h2 className="text-[22px] font-bold mb-1.5 tracking-tight">
                你好，我是<span className="text-gradient-warm">小团</span> 👋
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px] mx-auto">
                告诉我你的旅行需求，我来帮你规划一份专属攻略
              </p>
            </motion.div>

            {/* Quick fill button */}
            <motion.button
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              onClick={() => setShowTemplate(true)}
              className="flex items-center gap-2 px-5 py-2.5 mb-6 rounded-full text-sm font-semibold border-2 border-primary/30 bg-primary/8 text-amber-700 hover:bg-primary/15 hover:border-primary/50 transition-all"
              style={{ background: "hsl(43 100% 50% / 0.08)" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              快捷填写旅行需求
            </motion.button>

            {/* Suggestion chips */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-2.5"
            >
              <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" /> 热门出发
              </p>
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.22 + i * 0.06 }}
                  onClick={() => handleSend(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card-hover transition-all text-left group"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-[13.5px] font-medium text-foreground/85 leading-snug">{s}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}

        <div className="px-4 pt-3 pb-2">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div
                    className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm font-medium leading-relaxed"
                    style={{
                      background: "linear-gradient(135deg, hsl(43 100% 50%), hsl(33 95% 52%))",
                      color: "hsl(30 20% 10%)",
                      boxShadow: "0 2px 12px hsl(43 100% 50% / 0.3)",
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-[92%]">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary/25 to-meituan-orange/15 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                      <img src={mascotImg} alt="小团" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {!msg.streaming && /^\s*#\s/.test(msg.content) ? (
                        <ArticleCard content={msg.content} onSuggestionClick={(text) => handleSend(text)} />
                      ) : (
                        <div
                          className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed border border-border/70 prose prose-sm max-w-none"
                          style={{ boxShadow: "var(--shadow-card)" }}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {/* View mode toggle */}
                      {msg.itinerary && msg.itinerary.length > 0 && (
                        <div className="mt-2">
                          <div className="flex bg-muted rounded-xl p-0.5 mb-2 border border-border/50">
                            <button
                              onClick={() => setViewMode("list")}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <List className="w-3 h-3" /> 行程表
                            </button>
                            <button
                              onClick={() => setViewMode("map")}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === "map" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <MapIcon className="w-3 h-3" /> 地图路线
                            </button>
                          </div>
                          {viewMode === "list" ? (
                            <ChatItineraryCard days={msg.itinerary} onUpdate={(days) => handleUpdateItinerary(msg.id, days)} onAddToTrip={() => {}} />
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
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 mb-3"
            >
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary/25 to-meituan-orange/15 flex items-center justify-center shrink-0 border border-primary/20">
                <img src={mascotImg} alt="小团" className="w-5 h-5 object-contain" />
              </div>
              <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 border border-border/70 flex items-center gap-1.5" style={{ boxShadow: "var(--shadow-card)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse-dot [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-pulse-dot [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
          {/* bottom padding so last message isn't hidden behind input bar */}
          <div className="h-2" />
        </div>
      </div>

      {/* ── Input bar ───────────────────────────────────────────────── */}
      <div
        className="border-t border-border/60 px-3 py-2.5"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Date chip */}
        <AnimatePresence>
          {travelDate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5 mb-2 pt-0.5">
                <span className="flex items-center gap-1.5 bg-primary/10 text-amber-700 text-xs px-3 py-1 rounded-full font-semibold border border-primary/20">
                  <Calendar className="w-3 h-3" />
                  {format(travelDate, "M月d日出发")}
                  <button onClick={() => setTravelDate(undefined)} className="ml-0.5 hover:opacity-60 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${travelDate ? "bg-primary/15 text-amber-700" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
                <Calendar className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
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
            className="shrink-0 w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <SlidersHorizontal style={{ width: 17, height: 17 }} />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="告诉小团你想去哪儿..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border/80 bg-muted/70 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/60 transition-all"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
          </div>

          {/* Send */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-35"
            style={{
              background: input.trim() && !isTyping
                ? "linear-gradient(135deg, hsl(43 100% 50%), hsl(33 95% 52%))"
                : "hsl(var(--muted))",
              boxShadow: input.trim() && !isTyping ? "0 2px 8px hsl(43 100% 50% / 0.35)" : "none",
            }}
          >
            <Send style={{ width: 16, height: 16, color: input.trim() && !isTyping ? "hsl(30 20% 10%)" : "hsl(var(--muted-foreground))" }} />
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
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowTemplate(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-t-3xl w-full max-w-[430px] max-h-[82vh] overflow-y-auto"
              style={{ boxShadow: "var(--shadow-modal)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <h3 className="font-bold text-base">快捷填写旅行需求</h3>
                </div>
                <button onClick={() => setShowTemplate(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
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
