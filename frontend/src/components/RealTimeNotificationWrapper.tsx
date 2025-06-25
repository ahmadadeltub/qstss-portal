import React, { useEffect } from 'react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { useAuth } from '../contexts/AuthContext';

interface RealTimeNotificationWrapperProps {
  children: React.ReactNode;
}

const RealTimeNotificationWrapper: React.FC<RealTimeNotificationWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  const { requestNotificationPermission, getConnectionStatus } = useRealTimeNotifications(user?.id);

  useEffect(() => {
    // Request browser notification permission when user logs in
    if (user) {
      requestNotificationPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Browser notifications enabled for user:', user.firstName, user.lastName);
        } else {
          console.log('⚠️ Browser notifications not permitted');
        }
      });

      // Log connection status
      const status = getConnectionStatus();
      console.log('🔔 Real-time notifications status:', status);
    }
  }, [user, requestNotificationPermission, getConnectionStatus]);

  return <>{children}</>;
};

export default RealTimeNotificationWrapper;
