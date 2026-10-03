import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderArchive,
  FileText,
  ScanEye,
  Scissors,
  SlidersHorizontal,
  Smartphone,
  Kanban,
  BarChart3,
  Check,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Search,
  LogOut,
  Edit2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getSession, clearSession } from '../services/session';
import { CommandPalette } from '../components/dashboard/CommandPalette';
import { InspectorPanel } from '../components/dashboard/InspectorPanel';

// Modules
import { AssetsPage } from './AssetsPage';
import { ScriptsPage } from './ScriptsPage';
import { FootagePage } from './FootagePage';
import { ClipsPage } from './ClipsPage';
import { EditorPage } from './EditorPage';
import { PlatformsPage } from './PlatformsPage';
import { WorkflowPage } from './WorkflowPage';
import { InsightsPage } from './InsightsPage';

interface ModuleConfig {
  id: string;
  name: string;
  shortName: string;
  group: 'Create' | 'Produce' | 'Ship' | 'Learn';
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULES: ModuleConfig[] = [
  { id: 'assets', name: 'Assets', shortName: 'Assets', group: 'Create', shortcut: '1', icon: FolderArchive },
  { id: 'scripts', name: 'Scripts and hooks', shortName: 'Scripts', group: 'Create', shortcut: '2', icon: FileText },
  { id: 'footage', name: 'Footage match', shortName: 'Footage', group: 'Produce', shortcut: '3', icon: ScanEye },
  { id: 'clips', name: 'Clips', shortName: 'Clips', group: 'Produce', shortcut: '4', icon: Scissors },
  { id: 'editor', name: 'Editor', shortName: 'Editor', group: 'Produce', shortcut: '5', icon: SlidersHorizontal },
  { id: 'platforms', name: 'Platforms', shortName: 'Platforms', group: 'Ship', shortcut: '6', icon: Smartphone },
  { id: 'workflow', name: 'Workflow', shortName: 'Workflow', group: 'Ship', shortcut: '7', icon: Kanban },
  { id: 'insights', name: 'Insights', shortName: 'Insights', group: 'Learn', shortcut: '8', icon: BarChart3 },
];

export const DashboardPage: React.FC = () => {
  const { module: routeModule } = useParams<{ module?: string }>();
  const navigate = useNavigate();

  // Validate active module
  const activeModule = MODULES.some((m) => m.id === routeModule)
    ? (routeModule as string)
    : 'assets';

  const [sessionEmail, setSessionEmail] = useState<string>(() => getSession()?.email || '');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('creatorai.sidebar.collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [projectName, setProjectName] = useState('Untitled project');
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => new Date().toTimeString().split(' ')[0]);

  const {
    assets,
    script,
    scriptLineMatches,
    clips,
    editorLayers,
    editorHistory,
    platformVariants,
    workflowCards,
    insightsRecords,
  } = useStore();

  // Determine completion of steps from store state
  const isStepCompleted = (modId: string): boolean => {
    switch (modId) {
      case 'assets':
        return assets.length > 0;
      case 'scripts':
        return script.sections.length > 0 && !!script.pinnedHookId;
      case 'footage':
        return scriptLineMatches.length > 0;
      case 'clips':
        return clips.some((c) => c.status === 'accepted') || clips.length > 0;
      case 'editor':
        return editorLayers.length > 0 || editorHistory.length > 0;
      case 'platforms':
        return Object.keys(platformVariants).length > 0;
      case 'workflow':
        return workflowCards.length > 0;
      case 'insights':
        return insightsRecords.length > 0;
      default:
        return false;
    }
  };

  useEffect(() => {
    const handleSessionChange = () => {
      setSessionEmail(getSession()?.email || '');
    };
    window.addEventListener('creatorai:session-changed', handleSessionChange);

    // Format current clock time for saved status
    const formatTime = () => {
      const now = new Date();
      return now.toTimeString().split(' ')[0];
    };
    const interval = setInterval(() => {
      setLastSavedTime(formatTime());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('creatorai.sidebar.collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard navigation: Keys 1 to 8 switch modules, Cmd/Ctrl+K opens palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key, 10) - 1;
        if (MODULES[idx]) {
          e.preventDefault();
          navigate(`/dashboard/${MODULES[idx].id}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSignOut = () => {
    clearSession();
    navigate('/');
  };

  const currentModIndex = MODULES.findIndex((m) => m.id === activeModule);
  const nextModule = MODULES[(currentModIndex + 1) % MODULES.length];

  // Render module workspace component
  const renderModuleWorkspace = () => {
    switch (activeModule) {
      case 'assets':
        return <AssetsPage />;
      case 'scripts':
        return <ScriptsPage />;
      case 'footage':
        return <FootagePage />;
      case 'clips':
        return <ClipsPage />;
      case 'editor':
        return <EditorPage />;
      case 'platforms':
        return <PlatformsPage />;
      case 'workflow':
        return <WorkflowPage />;
      case 'insights':
        return <InsightsPage />;
      default:
        return <AssetsPage />;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR (48px)                                             */}
      {/* ------------------------------------------------------------- */}
      <header className="h-12 w-full border-b border-border/80 bg-secondary/60 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-30">
        {/* Left: Brand + Project name */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2 group flex-shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="5 4 15 12 5 20 5 4" fill="white" />
              <line x1="18" y1="4" x2="18" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-lg tracking-tight text-white">
              CreatorAi
            </span>
          </Link>

          <span className="text-muted-foreground/40 font-light">&bull;</span>

          {/* Editable project name */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingProjectName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingProjectName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingProjectName(false);
                }}
                autoFocus
                className="bg-secondary px-2 py-0.5 rounded text-xs text-white border border-border focus:outline-none focus:border-white/40"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingProjectName(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors truncate"
                title="Click to rename project"
              >
                <span className="truncate">{projectName}</span>
                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Command palette jump */}
        <button
          type="button"
          onClick={() => setIsCommandOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-border/80 text-xs text-muted-foreground hover:text-white hover:border-white/40 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-signal" />
          <span>Jump to...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/10">
            Ctrl K
          </kbd>
        </button>

        {/* Right: Session email + Sign out */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden md:inline-block text-xs font-mono text-muted-foreground truncate max-w-[180px]">
            {sessionEmail}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-border text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. PIPELINE STRIP (40px)                                      */}
      {/* ------------------------------------------------------------- */}
      <nav
        aria-label="Pipeline stepper"
        className="h-10 w-full border-b border-border/60 bg-secondary/30 flex items-center px-4 overflow-x-auto flex-shrink-0 no-scrollbar z-20"
      >
        <div className="flex items-center gap-1 w-full min-w-max">
          {MODULES.map((m, idx) => {
            const isActive = m.id === activeModule;
            const isDone = isStepCompleted(m.id);

            return (
              <React.Fragment key={m.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/${m.id}`)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold border-b-2 border-signal'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="font-mono text-[10px] opacity-60">0{idx + 1}</span>
                  <span>{m.shortName}</span>
                  {isDone && <Check className="w-3 h-3 text-ok ml-0.5" />}
                </button>

                {idx < MODULES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN CONSOLE BODY (Sidebar + Workspace + Inspector)         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        {/* Left Sidebar (232px collapsible to 56px) */}
        <aside
          aria-label="Console navigation"
          className={`hidden md:flex flex-col border-r border-border/80 bg-secondary/20 flex-shrink-0 transition-all duration-200 ${
            isSidebarCollapsed ? 'w-14' : 'w-56'
          }`}
        >
          {/* Sidebar header toggle */}
          <div className="h-9 px-3 flex items-center justify-between border-b border-border/40 text-muted-foreground flex-shrink-0">
            {!isSidebarCollapsed && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">
                Modules
              </span>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1 hover:text-white transition-colors rounded hover:bg-white/5 mx-auto md:mx-0"
              title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Module items grouped */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4">
            {(['Create', 'Produce', 'Ship', 'Learn'] as const).map((groupName) => {
              const groupItems = MODULES.filter((m) => m.group === groupName);

              return (
                <div key={groupName} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <div className="px-3.5 py-1 text-[10px] uppercase font-mono tracking-widest text-muted-foreground/60">
                      {groupName}
                    </div>
                  )}

                  {groupItems.map((m) => {
                    const isActive = m.id === activeModule;
                    const isDone = isStepCompleted(m.id);
                    const Icon = m.icon;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => navigate(`/dashboard/${m.id}`)}
                        title={`${m.name} (Key ${m.shortcut})`}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors relative ${
                          isActive
                            ? 'text-white font-medium bg-white/5'
                            : 'text-muted-foreground hover:text-white hover:bg-white/5'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {/* Active left 2px white bar */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
                        )}

                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-signal' : 'text-muted-foreground'}`} />

                        {!isSidebarCollapsed && (
                          <span className="truncate flex-1 text-left">{m.name}</span>
                        )}

                        {/* Status marker */}
                        {!isSidebarCollapsed && (
                          <span
                            className={`w-1.5 h-1.5 rounded-sm flex-shrink-0 ${
                              isDone ? 'bg-ok' : 'bg-muted-foreground/30'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Tool Workspace */}
        <main
          className="flex-1 h-full overflow-hidden bg-background relative flex flex-col"
          style={{ transition: 'opacity 150ms ease-out' }}
        >
          {renderModuleWorkspace()}
        </main>

        {/* Right Inspector Panel */}
        <InspectorPanel
          module={activeModule}
          isOpen={isInspectorOpen}
          onToggle={() => setIsInspectorOpen(!isInspectorOpen)}
          width={320}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. BOTTOM STATUS BAR (28px)                                   */}
      {/* ------------------------------------------------------------- */}
      <footer className="h-7 w-full border-t border-border/80 bg-secondary/50 px-4 flex items-center justify-between text-[11px] text-muted-foreground flex-shrink-0 z-30 font-mono">
        <div>Demo mode, data stays in this browser</div>
        <div className="hidden sm:block">Saved locally at {lastSavedTime}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${nextModule.id}`)}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <span>Next: {nextModule.shortName}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <span className="hidden md:inline-block text-muted-foreground/40">&bull;</span>
          <span className="hidden md:inline-block">Ctrl K</span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (below 768px) */}
      <div className="md:hidden h-12 w-full border-t border-border bg-secondary flex items-center justify-around px-2 z-40 overflow-x-auto no-scrollbar">
        {MODULES.map((m) => {
          const isActive = m.id === activeModule;
          const Icon = m.icon;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate(`/dashboard/${m.id}`)}
              className={`flex flex-col items-center justify-center p-1 min-w-[48px] text-[10px] ${
                isActive ? 'text-signal font-semibold' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[48px]">{m.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onToggleSidebar={toggleSidebar}
      />
    </div>
  );
};
