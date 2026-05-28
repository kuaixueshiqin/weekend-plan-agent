import { useState } from "react";
import TabNavigation, { type TabId } from "@/components/TabNavigation";
import AskXiaoTuan from "@/components/AskXiaoTuan";
import GuidesTab from "@/components/GuidesTab";
import ItineraryTab from "@/components/ItineraryTab";
import ProfileTab from "@/components/ProfileTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("ask");

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative shadow-xl">
        <main className="pb-28 overflow-y-auto" style={{ height: "100vh" }}>
          {activeTab === "ask" && <AskXiaoTuan />}
          {activeTab === "guides" && <GuidesTab />}
          {activeTab === "itinerary" && <ItineraryTab />}
          {activeTab === "profile" && <ProfileTab />}
        </main>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
