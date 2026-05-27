import { MapPin, Ticket, Heart, Settings, ChevronRight, Trophy, Compass, Star } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "去过的城市", value: "12", icon: MapPin },
  { label: "打卡景点", value: "38", icon: Compass },
  { label: "旅行天数", value: "56", icon: Trophy },
];

const cities = [
  { name: "杭州", visits: 3, spots: 8, foods: 12, emoji: "🏯" },
  { name: "上海", visits: 5, spots: 6, foods: 15, emoji: "🌃" },
  { name: "成都", visits: 2, spots: 5, foods: 20, emoji: "🐼" },
  { name: "北京", visits: 4, spots: 10, foods: 8, emoji: "🏰" },
];

const orders = [
  { name: "灵隐寺门票", status: "待核销", price: "¥75", color: "text-meituan-orange" },
  { name: "楼外楼双人套餐", status: "已核销", price: "¥198", color: "text-meituan-green" },
  { name: "宋城千古情", status: "待核销", price: "¥280", color: "text-meituan-orange" },
];

const menuItems = [
  { label: "收藏的攻略", icon: Heart, count: 23 },
  { label: "我的订单", icon: Ticket, count: 8 },
  { label: "行程提醒设置", icon: Settings },
];

const ProfileTab = () => {
  return (
    <div className="px-4 py-4 pb-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 shadow-card mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-3xl">
            🧳
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">旅行达人小明</h2>
            <p className="text-sm text-muted-foreground">已绑定美团账号</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium hover:bg-secondary transition-colors">
            编辑
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card rounded-xl border border-border p-3 text-center shadow-card"
          >
            <stat.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* City Footprints */}
      <div className="mb-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> 城市足迹
        </h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {cities.map((city) => (
            <div key={city.name} className="min-w-[140px] bg-card rounded-xl border border-border p-3 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="text-2xl mb-1">{city.emoji}</div>
              <p className="font-medium text-sm">{city.name}</p>
              <p className="text-xs text-muted-foreground">去过{city.visits}次 · {city.spots}景点</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mb-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" /> 最近订单
        </h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
          {orders.map((order, idx) => (
            <div key={idx} className={`flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${idx < orders.length - 1 ? "border-b border-border" : ""}`}>
              <div>
                <p className="text-sm font-medium">{order.name}</p>
                <p className={`text-xs ${order.color}`}>{order.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{order.price}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Travel Report */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-meituan-orange rounded-xl p-4 mb-4 cursor-pointer hover:shadow-card-hover transition-shadow"
      >
        <div className="flex items-center gap-3">
          <Star className="w-8 h-8 text-primary-foreground" />
          <div>
            <p className="font-bold text-primary-foreground">生成我的旅行报告</p>
            <p className="text-xs text-primary-foreground/80">查看你的年度旅行足迹与偏好分析</p>
          </div>
          <ChevronRight className="w-5 h-5 text-primary-foreground ml-auto" />
        </div>
      </motion.div>

      {/* Menu */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
        {menuItems.map((item, idx) => (
          <div key={item.label} className={`flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 cursor-pointer transition-colors ${idx < menuItems.length - 1 ? "border-b border-border" : ""}`}>
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.count && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{item.count}</span>}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;
