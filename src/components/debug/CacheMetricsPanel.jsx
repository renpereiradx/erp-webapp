import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, RefreshCw, Trash2, Info } from 'lucide-react';

/**
 * Panel de métricas de cache para desarrollo y debugging
 */
const CacheMetricsPanel = ({ cacheManager, title = 'Cache Metrics' }) => {
  const [stats, setStats] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Actualizar stats cada segundo
  useEffect(() => {
    if (!cacheManager) return;

    const updateStats = () => {
      setStats(cacheManager.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [cacheManager]);

  if (!stats) return null;

  const hitRateColor = stats.hitRatio >= 80 ? 'bg-green-100 text-green-800' : 
                      stats.hitRatio >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800';

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={hitRateColor}>
              {stats.hitRatio}% Hit Rate
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-blue-600"
            >
              <Info className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Métricas básicas - siempre visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-blue-800">
          <div className="space-y-1">
            <div className="font-medium">Cache Size</div>
            <div className="text-lg font-mono">
              {stats.size}/{stats.maxSize}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">Operations</div>
            <div className="text-lg font-mono">
              {stats.hits + stats.misses}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">Hits/Misses</div>
            <div className="text-lg font-mono">
              {stats.hits}/{stats.misses}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">Evictions</div>
            <div className="text-lg font-mono text-orange-600">
              {stats.evictions}
            </div>
          </div>
        </div>

        {/* Métricas expandidas */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-blue-800 mb-4">
              <div className="space-y-1">
                <div className="font-medium">Prefetch Queue</div>
                <div className="text-sm font-mono">
                  {stats.prefetchQueue || 0}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium">Background Tasks</div>
                <div className="text-sm font-mono">
                  {stats.backgroundTasks || 0}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium">Default TTL</div>
                <div className="text-sm font-mono">
                  {Math.round(stats.defaultTTL / 1000)}s
                </div>
              </div>
            </div>

            {/* Acciones de cache */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cacheManager.clear?.()}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Cache
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Force Refresh
              </Button>
            </div>

            {/* Información adicional */}
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
              <div className="font-medium mb-1">Performance Tips:</div>
              <ul className="space-y-1 text-xs">
                <li>• Hit rate &gt;80% = Excellent caching</li>
                <li>• High evictions = Consider increasing cache size</li>
                <li>• Active prefetch = Better user experience</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheMetricsPanel;
