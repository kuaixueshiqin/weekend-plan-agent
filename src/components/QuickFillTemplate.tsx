import { useState } from "react";
import { MapPin, Users, Calendar, Wallet, Zap, Mountain, Landmark } from "lucide-react";

interface QuickFillTemplateProps {
  onSubmit: (text: string) => void;
}

const destinations = ["杭州", "上海", "北京", "成都", "重庆", "西安", "南京", "厦门", "大理", "三亚"];
const styles = [
  { label: "紧凑充实", icon: Zap, value: "紧凑充实" },
  { label: "自由休闲", icon: Mountain, value: "自由休闲" },
];
const preferences = [
  { label: "人文古迹", value: "人文古迹" },
  { label: "自然景观", value: "自然景观" },
  { label: "美食探店", value: "美食探店" },
  { label: "网红打卡", value: "网红打卡" },
  { label: "亲子乐园", value: "亲子乐园" },
  { label: "浪漫约会", value: "浪漫约会" },
];

const QuickFillTemplate = ({ onSubmit }: QuickFillTemplateProps) => {
  const [destination, setDestination] = useState("");
  const [customDest, setCustomDest] = useState("");
  const [days, setDays] = useState(2);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState("1000-2000");
  const [style, setStyle] = useState("自由休闲");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(["自然景观"]);

  const togglePref = (p: string) => {
    setSelectedPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmit = () => {
    const dest = destination || customDest || "推荐目的地";
    const prefsStr = selectedPrefs.length > 0 ? selectedPrefs.join("、") : "不限";
    const text = `${dest}${days}天${days - 1 > 0 ? days - 1 : 0}晚，${people}人出行，预算${budget}元，风格偏好${style}，喜欢${prefsStr}`;
    onSubmit(text);
  };

  return (
    <div className="px-5 py-4 space-y-5">
      {/* Destination */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
          <MapPin className="w-4 h-4 text-meituan-blue" /> 目的地
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {destinations.map((d) => (
            <button
              key={d}
              onClick={() => { setDestination(d); setCustomDest(""); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                destination === d ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          value={customDest}
          onChange={(e) => { setCustomDest(e.target.value); setDestination(""); }}
          placeholder="或输入其他目的地..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Days & People */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
            <Calendar className="w-4 h-4 text-meituan-orange" /> 天数
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => setDays(Math.max(1, days - 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg font-medium">-</button>
            <span className="text-lg font-bold w-8 text-center">{days}</span>
            <button onClick={() => setDays(Math.min(14, days + 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg font-medium">+</button>
            <span className="text-xs text-muted-foreground">天</span>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
            <Users className="w-4 h-4 text-purple-500" /> 人数
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => setPeople(Math.max(1, people - 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg font-medium">-</button>
            <span className="text-lg font-bold w-8 text-center">{people}</span>
            <button onClick={() => setPeople(Math.min(20, people + 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg font-medium">+</button>
            <span className="text-xs text-muted-foreground">人</span>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
          <Wallet className="w-4 h-4 text-meituan-red" /> 预算（元/人）
        </label>
        <div className="flex flex-wrap gap-2">
          {["500以内", "500-1000", "1000-2000", "2000-5000", "5000以上"].map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                budget === b ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary"
              }`}
            >
              ¥{b}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
          <Zap className="w-4 h-4 text-meituan-orange" /> 行程风格
        </label>
        <div className="flex gap-3">
          {styles.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                  style === s.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
          <Landmark className="w-4 h-4 text-meituan-blue" /> 偏好（可多选）
        </label>
        <div className="flex flex-wrap gap-2">
          {preferences.map((p) => (
            <button
              key={p.value}
              onClick={() => togglePref(p.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedPrefs.includes(p.value) ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-meituan-yellow-hover transition-colors"
      >
        🚀 生成行程规划
      </button>
    </div>
  );
};

export default QuickFillTemplate;
