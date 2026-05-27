import { useState, useRef } from "react";
import { MapPin, Utensils, Hotel, Plus, X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ItineraryItem } from "@/types/itinerary";

interface MapPoint {
  id: string;
  name: string;
  type: "scenic" | "food" | "hotel";
  x: number; // percentage
  y: number;
  inRoute: boolean;
  description?: string;
  price?: string;
}

interface Props {
  routePoints: MapPoint[];
  nearbyPoints: MapPoint[];
  onUpdateRoute: (points: MapPoint[]) => void;
  onAddToRoute: (point: MapPoint) => void;
  onRemoveFromRoute: (pointId: string) => void;
}

const typeIcon = { scenic: MapPin, food: Utensils, hotel: Hotel };
const typeColor = {
  scenic: "bg-meituan-blue",
  food: "bg-meituan-orange",
  hotel: "bg-purple-500",
};

// Default Hangzhou route data
const defaultRoutePoints: MapPoint[] = [
  { id: "r1", name: "西湖风景区", type: "scenic", x: 30, y: 25, inRoute: true, description: "漫步苏堤", price: "免费" },
  { id: "r2", name: "楼外楼", type: "food", x: 48, y: 35, inRoute: true, description: "西湖醋鱼", price: "¥198" },
  { id: "r3", name: "灵隐寺", type: "scenic", x: 22, y: 18, inRoute: true, description: "千年古刹", price: "¥75" },
  { id: "r4", name: "河坊街夜市", type: "food", x: 58, y: 60, inRoute: true, description: "地道小吃", price: "人均¥50" },
  { id: "r5", name: "西湖亚朵酒店", type: "hotel", x: 42, y: 72, inRoute: true, description: "含双早", price: "¥458" },
];

const defaultNearbyPoints: MapPoint[] = [
  { id: "n1", name: "雷峰塔", type: "scenic", x: 38, y: 48, inRoute: false, description: "西湖十景之一", price: "¥40" },
  { id: "n2", name: "龙井茶园", type: "scenic", x: 15, y: 45, inRoute: false, description: "采茶体验", price: "¥120" },
  { id: "n3", name: "知味观", type: "food", x: 65, y: 28, inRoute: false, description: "小笼包", price: "人均¥85" },
  { id: "n4", name: "苏堤春晓", type: "scenic", x: 28, y: 38, inRoute: false, description: "西湖苏堤", price: "免费" },
  { id: "n5", name: "断桥残雪", type: "scenic", x: 45, y: 15, inRoute: false, description: "白娘子传说", price: "免费" },
  { id: "n6", name: "外婆家", type: "food", x: 72, y: 50, inRoute: false, description: "杭帮菜", price: "人均¥75" },
];

const ChatRouteMap = ({
  routePoints: propRoutePoints,
  nearbyPoints: propNearbyPoints,
  onUpdateRoute,
  onAddToRoute,
  onRemoveFromRoute,
}: Props) => {
  const routePoints = propRoutePoints.length > 0 ? propRoutePoints : defaultRoutePoints;
  const nearbyPoints = propNearbyPoints.length > 0 ? propNearbyPoints : defaultNearbyPoints;

  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const routePolyline = routePoints.map((p) => `${(p.x / 100) * 400},${(p.y / 100) * 300}`).join(" ");

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const updated = [...routePoints];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, moved);
    onUpdateRoute(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Map area */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
        <div className="aspect-[4/3] bg-[hsl(210_20%_95%)] relative overflow-hidden">
          {/* Water bodies */}
          <div className="absolute top-[25%] left-[20%] w-[35%] h-[30%] rounded-[50%] bg-[hsl(200_60%_85%)] opacity-60" />
          <div className="absolute top-[30%] left-[25%] w-[25%] h-[20%] rounded-[50%] bg-[hsl(200_60%_80%)] opacity-50" />
          <p className="absolute top-[38%] left-[30%] text-[10px] text-[hsl(200_50%_55%)] font-medium">西湖</p>

          {/* Grid lines */}
          <div className="absolute top-[15%] left-[10%] w-[80%] h-[1px] bg-[hsl(0_0%_75%)]" />
          <div className="absolute top-[55%] left-[5%] w-[90%] h-[1px] bg-[hsl(0_0%_75%)]" />
          <div className="absolute top-[10%] left-[50%] w-[1px] h-[80%] bg-[hsl(0_0%_75%)]" />
          <div className="absolute top-[10%] left-[75%] w-[1px] h-[70%] bg-[hsl(0_0%_75%)]" />

          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
            <polyline
              points={routePolyline}
              fill="none"
              stroke="hsl(43 100% 50%)"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.8"
            />
            {/* Direction arrows */}
            {routePoints.slice(0, -1).map((p, i) => {
              const next = routePoints[i + 1];
              const mx = ((p.x + next.x) / 2 / 100) * 400;
              const my = ((p.y + next.y) / 2 / 100) * 300;
              return (
                <circle key={`arrow-${i}`} cx={mx} cy={my} r="3" fill="hsl(43 100% 50%)" opacity="0.6" />
              );
            })}
          </svg>

          {/* Route points */}
          {routePoints.map((point, idx) => {
            const Icon = typeIcon[point.type];
            return (
              <div
                key={point.id}
                className="absolute flex flex-col items-center cursor-pointer group"
                style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => setSelectedPoint(point)}
              >
                <div className="relative">
                  <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full bg-primary/20 animate-pulse group-hover:bg-primary/30" />
                  <div className={`w-7 h-7 rounded-full ${typeColor[point.type]} flex items-center justify-center shadow-md border-2 border-card relative z-10`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center z-20">
                    {idx + 1}
                  </span>
                </div>
                <span className="text-[9px] mt-0.5 font-medium bg-card/90 px-1.5 rounded shadow-sm whitespace-nowrap">{point.name}</span>
              </div>
            );
          })}

          {/* Nearby points (not in route) */}
          {nearbyPoints.map((point) => {
            const Icon = typeIcon[point.type];
            return (
              <div
                key={point.id}
                className="absolute flex flex-col items-center cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => setSelectedPoint(point)}
              >
                <div className={`w-5 h-5 rounded-full ${typeColor[point.type]} flex items-center justify-center shadow-sm border border-card/50`}>
                  <Icon className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-[8px] mt-0.5 text-muted-foreground bg-card/70 px-1 rounded whitespace-nowrap">{point.name}</span>
              </div>
            );
          })}

          {/* Hint */}
          <div className="absolute bottom-2 left-2 bg-card/90 rounded-lg px-2 py-1 shadow-sm">
            <p className="text-[9px] text-muted-foreground">💡 点击景点添加/移除 · 拖拽列表调整顺序</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 py-2 border-t border-border">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-meituan-blue" /><span className="text-[10px] text-muted-foreground">景点</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-meituan-orange" /><span className="text-[10px] text-muted-foreground">美食</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-[10px] text-muted-foreground">酒店</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-0 border-t-2 border-dashed border-primary" /><span className="text-[10px] text-muted-foreground">路线</span></div>
        </div>
      </div>

      {/* Draggable route list */}
      <div className="bg-card rounded-xl border border-border shadow-card p-3">
        <h4 className="text-xs font-bold mb-2 text-muted-foreground">📍 路线顺序（拖拽调整）</h4>
        <div className="space-y-1">
          {routePoints.map((point, idx) => {
            const Icon = typeIcon[point.type];
            return (
              <div
                key={point.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${
                  dragOverIdx === idx ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted"
                } ${draggedIdx === idx ? "opacity-50" : ""}`}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium flex-1 truncate">{point.name}</span>
                <span className="text-[10px] text-meituan-red shrink-0">{point.price}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFromRoute(point.id); }}
                  className="p-0.5 rounded hover:bg-meituan-red/10 text-muted-foreground hover:text-meituan-red transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Point detail popup */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card rounded-xl border border-border shadow-card p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {(() => { const Icon = typeIcon[selectedPoint.type]; return <div className={`w-8 h-8 rounded-lg ${typeColor[selectedPoint.type]} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>; })()}
                <div>
                  <h4 className="text-sm font-bold">{selectedPoint.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{selectedPoint.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPoint(null)} className="p-1 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-meituan-red font-medium">{selectedPoint.price}</span>
              {selectedPoint.inRoute ? (
                <button
                  onClick={() => { onRemoveFromRoute(selectedPoint.id); setSelectedPoint(null); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-meituan-red/10 text-meituan-red text-xs font-medium hover:bg-meituan-red/20 transition-colors"
                >
                  <X className="w-3 h-3" /> 从路线移除
                </button>
              ) : (
                <button
                  onClick={() => { onAddToRoute(selectedPoint); setSelectedPoint(null); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-meituan-yellow-hover transition-colors"
                >
                  <Plus className="w-3 h-3" /> 添加到路线
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatRouteMap;
export type { MapPoint };
