// contexts/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationType } from '@/components/Notification';

interface NotificationContextProps {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
    duration: number;
  }>({
    type: 'info',
    message: '',
    isVisible: false,
    duration: 3000
  });

  const showNotification = (type: NotificationType, message: string, duration = 3000) => {
    setNotification({
      type,
      message,
      isVisible: true,
      duration
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        duration={notification.duration}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
}