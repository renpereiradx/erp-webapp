/**
 * Metrics Card Component
 * Wave 6: Advanced Analytics & Reporting
 * 
 * Reusable metric display card with trend indicators,
 * interactive features, and accessibility support.
 */

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatting';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MetricsCard = memo(({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'blue',
  loading = false,
  onClick,
  onDrillDown,
  className = "",
  ...props
}) => {
  
  // Color mappings for different themes
  const colorMappings = {
    green: {
      icon: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      trend: 'text-green-600 dark:text-green-400',
      bg: 'hover:bg-green-50 dark:hover:bg-green-900/10'
    },
    blue: {
      icon: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      trend: 'text-blue-600 dark:text-blue-400',
      bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/10'
    },
    purple: {
      icon: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
      trend: 'text-purple-600 dark:text-purple-400',
      bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10'
    },
    orange: {
      icon: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
      trend: 'text-orange-600 dark:text-orange-400',
      bg: 'hover:bg-orange-50 dark:hover:bg-orange-900/10'
    },
    red: {
      icon: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
      trend: 'text-red-600 dark:text-red-400',
      bg: 'hover:bg-red-50 dark:hover:bg-red-900/10'
    }
  };

  const colors = colorMappings[color] || colorMappings.blue;

  // Trend icon and color based on direction
  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card className={cn("relative", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 hover:shadow-md cursor-pointer group",
        onClick && colors.bg,
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground line-clamp-1">
          {title}
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Metric Icon */}
          {Icon && (
            <div className={cn(
              "p-2 rounded-md transition-colors",
              colors.icon
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}

          {/* Options Menu */}
          {(onDrillDown || onClick) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Abrir opciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDrillDown && (
                  <DropdownMenuItem onClick={() => onDrillDown()}>
                    Ver detalles
                  </DropdownMenuItem>
                )}
                {onClick && (
                  <DropdownMenuItem onClick={() => onClick()}>
                    Ver gráfico completo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
          
          {/* Trend Indicator */}
          {change !== undefined && change !== null && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              getTrendColor()
            )}>
              <TrendIcon className="mr-1 h-3 w-3" />
              <span>
                {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                {formatPercentage(Math.abs(change))}
              </span>
              <span className="ml-1 text-muted-foreground">
                vs anterior
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar (optional) */}
        {props.progress !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  colors.trend.includes('green') ? 'bg-green-600' :
                  colors.trend.includes('blue') ? 'bg-blue-600' :
                  colors.trend.includes('purple') ? 'bg-purple-600' :
                  colors.trend.includes('orange') ? 'bg-orange-600' : 'bg-gray-600'
                )}
                style={{ width: `${Math.min(Math.max(props.progress, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Subtitle (optional) */}
        {props.subtitle && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {props.subtitle}
          </p>
        )}
      </CardContent>

      {/* Interactive States */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none rounded-lg",
          color === 'green' && "from-green-500 to-green-600",
          color === 'blue' && "from-blue-500 to-blue-600",
          color === 'purple' && "from-purple-500 to-purple-600",
          color === 'orange' && "from-orange-500 to-orange-600",
          color === 'red' && "from-red-500 to-red-600"
        )}
      />
    </Card>
  );
});

MetricsCard.displayName = 'MetricsCard';

export default MetricsCard;
