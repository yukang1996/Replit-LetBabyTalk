import { Link, useLocation } from "wouter";
import { MessageCircle, BarChart3, Mic, History, Settings } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    {
      href: "/chatbot",
      icon: MessageCircle,
      label: t('nav.chatbot'),
      isActive: location === "/chatbot",
    },
    {
      href: "/advisor", 
      icon: BarChart3,
      label: t('nav.advisor'),
      isActive: location === "/advisor",
    },
    {
      href: "/record",
      icon: Mic,
      label: "Record",
      isActive: location === "/record",
    },
    {
      href: "/history",
      icon: History,
      label: t('nav.history'),
      isActive: location === "/history",
    },
    {
      href: "/settings",
      icon: Settings,
      label: t('nav.settings'),
      isActive: location === "/settings",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-colors min-w-[50px] sm:min-w-[60px]",
                item.isActive
                  ? "text-pink-500"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 mb-1",
                item.isActive && "text-pink-500"
              )} />
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                item.isActive && "text-pink-500"
              )}>
                {item.label}
              </span>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
