"use client";

import React, { useEffect, useState } from "react";
import { BoltIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface CreditNotification {
  id: string;
  type: "low_balance" | "depleted" | "purchase_success" | "usage_spike";
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  timestamp: Date;
  read: boolean;
}

interface CreditNotificationsProps {
  userId?: string;
  onNotificationClick?: (notification: CreditNotification) => void;
}

export default function CreditNotifications({
  userId,
  onNotificationClick: _onNotificationClick,
}: CreditNotificationsProps) {
  const [notifications, setNotifications] = useState<CreditNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      checkForNotifications();
      // Check for notifications every 5 minutes
      const interval = setInterval(checkForNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const checkForNotifications = async () => {
    try {
      const response = await fetch("/api/credits/balance");
      if (!response.ok) return;

      const data = await response.json();
      const balance = data.balance;
      const dailyAverage = data.analytics.dailyAverage;

      const newNotifications: CreditNotification[] = [];

      // Low balance warning (less than 50 credits)
      if (balance < 50 && balance > 0) {
        newNotifications.push({
          id: "low_balance",
          type: "low_balance",
          title: "Low Credit Balance",
          message: `You have ${balance} credits remaining. Consider purchasing more to avoid service interruption.`,
          severity: "warning",
          timestamp: new Date(),
          read: false,
        });
      }

      // Depleted balance (0 credits)
      if (balance === 0) {
        newNotifications.push({
          id: "depleted",
          type: "depleted",
          title: "Credits Depleted",
          message: "Your credit balance is empty. Purchase credits to continue using the API.",
          severity: "error",
          timestamp: new Date(),
          read: false,
        });
      }

      // Usage spike warning (daily usage 3x higher than average)
      if (dailyAverage > 0 && data.analytics.last30Days > dailyAverage * 3) {
        newNotifications.push({
          id: "usage_spike",
          type: "usage_spike",
          title: "Unusual Usage Detected",
          message: `Your recent usage is significantly higher than average. Monitor your API calls to avoid unexpected charges.`,
          severity: "info",
          timestamp: new Date(),
          read: false,
        });
      }

      // Check for success message from URL params (after purchase)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("success") === "true") {
        newNotifications.push({
          id: "purchase_success",
          type: "purchase_success",
          title: "Purchase Successful",
          message: "Your credits have been added to your account. Thank you for your purchase!",
          severity: "success",
          timestamp: new Date(),
          read: false,
        });

        // Clean up URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          // Merge with existing, avoiding duplicates
          const existing = prev.filter(n => !newNotifications.some(nn => nn.id === n.id));
          return [...existing, ...newNotifications];
        });
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error checking credit notifications:", error);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const dismissAll = () => {
    setNotifications([]);
    setIsVisible(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "low_balance":
      case "depleted":
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case "purchase_success":
        return <BoltIcon className="h-5 w-5" />;
      default:
        return <BoltIcon className="h-5 w-5" />;
    }
  };

  const getNotificationStyle = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-500/20 border-red-500/50 text-red-300";
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-300";
      case "success":
        return "bg-green-500/20 border-green-500/50 text-green-300";
      default:
        return "bg-blue-500/20 border-blue-500/50 text-blue-300";
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 backdrop-blur-lg shadow-lg transition-all duration-300 ${getNotificationStyle(notification.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white">{notification.title}</h4>
                <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                <div className="flex items-center gap-4 mt-3">
                  {(notification.type === "low_balance" || notification.type === "depleted") && (
                    <button
                      onClick={() => (window.location.href = "/dashboard?tab=credits")}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
                    >
                      Buy Credits
                    </button>
                  )}
                  {notification.type === "purchase_success" && (
                    <button
                      onClick={() => (window.location.href = "/dashboard?tab=credits")}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
                    >
                      View Balance
                    </button>
                  )}
                  <span className="text-xs opacity-70">{notification.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {notifications.length > 1 && (
        <div className="text-center">
          <button onClick={dismissAll} className="text-xs text-white/60 hover:text-white transition-colors">
            Dismiss All
          </button>
        </div>
      )}
    </div>
  );
}
