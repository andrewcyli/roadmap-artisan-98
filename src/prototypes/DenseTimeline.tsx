import { useState } from 'react';
import { cn } from '@/lib/utils';

// Dense Professional Prototype
// Philosophy: Bloomberg/Notion-like, data-rich, grid-based, efficiency-first

interface Plan {
  id: string;
  name: string;
  channel: string;
  startDate: Date;
  endDate: Date;
  status: 'idea' | 'draft' | 'review' | 'approved' | 'live';
  owner?: string;
  budget?: number;
  description?: string;
}

const CHANNELS = [
  { id: 'social', label: 'Social', color: 'bg-pink-500' },
  { id: 'email', label: 'Email', color: 'bg-purple-500' },
  { id: 'paid', label: 'Paid', color: 'bg-blue-500' },
  { id: 'events', label: 'Events', color: 'bg-orange-500' },
  { id: 'content', label: 'Content', color: 'bg-green-500' },
];

const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Product Teaser', channel: 'social', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-15'), status: 'approved', owner: 'Sarah', budget: 5000 },
  { id: '2', name: 'Launch Campaign', channel: 'social', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-25'), status: 'draft', owner: 'Mike', budget: 12000 },
  { id: '3', name: 'Email Series', channel: 'email', startDate: new Date('2026-03-05'), endDate: new Date('2026-03-20'), status: 'idea', owner: 'Lisa', budget: 2000 },
  { id: '4', name: 'Retargeting Ads', channel: 'paid', startDate: new Date('2026-03-15'), endDate: new Date('2026-04-15'), status: 'review', owner: 'John', budget: 25000 },
  { id: '5', name: 'Trade Show', channel: 'events', startDate: new Date('2026-04-01'), endDate: new Date('2026-04-03'), status: 'approved', owner: 'Emma', budget: 45000 },
  { id: '6', name: 'Blog Content', channel: 'content', startDate: new Date('2026-03-08'), endDate: new Date('2026-03-22'), status: 'live', owner: 'Sarah', budget: 3000 },
];

const STATUS_CONFIG = {
  idea: { label: 'IDEA', color: 'text-stone-500 bg-stone-100' },
  draft: { label: 'DRAFT', color: 'text-blue-600 bg-blue-100' },
  review: { label: 'REVIEW', color: 'text-amber-600 bg-amber-100' },
  approved: { label: 'APPR', color: 'text-emerald-600 bg-emerald-100' },
  live: { label: 'LIVE', color: 'text-purple-600 bg-purple-100' },
};

const DAYS = Array.from({ length: 60 }, (_, i) => {
  const d = new Date('2026-03-01');
  d.setDate(d.getDate() + i);
  return d;
});

const DenseTimeline = () => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const getPlanPosition = (plan: Plan) => {
    const start = new Date('2026-03-01');
    const diffDays = Math.floor((plan.startDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { left: diffDays * 1.6, width: Math.max(duration * 1.6, 24) };
  };

  const checkOverlap = (plan: Plan, allPlans: Plan[]) => {
    const sameChannel = allPlans.filter(p => p.channel === plan.channel && p.id !== plan.id);
    return sameChannel.some(p => 
      (plan.startDate <= p.endDate && plan.startDate >= p.startDate) ||
      (plan.endDate >= p.startDate && plan.endDate <= p.endDate) ||
      (plan.startDate <= p.startDate && plan.endDate >= p.endDate)
    );
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const totalBudget = plans.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-mono text-xs">
      {/* Control Bar */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm">ROADMAP ARTISAN</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400">Q1 2026</span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-400">${totalBudget.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={cn("px-2 py-1 rounded", showGrid ? "bg-slate-700" : "bg-transparent hover:bg-slate-800")}
          >
            [{showGrid ? 'ON' : 'OFF'}] GRID
          </button>
          <button 
            onClick={() => setCompactMode(!compactMode)}
            className={cn("px-2 py-1 rounded", compactMode ? "bg-slate-700" : "bg-transparent hover:bg-slate-800")}
          >
            [{compactMode ? 'ON' : 'OFF'}] COMPACT
          </button>
          <button className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500">[+] ADD PLAN</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-100 border-b border-slate-300 px-4 py-1 flex items-center gap-6">
        <span>PLANS: <strong>{plans.length}</strong></span>
        <span>IDEAS: <strong>{plans.filter(p => p.status === 'idea').length}</strong></span>
        <span>ACTIVE: <strong className="text-green-600">{plans.filter(p => p.status === 'live').length}</strong></span>
        <span>PENDING: <strong className="text-amber-600">{plans.filter(p => p.status === 'review').length}</strong></span>
      </div>

      {/* Main Timeline */}
      <div className="flex">
        {/* Sidebar - Channel List */}
        <div className="w-32 flex-shrink-0 bg-slate-200 border-r border-slate-300">
          <div className="h-6 bg-slate-300 border-b border-slate-400 px-2 py-0.5 text-slate-600 font-bold">
            CHANNEL
          </div>
          {CHANNELS.map(channel => (
            <div 
              key={channel.id} 
              className={cn(
                "h-8 border-b border-slate-200 px-2 py-1 flex items-center gap-2",
                "hover:bg-slate-300 cursor-pointer"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", channel.color)} />
              <span className="truncate">{channel.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Date Header */}
            <div className="h-6 bg-slate-100 border-b border-slate-300 flex">
              {DAYS.filter((_, i) => i % 7 === 0).map((date, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 border-r border-slate-200 px-1 py-0.5 text-slate-500"
                  style={{ width: 112 }}
                >
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>

            {/* Rows */}
            {CHANNELS.map(channel => {
              const channelPlans = plans.filter(p => p.channel === channel.id);
              
              return (
                <div 
                  key={channel.id} 
                  className={cn(
                    "flex border-b border-slate-200 relative",
                    showGrid && "bg-[linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[length:16px_100%]"
                  )}
                  style={{ height: compactMode ? 28 : 40 }}
                >
                  {channelPlans.map(plan => {
                    const pos = getPlanPosition(plan);
                    const isOverlapping = checkOverlap(plan, plans);
                    const status = STATUS_CONFIG[plan.status];
                    
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "absolute h-full flex items-center justify-between px-2 cursor-pointer transition-all hover:brightness-110",
                          channel.color,
                          "text-white text-xs font-medium",
                          selectedPlan?.id === plan.id && "ring-2 ring-yellow-400 ring-offset-1 z-10"
                        )}
                        style={{ 
                          left: `${pos.left}%`, 
                          width: `${pos.width}%`,
                          top: isOverlapping ? '20%' : '4%',
                          height: isOverlapping ? '60%' : '92%',
                        }}
                      >
                        <span className="truncate">{plan.name}</span>
                        {pos.width > 60 && (
                          <span className={cn("text-[10px] px-1.5 rounded", status.color)}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Panel - Fixed Position Table Style */}
      {selectedPlan && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white border-t-2 border-blue-500 p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-8">
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Plan Name</div>
                <input
                  value={selectedPlan.name}
                  onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, name: e.target.value } : p))}
                  className="bg-transparent border-b border-slate-600 focus:border-blue-500 outline-none text-sm w-48"
                />
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Channel</div>
                <select 
                  value={selectedPlan.channel}
                  onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, channel: e.target.value } : p))}
                  className="bg-slate-700 border-none rounded px-2 py-0.5 text-xs"
                >
                  {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Status</div>
                <div className="flex gap-1 mt-0.5">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, status: key as Plan['status'] } : p))}
                      className={cn(
                        "px-2 py-0.5 text-[10px] rounded transition-colors",
                        selectedPlan.status === key ? cfg.color : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      )}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Owner</div>
                <input
                  value={selectedPlan.owner || ''}
                  onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, owner: e.target.value } : p))}
                  className="bg-slate-700 rounded px-2 py-0.5 text-xs w-20"
                  placeholder="Name"
                />
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Budget ($)</div>
                <input
                  value={selectedPlan.budget || 0}
                  onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, budget: Number(e.target.value) } : p))}
                  className="bg-slate-700 rounded px-2 py-0.5 text-xs w-24"
                  type="number"
                />
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Duration</div>
                <div className="text-xs mt-0.5">
                  {formatDate(selectedPlan.startDate)} → {formatDate(selectedPlan.endDate)}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedPlan(null)}
              className="text-slate-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DenseTimeline;