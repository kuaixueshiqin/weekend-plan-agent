import { useState, useMemo } from "react";
import { Heart, MessageCircle, Bookmark, Star, Search } from "lucide-react";
import { motion } from "framer-motion";
import hangzhouImg from "@/assets/travel-hangzhou.jpg";
import dimsumImg from "@/assets/food-dimsum.jpg";
import hotelImg from "@/assets/hotel-room.jpg";
import nanjingImg from "@/assets/travel-nanjing.jpg";
import nightmarketImg from "@/assets/food-nightmarket.jpg";

interface GuideCard {
  id: string;
  image: string;
  title: string;
  author: string;
  avatar: string;
  likes: number;
  comments: number;
  tags: string[];
  liked: boolean;
  saved: boolean;
}

const mockGuides: GuideCard[] = [
  { id: "1", image: hangzhouImg, title: "杭州两天一夜保姆级攻略｜西湖+灵隐寺+龙井茶", author: "旅行小达人", avatar: "🧑‍🎨", likes: 2341, comments: 189, tags: ["杭州", "西湖"], liked: false, saved: false },
  { id: "2", image: dimsumImg, title: "杭州必吃TOP10美食｜本地人推荐的宝藏店铺", author: "美食探店家", avatar: "👨‍🍳", likes: 1892, comments: 256, tags: ["杭州美食", "本帮菜"], liked: false, saved: false },
  { id: "3", image: hotelImg, title: "西湖边高性价比酒店合集｜人均200住湖景房", author: "酒店测评师", avatar: "🏨", likes: 3102, comments: 341, tags: ["酒店推荐", "西湖"], liked: false, saved: false },
  { id: "4", image: nanjingImg, title: "南京三日游完整路线｜中山陵+夫子庙+总统府", author: "历史文化控", avatar: "📚", likes: 1567, comments: 123, tags: ["南京", "历史"], liked: false, saved: false },
  { id: "5", image: nightmarketImg, title: "上海夜市美食地图｜从城隍庙到南京路全攻略", author: "夜猫子吃货", avatar: "🌙", likes: 2789, comments: 198, tags: ["上海", "夜市"], liked: false, saved: false },
  { id: "6", image: hangzhouImg, title: "周末逃离计划｜杭州小众打卡地推荐", author: "探秘达人", avatar: "🗺️", likes: 987, comments: 76, tags: ["小众", "杭州"], liked: false, saved: false },
];

const filters = ["全部", "杭州", "南京", "上海", "北京", "成都", "重庆", "西安", "厦门"];

const GuidesTab = () => {
  const [guides, setGuides] = useState(mockGuides);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedGuide, setSelectedGuide] = useState<GuideCard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGuides = useMemo(() => {
    let result = guides;
    if (activeFilter !== "全部") {
      result = result.filter((g) => g.title.includes(activeFilter) || g.tags.some((t) => t.includes(activeFilter)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q)) || g.author.toLowerCase().includes(q));
    }
    return result;
  }, [guides, activeFilter, searchQuery]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGuides((prev) =>
      prev.map((g) => (g.id === id ? { ...g, liked: !g.liked, likes: g.liked ? g.likes - 1 : g.likes + 1 } : g))
    );
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGuides((prev) =>
      prev.map((g) => (g.id === id ? { ...g, saved: !g.saved } : g))
    );
  };

  return (
    <div className="px-4 py-4">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索攻略、目的地、美食..."
          className="w-full h-9 pl-9 pr-3 rounded-full bg-muted text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {/* City Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div className="columns-2 gap-3 space-y-3">
        {filteredGuides.length === 0 && (
          <div className="col-span-2 text-center text-muted-foreground text-sm py-8">没有找到相关攻略</div>
        )}
        {filteredGuides.map((guide, idx) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="break-inside-avoid bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all cursor-pointer group border border-border"
            onClick={() => setSelectedGuide(guide)}
          >
            <div className="relative overflow-hidden">
              <img
                src={guide.image}
                alt={guide.title}
                className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <button
                onClick={(e) => toggleSave(guide.id, e)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center"
              >
                <Bookmark className={`w-4 h-4 ${guide.saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-2">{guide.title}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{guide.avatar}</span>
                  <span className="text-xs text-muted-foreground">{guide.author}</span>
                </div>
                <button onClick={(e) => toggleLike(guide.id, e)} className="flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${guide.liked ? "fill-meituan-red text-meituan-red" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{guide.likes}</span>
                </button>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {guide.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">#{tag}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedGuide(null)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <img src={selectedGuide.image} alt={selectedGuide.title} className="w-full aspect-video object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-bold mb-2">{selectedGuide.title}</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{selectedGuide.avatar}</span>
                <span className="text-sm font-medium">{selectedGuide.author}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                这是一篇精心准备的旅行攻略，包含了详细的路线规划、美食推荐和住宿建议。
                所有提到的景点和餐厅都可以在美团上直接预订，享受团购优惠！
              </p>
              <div className="bg-accent rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">相关美团资源</span>
                </div>
                <div className="space-y-2">
                  {["西湖风景区门票 ¥0起", "楼外楼双人套餐 ¥198", "西湖亚朵酒店 ¥458/晚"].map((r) => (
                    <div key={r} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 text-sm">
                      <span>{r}</span>
                      <button className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">抢购</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 border-t border-border pt-3">
                <button onClick={(e) => { toggleLike(selectedGuide.id, e); setSelectedGuide({ ...selectedGuide, liked: !selectedGuide.liked, likes: selectedGuide.liked ? selectedGuide.likes - 1 : selectedGuide.likes + 1 }); }}
                  className="flex items-center gap-1.5 text-sm">
                  <Heart className={`w-5 h-5 ${selectedGuide.liked ? "fill-meituan-red text-meituan-red" : "text-muted-foreground"}`} />
                  {selectedGuide.likes}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageCircle className="w-5 h-5" /> {selectedGuide.comments}
                </button>
                <button onClick={(e) => { toggleSave(selectedGuide.id, e); setSelectedGuide({ ...selectedGuide, saved: !selectedGuide.saved }); }}
                  className="flex items-center gap-1.5 text-sm ml-auto">
                  <Bookmark className={`w-5 h-5 ${selectedGuide.saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  收藏
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default GuidesTab;
