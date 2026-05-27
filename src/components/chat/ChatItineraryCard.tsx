import { useState } from "react";
import { MapPin, Utensils, Hotel, ChevronDown, ChevronUp, RefreshCw, Trash2, Plus, CircleDot, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DayPlan, ItineraryItem, Status } from "@/types/itinerary";

const typeIcon = { scenic: MapPin, food: Utensils, hotel: Hotel };
const typeColor = { scenic: "border-l-meituan-blue", food: "border-l-meituan-orange", hotel: "border-l-purple-500" };
const statusConfig = {
  unbooked: { icon: CircleDot, label: "未预定", className: "bg-primary/10 text-primary" },
  pending: { icon: Clock, label: "待核销", className: "bg-muted text-muted-foreground" },
  completed: { icon: CheckCircle2, label: "已核销", className: "bg-meituan-green/10 text-meituan-green" },
  expired: { icon: AlertCircle, label: "已过期", className: "bg-meituan-red/10 text-meituan-red" },
};

interface Props {
  days: DayPlan[];
  onUpdate: (days: DayPlan[]) => void;
  onAddToTrip?: () => void;
}

const ChatItineraryCard = ({ days, onUpdate, onAddToTrip }: Props) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const handleDelete = (dayIdx: number, itemId: string) => {
    const updated = days.map((d, i) =>
      i === dayIdx ? { ...d, items: d.items.filter((item) => item.id !== itemId) } : d
    );
    onUpdate(updated);
  };

  const handleRefresh = (dayIdx: number, itemId: string) => {
    const replacements: Record<string, { name: string; description: string; price: string }> = {
      scenic: { name: "太子湾公园", description: "赏花胜地，春日必去", price: "免费" },
      food: { name: "弄堂里·杭帮菜", description: "地道杭帮菜，环境雅致", price: "人均¥95" },
      hotel: { name: "桂语山房酒店", description: "隐于山林，禅意体验", price: "¥528" },
    };
    const updated = days.map((d, i) =>
      i === dayIdx
        ? {
            ...d,
            items: d.items.map((item) =>
              item.id === itemId ? { ...item, ...replacements[item.type], id: Date.now().toString() } : item
            ),
          }
        : d
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-2 mt-2">
      {days.map((day, dayIdx) => (
        <div key={day.day} className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          <button
            onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">D{day.day}</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-xs">{day.date} {day.period}</p>
                <p className="text-[10px] text-muted-foreground">{day.items.length} 个行程点</p>
              </div>
            </div>
            {expandedDay === day.day ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {expandedDay === day.day && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-3 pb-2.5 space-y-1.5">
                  {day.items.map((item) => {
                    const Icon = typeIcon[item.type];
                    const StatusIcon = statusConfig[item.status].icon;
                    return (
                      <div key={item.id} className={`rounded-lg border-l-4 ${typeColor[item.type]} bg-muted/30 p-2.5`}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">{item.time}</span>
                              <span className="font-medium text-xs truncate">{item.name}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${statusConfig[item.status].className}`}>
                              <StatusIcon className="w-2.5 h-2.5" /> {statusConfig[item.status].label}
                            </span>
                            <span className="text-[10px] font-medium text-meituan-red">{item.price}</span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 mt-1.5">
                          <button
                            onClick={() => handleRefresh(dayIdx, item.id)}
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-meituan-blue/10 text-meituan-blue text-[10px] font-medium hover:bg-meituan-blue/20 transition-colors"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> 换一个
                          </button>
                          <button
                            onClick={() => handleDelete(dayIdx, item.id)}
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-meituan-red/10 text-meituan-red text-[10px] font-medium hover:bg-meituan-red/20 transition-colors"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> 删除
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
      {onAddToTrip && (
        <button
          onClick={onAddToTrip}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-xs hover:bg-meituan-yellow-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> 添加到我的行程
        </button>
      )}
    </div>
  );
};

export default ChatItineraryCard;
