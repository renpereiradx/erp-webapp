/**
 * Wave3StatusPanel - Performance Status Display
 * Panel para mostrar el estado de las optimizaciones Wave 3
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import React, { memo } from 'react';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  Database, 
  Cpu, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';

const Wave3StatusPanel = ({
  serviceWorker = {},
  analyticsWorker = {},
  virtualScrolling = false,
  prefetchStatus = {},
  onClearCache,
  className = ''
}) => {
  const isOnline = serviceWorker.networkStatus === 'online';
  
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Wave 3 Performance Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Network & Service Worker Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Service Worker:</span>
              <Badge 
                variant={serviceWorker.isActivated ? 'default' : 'secondary'}
                className="text-xs"
              >
                {serviceWorker.isActivated ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Analytics Worker:</span>
              <Badge 
                variant={analyticsWorker.isReady ? 'default' : 'secondary'}
                className="text-xs"
              >
                {analyticsWorker.isReady ? 'Ready' : 'Loading'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Virtual Scroll:</span>
              <Badge 
                variant={virtualScrolling ? 'default' : 'secondary'}
                className="text-xs"
              >
                {virtualScrolling ? 'Active' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {analyticsWorker.isProcessing && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">
                Procesando en background
              </span>
            </div>
            
            {analyticsWorker.progress && (
              <div className="space-y-1">
                <div className="text-xs text-blue-700">
                  {analyticsWorker.progress.message}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analyticsWorker.progress.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600">
                  {analyticsWorker.progress.current} / {analyticsWorker.progress.total}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cache Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Cache Status</div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium">API Cache</div>
              <div className="text-green-600">
                {serviceWorker.cacheStatus?.hitRate || 0}% hit
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium">Prefetch</div>
              <div className="text-blue-600">
                {prefetchStatus.hasGoodConnection?.() ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium">Memory</div>
              <div className="text-purple-600">
                Optimized
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCache}
            className="flex-1 text-xs"
          >
            Clear Cache
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled
          >
            Force Sync
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(Wave3StatusPanel);
