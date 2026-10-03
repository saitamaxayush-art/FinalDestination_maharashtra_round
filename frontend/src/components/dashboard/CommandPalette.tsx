import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderArchive,
  FileText,
  ScanEye,
  Scissors,
  SlidersHorizontal,
  Smartphone,
  Kanban,
  BarChart3,
  RefreshCw,
  Trash2,
  PanelLeft,
  LogOut,
  Shield,
  FileCode,
  Search,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { clearSession } from '../../services/session';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSidebar: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    loadSampleAssets,
    clearSampleAssets,
    loadSampleInsights,
    clearInsightsData,
    resetAllData,
  } = useStore();

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    {
      id: 'mod-assets',
      label: 'Go to Assets',
      category: 'Workspaces',
      shortcut: '1',
      icon: <FolderArchive className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/assets');
        onClose();
      },
    },
    {
      id: 'mod-scripts',
      label: 'Go to Scripts and hooks',
      category: 'Workspaces',
      shortcut: '2',
      icon: <FileText className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/scripts');
        onClose();
      },
    },
    {
      id: 'mod-footage',
      label: 'Go to Footage match',
      category: 'Workspaces',
      shortcut: '3',
      icon: <ScanEye className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/footage');
        onClose();
      },
    },
    {
      id: 'mod-clips',
      label: 'Go to Clips',
      category: 'Workspaces',
      shortcut: '4',
      icon: <Scissors className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/clips');
        onClose();
      },
    },
    {
      id: 'mod-editor',
      label: 'Go to Editor',
      category: 'Workspaces',
      shortcut: '5',
      icon: <SlidersHorizontal className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/editor');
        onClose();
      },
    },
    {
      id: 'mod-platforms',
      label: 'Go to Platforms',
      category: 'Workspaces',
      shortcut: '6',
      icon: <Smartphone className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/platforms');
        onClose();
      },
    },
    {
      id: 'mod-workflow',
      label: 'Go to Workflow',
      category: 'Workspaces',
      shortcut: '7',
      icon: <Kanban className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/workflow');
        onClose();
      },
    },
    {
      id: 'mod-insights',
      label: 'Go to Insights',
      category: 'Workspaces',
      shortcut: '8',
      icon: <BarChart3 className="w-4 h-4 text-signal" />,
      action: () => {
        navigate('/dashboard/insights');
        onClose();
      },
    },
    {
      id: 'load-sample',
      label: 'Load sample project',
      category: 'Project Data',
      icon: <RefreshCw className="w-4 h-4 text-ok" />,
      action: () => {
        loadSampleAssets();
        loadSampleInsights();
        onClose();
      },
    },
    {
      id: 'clear-sample',
      label: 'Clear sample data',
      category: 'Project Data',
      icon: <Trash2 className="w-4 h-4 text-warn" />,
      action: () => {
        clearSampleAssets();
        clearInsightsData();
        onClose();
      },
    },
    {
      id: 'reset-all',
      label: 'Reset all local data',
      category: 'Project Data',
      icon: <Trash2 className="w-4 h-4 text-warn" />,
      action: () => {
        if (window.confirm('Reset all project data in browser local storage?')) {
          resetAllData();
          navigate('/dashboard/assets');
        }
        onClose();
      },
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle sidebar',
      category: 'View',
      shortcut: 'Cmd+B',
      icon: <PanelLeft className="w-4 h-4 text-white" />,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    },
    {
      id: 'privacy',
      label: 'Open Privacy Policy',
      category: 'Legal',
      icon: <Shield className="w-4 h-4 text-muted-foreground" />,
      action: () => {
        navigate('/privacy');
        onClose();
      },
    },
    {
      id: 'terms',
      label: 'Open Terms and Conditions',
      category: 'Legal',
      icon: <FileCode className="w-4 h-4 text-muted-foreground" />,
      action: () => {
        navigate('/terms');
        onClose();
      },
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      category: 'Session',
      icon: <LogOut className="w-4 h-4 text-muted-foreground" />,
      action: () => {
        clearSession();
        navigate('/');
        onClose();
      },
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-secondary/95 border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-border/80 gap-3">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-white/10 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/20">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs transition-colors ${
                    isSelected
                      ? 'bg-signal/15 text-white border-l-2 border-signal font-medium'
                      : 'text-foreground/80 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/10 text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border/60 bg-white/5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Navigate with &uarr; &darr;</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
