import { useState } from 'react';
import { cn } from '@/lib/utils';

// Visual Creative Prototype
// Philosophy: Figma-like, bold, card-based, playful, emoji-rich

interface Plan {
  id: string;
  name: string;
  channel: string;
  startDate: Date;
  endDate: Date;
  status: 'idea' | 'draft' | 'review' | 'approved' | 'live';
  emoji?: string;
  color: string;
}

const CHANNELS = [
  { id: 'social', label: '📱 Social', color: 'from-pink-400 to-rose-500' },
  { id: 'email', label: '📧 Email', color: 'from-violet-400 to-purple-500' },
  { id: 'paid', label: '💰 Paid', color: 'from-blue-400 to-cyan-500' },
  { id: 'events', label: '🎪 Events', color: 'from-orange-400 to-amber-500' },
  { id: 'content', label: '📝 Content', color: 'from-green-400 to-emerald-500' },
];

const PLAN_COLORS = [
  'from-pink-400 to-rose-500',
  'from-violet-400 to-purple-500', 
  'from-blue-400 to-cyan-500',
  'from-orange-400 to-amber-500',
  'from-green-400 to-emerald-500',
  'from-red-400 to-orange-500',
  'from-indigo-400 to-blue-500',
  'from-teal-400 to-cyan-500',
];

const STATUS_EMOJI = {
  idea: { emoji: '💭', label: 'Idea' },
  draft: { emoji: '✏️', label: 'Draft' },
  review: { emoji: '👀', label: 'Review' },
  approved: { emoji: '✅', label: 'Approved' },
  live: { emoji: '🚀', label: 'Live' },
};

const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Product Teaser', channel: 'social', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-15'), status: 'approved', emoji: '🎯', color: 'from-pink-400 to-rose-500' },
  { id: '2', name: 'Launch Campaign', channel: 'social', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-25'), status: 'draft', emoji: '💥', color: 'from-violet-400 to-purple-500' },
  { id: '3', name: 'Email Series', channel: 'email', startDate: new Date('2026-03-05'), endDate: new Date('2026-03-20'), status: 'idea', emoji: '📬', color: 'from-blue-400 to-cyan-500' },
  { id: '4', name: 'Retargeting', channel: 'paid', startDate: new Date('2026-03-15'), endDate: new Date('2026-04-15'), status: 'review', emoji: '🎯', color: 'from-orange-400 to-amber-500' },
  { id: '5', name: 'Trade Show', channel: 'events', startDate: new Date('2026-04-01'), endDate: new Date('2026-04-03'), status: 'approved', emoji: '🏛️', color: 'from-green-400 to-emerald-500' },
  { id: '6', name: 'Blog Posts', channel: 'content', startDate: new Date('2026-03-08'), endDate: new Date('2026-03-22'), status: 'live', emoji: '✍️', color: 'from-teal-400 to-cyan-500' },
];

const VisualTimeline = () => {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Plan[]>([
    { id: 'i1', name: 'Q2 Brand Refresh', channel: 'content', startDate: new Date(), endDate: new Date(), status: 'idea', emoji: '🎨', color: 'from-pink-400 to-rose-500' },
    { id: 'i2', name: 'Influencer Push', channel: 'social', startDate: new Date(), endDate: new Date(), status: 'idea', emoji: '🤝', color: 'from-violet-400 to-purple-500' },
    { id: 'i3', name: 'Summer Sale', channel: 'paid', startDate: new Date(), endDate: new Date(), status: 'idea', emoji: '☀️', color: 'from-orange-400 to-amber-500' },
  ]);

  const getPlanPosition = (plan: Plan) => {
    const start = new Date('2026-03-01');
    const diffDays = Math.floor((plan.startDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { left: diffDays * 3.3, width: Math.max(duration * 3.3, 60) };
  };

  const getStackingOffset = (plan: Plan, channelPlans: Plan[]) => {
    const sorted = [...channelPlans].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const index = sorted.findIndex(p => p.id === plan.id);
    return index * 48;
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const durationDays = (plan: Plan) => {
    return Math.ceil((plan.endDate.getTime() - plan.startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Header */}
      <header className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-xl">
              🗺️
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Roadmap Artisan
              </h1>
              <p className="text-xs text-white/40">Campaign Planner • Q1 2026</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Ideas Pool Button */}
            <div className="relative group">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all">
                <span>💡</span>
                <span className="text-sm">Ideas</span>
                <span className="bg-pink-500 text-white text-xs px-1.5 rounded-full">{ideas.length}</span>
              </button>
              
              {/* Ideas Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b border-white/10">
                  <span className="text-xs text-white/50">Drag to timeline to schedule</span>
                </div>
                <div className="p-2 space-y-1">
                  {ideas.map(idea => (
                    <div
                      key={idea.id}
                      className={cn(
                        "p-2 rounded-lg bg-gradient-to-r cursor-grab hover:scale-[1.02] transition-transform",
                        idea.color
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{idea.emoji}</span>
                        <span className="text-sm font-medium">{idea.name}</span>
                      </div>
                    </div>
                  ))}
                  <button className="w-full p-2 rounded-lg border border-dashed border-white/20 text-white/40 text-sm hover:bg-white/5 transition-colors">
                    + New idea
                  </button>
                </div>
              </div>
            </div>
            
            <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
              + New Plan
            </button>
          </div>
        </div>
      </header>

      {/* Timeline Container */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Week Markers */}
          <div className="flex mb-4 ml-40">
            {['Mar 1', 'Mar 8', 'Mar 15', 'Mar 22', 'Mar 29', 'Apr 5'].map((date, i) => (
              <div key={date} className="text-xs text-white/30" style={{ marginLeft: i === 0 ? 0 : 66 }}>
                {date}
              </div>
            ))}
          </div>

          {/* Swimlanes */}
          <div className="space-y-3">
            {CHANNELS.map(channel => {
              const channelPlans = plans.filter(p => p.channel === channel.id);
              
              return (
                <div key={channel.id} className="flex items-start">
                  {/* Channel Label */}
                  <div className="w-40 flex-shrink-0">
                    <div className={cn(
                      "px-3 py-2 rounded-lg bg-gradient-to-r text-sm font-medium flex items-center gap-2",
                      channel.color
                    )}>
                      <span>{channel.label}</span>
                    </div>
                  </div>
                  
                  {/* Timeline Lane */}
                  <div className="flex-1 relative h-16 bg-white/5 rounded-xl overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 grid grid-cols-7 gap-px bg-white/5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="bg-white/[0.02]" />
                      ))}
                    </div>
                    
                    {/* Connector Lines for Related */}
                    {channelPlans.length > 1 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <path
                          d="M 100 40 Q 200 20 300 40"
                          fill="none"
                          stroke="white"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.2"
                        />
                      </svg>
                    )}
                    
                    {/* Plans */}
                    {channelPlans.map(plan => {
                      const pos = getPlanPosition(plan);
                      const offset = getStackingOffset(plan, channelPlans);
                      const statusEmoji = STATUS_EMOJI[plan.status];
                      
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          onMouseEnter={() => setHoveredPlan(plan.id)}
                          onMouseLeave={() => setHoveredPlan(null)}
                          className={cn(
                            "absolute h-12 rounded-xl cursor-pointer transition-all duration-300 group",
                            "bg-gradient-to-r shadow-lg",
                            plan.color,
                            selectedPlan?.id === plan.id && "ring-4 ring-white/30 scale-105 z-10",
                            hoveredPlan === plan.id && "scale-[1.02] shadow-xl"
                          )}
                          style={{ 
                            left: `${pos.left + 8}px`, 
                            width: `calc(${pos.width}% - 16px)`,
                            top: `${offset + 8}px`
                          }}
                        >
                          <div className="h-full px-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{plan.emoji}</span>
                              <span className="text-sm font-bold truncate">{plan.name}</span>
                            </div>
                            
                            {pos.width > 80 && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                                  {durationDays(plan)}d
                                </span>
                                <span>{statusEmoji.emoji}</span>
                              </div>
                            )}
                          </div>
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

      {/* Floating Detail Panel */}
      {selectedPlan && (
        <div className="fixed bottom-6 right-6 w-72 bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-r flex items-center justify-center text-xl",
              selectedPlan.color
            )}>
              {selectedPlan.emoji}
            </div>
            <button 
              onClick={() => setSelectedPlan(null)}
              className="text-white/40 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <input
            value={selectedPlan.name}
            onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, name: e.target.value } : p))}
            className="w-full bg-transparent border-b border-white/20 focus:border-white/50 outline-none text-lg font-bold mb-3"
          />
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider">Status</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(STATUS_EMOJI).map(([key, { emoji, label }]) => (
                  <button
                    key={key}
                    onClick={() => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, status: key as Plan['status'] } : p))}
                    className={cn(
                      "px-2 py-1 rounded-lg text-xs transition-all",
                      selectedPlan.status === key 
                        ? "bg-white/20 text-white" 
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-white/40 uppercase">Start</label>
                <div className="text-sm mt-0.5">{formatDate(selectedPlan.startDate)}</div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-white/40 uppercase">End</label>
                <div className="text-sm mt-0.5">{formatDate(selectedPlan.endDate)}</div>
              </div>
            </div>
            
            <div>
              <label className="text-[10px] text-white/40 uppercase">Channel</label>
              <select 
                value={selectedPlan.channel}
                onChange={(e) => setPlans(plans.map(p => p.id === selectedPlan.id ? { ...p, channel: e.target.value } : p))}
                className="w-full mt-1 bg-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {CHANNELS.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="fixed bottom-6 left-6 flex gap-2">
        {Object.entries(STATUS_EMOJI).map(([key, { emoji, label }]) => (
          <div key={key} className="px-2 py-1 bg-white/10 rounded-lg text-xs flex items-center gap-1">
            <span>{emoji}</span>
            <span className="text-white/60">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualTimeline;