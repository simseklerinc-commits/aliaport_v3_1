import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface NotificationBadgeProps {
  onNotificationClick?: () => void;
}

export function VehicleDocumentNotificationBadge({ onNotificationClick }: NotificationBadgeProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingCount();
    
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/vehicles/documents/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingCount(response.data.pending || 0);
    } catch (error) {
      console.error('Notification fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={onNotificationClick}
    >
      <Bell className="h-5 w-5" />
      {pendingCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 bg-orange-500 text-white px-2 py-0.5 text-xs min-w-5 h-5 flex items-center justify-center rounded-full"
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </Badge>
      )}
    </Button>
  );
}
