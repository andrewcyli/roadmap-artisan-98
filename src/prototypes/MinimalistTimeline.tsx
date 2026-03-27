import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// Minimalist Zen Prototype
// Philosophy: Apple-like, whitespace-heavy, calm, breathe

interface Plan {
  id: string;
  name: string;
  channel: string;
  startDate: Date;
  endDate: Date;
  status: 'idea' | 'draft' | 'review' | 'approved' | 'live';
  description?: string;
}

const CHANNELS = ['Social', 'Email', 'Paid', 'Events', 'Content'];

const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Product Teaser', channel: 'Social', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-15'), status: 'approved' },
  { id: '2', name: 'Launch Campaign', channel: 'Social', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-25'), status: 'draft' },
  { id: '3', name: 'Email Series', channel: 'Email', startDate: new Date('2026-03-05'), endDate: new Date('2026-03-20'), status: 'idea' },
  { id: '4', name: 'Retargeting Ads', channel: 'Paid', startDate: new Date('2026-03-15'), endDate: new Date('2026-04-15'), status: 'review' },
  { id: '5', name: 'Trade Show', channel: 'Events', startDate: new Date('2026-04-01'), endDate: new Date('2026-04-03'), status: 'approved' },
];

const STATUS_COLORS = {
  idea: 'bg-stone-200',
  draft: 'bg-stone-300',
  review: 'bg-amber-200',
  approved: 'bg-emerald-200',
  live: 'bg-blue-200',
};

const MinimalistTimeline = () => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [viewMode, setViewMode] = useState<'quarter' | 'month' | 'week'>('month');
  const [ideas, setIdeas] = useState<Partial<Plan>[]>([
    { id: 'i1', name: 'Q2 Brand Refresh', channel: 'Content', status: 'idea' },
    { id: 'i2', name: 'Influencer Push', channel: 'Social', status: 'idea' },
  ]);

  const getDaysInView = () => viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 90;
  const getColumns = () => Array.from({ length: getDaysInView() }, (_, i) => i);

  const getPlanPosition = (plan: Plan) => {
    const start = new Date('2026-03-01');
    const diffDays = Math.floor((plan.startDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { left: diffDays * 3.2, width: Math.max(duration * 3.2, 40) };
  };

  const getStackedPosition = (plan: Plan, channelIndex: number) => {
    const channelPlans = plans.filter(p => p.channel === CHANNELS[channelIndex]);
    const sortedPlans = [...channelPlans].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const index = sortedPlans.findIndex(p => p.id === plan.id);
    const pos = getPlanPosition(plan);
    return { ...pos, top: index * 32 };
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Minimal Header */}
      <header className="px-8 py-6 border-b border-stone-200/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-light tracking-tight">Roadmap</h1>
          <span className="text-stone-400 text-sm">Q1 2026</span>
        </div>
        <div className="flex items-center gap-2">
          {(['quarter', 'month', 'week'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-4 py-1.5 text-sm rounded-full transition-all duration-300",
                viewMode === mode 
                  ? "bg-stone-800 text-white" 
                  : "text-stone-500 hover:text-stone-800"
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Ideas Pool - Collapsible */}
      <div className="px-8 py-6 border-b border-stone-200/50">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer list-none text-stone-500 hover:text-stone-800 transition-colors">
            <span className="text-lg">💡</span>
            <span className="text-sm font-light">Ideas Pool</span>
            <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full">{ideas.length}</span>
            <span className="ml-auto group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <div className="mt-4 flex gap-3 flex-wrap">
            {ideas.map(idea => (
              <div
                key={idea.id}
                className="px-4 py-2 bg-white rounded-full border border-stone-200 shadow-sm text-sm text-stone-600 hover:shadow-md transition-shadow cursor-grab"
              >
                {idea.name}
              </div>
            ))}
            <button className="px-4 py-2 border border-dashed border-stone-300 rounded-full text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-colors">
              + Add idea
            </button>
          </div>
        </details>
      </div>

      {/* Timeline Canvas */}
      <div className="px-8 py-8 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Timeline Header */}
          <div className="flex mb-6 ml-32">
            {getColumns().filter((_, i) => i % 7 === 0).map(i => (
              <div 
                key={i} 
                className="text-xs text-stone-400 font-light"
                style={{ marginLeft: i === 0 ? 0 : 22.4 }}
              >
                Mar {Math.floor(i / 7) + 1}
              </div>
            ))}
          </div>

          {/* Swimlanes */}
          <div className="space-y-2">
            {CHANNELS.map(channel => {
              const channelIndex = CHANNELS.indexOf(channel);
              const channelPlans = plans.filter(p => p.channel === channel);
              
              return (
                <div key={channel} className="flex items-start group">
                  {/* Channel Label */}
                  <div className="w-32 py-3 text-sm text-stone-500 font-light flex-shrink-0">
                    {channel}
                  </div>
                  
                  {/* Lane */}
                  <div className="flex-1 h-12 relative bg-white/50 rounded-lg group-hover:bg-white transition-colors duration-300">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {getColumns().map(i => (
                        <div key={i} className="flex-1 border-r border-stone-100 last:border-0" />
                      ))}
                    </div>
                    
                    {/* Plans */}
                    {channelPlans.map(plan => {
                      const pos = getStackedPosition(plan, channelIndex);
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={cn(
                            "absolute h-8 rounded-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                            STATUS_COLORS[plan.status],
                            "flex items-center px-3 text-xs font-medium",
                            selectedPlan?.id === plan.id && "ring-2 ring-stone-800 ring-offset-2"
                          )}
                          style={{ 
                            left: `calc(${pos.left}% + 8px)`, 
                            width: `calc(${pos.width}% - 16px)`,
                            top: `${pos.top + 2}px`
                          }}
                        >
                          <span className="truncate">{plan.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Panel - Slide in */}
      {selectedPlan && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl p-8 transform transition-transform duration-500 ease-out">
          <button 
            onClick={() => setSelectedPlan(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 text-xl"
          >
            ×
          </button>
          
          <div className="mt-8">
            <input
              value={selectedPlan.name}
              onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, name: e.target.value } : p))}
              className="text-xl font-light bg-transparent border-none outline-none w-full mb-4"
            />
            
            <div className="space-y-6">
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-wider">Channel</label>
                <select 
                  value={selectedPlan.channel}
                  onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, channel: e.target.value } : p))}
                  className="w-full mt-1 bg-stone-50 border-none rounded-lg px-3 py-2 text-sm"
                >
                  {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-wider">Status</label>
                <div className="flex gap-2 mt-2">
                  {(['idea', 'draft', 'review', 'approved', 'live'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, status } : p))}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs transition-colors",
                        selectedPlan.status === status ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 uppercase tracking-wider">Start</label>
                  <div className="text-sm mt-1">{formatDate(selectedPlan.startDate)}</div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 uppercase tracking-wider">End</label>
                  <div className="text-sm mt-1">{formatDate(selectedPlan.endDate)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalistTimeline;