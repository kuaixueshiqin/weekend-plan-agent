import { useState } from "react";
import { motion } from "framer-motion";
import TabNavigation, { type TabId } from "@/components/TabNavigation";
import AskXiaoTuan from "@/components/AskXiaoTuan";
import GuidesTab from "@/components/GuidesTab";
import ItineraryTab from "@/components/ItineraryTab";
import ProfileTab from "@/components/ProfileTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("ask");
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-background flex justify-center overflow-hidden">
      {/* ── 整个 430px 核心容器整体右移，fixed 子元素会跟随 transform ── */}
      <motion.div
        className="w-full max-w-[430px] min-h-screen bg-background relative shadow-xl"
        animate={{ x: showSidebar ? "min(320px, 78vw)" : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <main className="pb-28 overflow-y-auto scrollbar-hide" style={{ height: "100vh" }}>
          {activeTab === "ask" && (
            <AskXiaoTuan showSidebar={showSidebar} onSidebarChange={setShowSidebar} />
          )}
          {activeTab === "guides" && <GuidesTab />}
          {activeTab === "itinerary" && <ItineraryTab />}
          {activeTab === "profile" && <ProfileTab />}
        </main>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </motion.div>
    </div>
  );
};

export default Index;
