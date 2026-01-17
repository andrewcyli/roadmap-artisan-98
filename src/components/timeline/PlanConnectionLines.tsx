import { Plan } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { startOfYear, differenceInDays } from 'date-fns';
import { useMemo } from 'react';

interface PlanConnectionLinesProps {
  plans: Plan[];
  planStackMap: Map<string, number>;
}

interface ConnectionLine {
  parentId: string;
  childId: string;
  parentX: number;
  parentY: number;
  childX: number;
  childY: number;
  parentColor: string;
}

export const PlanConnectionLines = ({ plans, planStackMap }: PlanConnectionLinesProps) => {
  const { plans: allPlans } = usePlans();
  const yearStart = startOfYear(new Date(2025, 0, 1));
  const daysInYear = 365;

  const connections = useMemo(() => {
    const lines: ConnectionLine[] = [];
    
    // Get timeline width for calculations
    const timelineEl = document.querySelector('[data-timeline]');
    if (!timelineEl) return lines;
    
    const timelineWidth = timelineEl.clientWidth;
    const pixelsPerDay = timelineWidth / daysInYear;

    plans.forEach((childPlan) => {
      if (!childPlan.parentPlanId) return;
      
      // Find parent - could be in same lane or different lane
      const parentPlan = allPlans.find(p => p.id === childPlan.parentPlanId);
      if (!parentPlan) return;
      
      // Check if parent is in this swimlane
      const parentInSameLane = plans.find(p => p.id === parentPlan.id);
      
      const childStartDay = differenceInDays(childPlan.startDate, yearStart);
      const childStackIndex = planStackMap.get(childPlan.id) || 0;
      const childX = childStartDay * pixelsPerDay;
      const childY = childStackIndex * 36 + 8 + 14; // Center of plan card

      if (parentInSameLane) {
        // Parent is in same lane - draw direct connection
        const parentStartDay = differenceInDays(parentPlan.startDate, yearStart);
        const parentEndDay = differenceInDays(parentPlan.endDate, yearStart);
        const parentStackIndex = planStackMap.get(parentPlan.id) || 0;
        
        // Connect from parent's end to child's start
        const parentEndX = parentEndDay * pixelsPerDay;
        const parentY = parentStackIndex * 36 + 8 + 14;
        
        lines.push({
          parentId: parentPlan.id,
          childId: childPlan.id,
          parentX: Math.min(parentEndX, childX - 8), // Connect from closest point
          parentY,
          childX: childX,
          childY,
          parentColor: parentPlan.color,
        });
      } else {
        // Parent is in different lane - show connector from left edge
        lines.push({
          parentId: parentPlan.id,
          childId: childPlan.id,
          parentX: 0,
          parentY: childY,
          childX: childX,
          childY,
          parentColor: parentPlan.color,
        });
      }
    });

    return lines;
  }, [plans, allPlans, planStackMap]);

  if (connections.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none overflow-visible" 
      style={{ zIndex: 5 }}
    >
      <defs>
        {connections.map((conn) => (
          <marker
            key={`arrow-${conn.childId}`}
            id={`arrowhead-${conn.childId}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 6 3, 0 6"
              className="fill-primary/60"
            />
          </marker>
        ))}
      </defs>
      
      {connections.map((conn) => {
        const isSameRow = conn.parentY === conn.childY;
        const midX = conn.parentX + (conn.childX - conn.parentX) / 2;
        
        // Different path styles based on connection type
        let pathD: string;
        
        if (isSameRow && conn.parentX > 0) {
          // Horizontal line with slight curve
          pathD = `M ${conn.parentX} ${conn.parentY} 
                   C ${conn.parentX + 20} ${conn.parentY}, 
                     ${conn.childX - 20} ${conn.childY}, 
                     ${conn.childX - 4} ${conn.childY}`;
        } else if (conn.parentX === 0) {
          // From left edge (parent in different lane)
          pathD = `M ${conn.parentX} ${conn.childY} 
                   L ${conn.childX - 4} ${conn.childY}`;
        } else {
          // Curved connection between rows
          const curveOffset = Math.abs(conn.childY - conn.parentY) / 2;
          pathD = `M ${conn.parentX} ${conn.parentY}
                   C ${conn.parentX + curveOffset} ${conn.parentY},
                     ${conn.childX - curveOffset} ${conn.childY},
                     ${conn.childX - 4} ${conn.childY}`;
        }
        
        return (
          <g key={`${conn.parentId}-${conn.childId}`}>
            {/* Shadow/glow effect */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--primary) / 0.1)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Main line */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--primary) / 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={conn.parentX === 0 ? "4 4" : "none"}
              markerEnd={`url(#arrowhead-${conn.childId})`}
              className="transition-all duration-200"
            />
            {/* Dot at parent end */}
            {conn.parentX > 0 && (
              <circle
                cx={conn.parentX}
                cy={conn.parentY}
                r="3"
                className="fill-primary/60"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
