"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  HomeIcon, 
  ArrowsUpDownIcon, 
  ChartBarIcon, 
  WalletIcon,
  Squares2X2Icon 
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ArrowsUpDownIcon as ArrowsUpDownIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  WalletIcon as WalletIconSolid,
  Squares2X2Icon as Squares2X2IconSolid
} from "@heroicons/react/24/solid";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { 
      path: "/", 
      label: "Home", 
      icon: HomeIcon,
      iconActive: HomeIconSolid
    },
    { 
      path: "/asteroids", 
      label: "Trade", 
      icon: ArrowsUpDownIcon,
      iconActive: ArrowsUpDownIconSolid
    },
    { 
      path: "/asteroids#futures", 
      label: "Futures", 
      icon: ChartBarIcon,
      iconActive: ChartBarIconSolid
    },
    { 
      path: "/asteroids#portfolio", 
      label: "Portfolio", 
      icon: WalletIcon,
      iconActive: WalletIconSolid
    },
    { 
      path: "/dashboard", 
      label: "More", 
      icon: Squares2X2Icon,
      iconActive: Squares2X2IconSolid
    },
  ];

  // Only show on mobile
  return (
    <div className="btm-nav btm-nav-sm lg:hidden bg-base-100 border-t border-base-300">
      {navItems.map((item) => {
        const isActive = pathname === item.path || 
                        (item.path.includes('#') && pathname.includes(item.path.split('#')[0]));
        const Icon = isActive ? item.iconActive : item.icon;
        
        return (
          <button
            key={item.path}
            className={isActive ? "active text-primary" : ""}
            onClick={() => {
              if (item.path.includes('#')) {
                const [path, hash] = item.path.split('#');
                router.push(path);
                setTimeout(() => {
                  document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                router.push(item.path);
              }
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="btm-nav-label text-xs">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}