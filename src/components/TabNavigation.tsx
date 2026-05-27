import { MessageCircle, Compass, Map, User } from "lucide-react";
import { motion } from "framer-motion";

type TabId = "ask" | "guides" | "itinerary" | "profile";

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "ask", label: "问小团", icon: MessageCircle },
  { id: "guides", label: "攻略", icon: Compass },
  { id: "itinerary", label: "行程", icon: Map },
  { id: "profile", label: "我的", icon: User },
];

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] bg-card border-t border-border backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-around h-12 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 inset-x-0 mx-auto w-6 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;
export type { TabId };
