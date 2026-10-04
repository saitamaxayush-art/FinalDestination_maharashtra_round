import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { WorkflowColumn } from '../types';
import {
  Kanban,
  Calendar as CalendarIcon,
  Plus,
  X,
  CheckSquare,
  GripHorizontal,
  FileText,
  SlidersHorizontal,
  Cpu,
} from 'lucide-react';
import { WorkflowCanvas } from '../components/workflow/WorkflowCanvas';

export const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    workflowCards,
    moveWorkflowCard,
    addWorkflowCard,
    updateWorkflowCard,
    deleteWorkflowCard,
  } = useStore();

  const [viewMode, setViewMode] = useState<'canvas' | 'kanban' | 'calendar'>('canvas');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [quickAddColumn, setQuickAddColumn] = useState<WorkflowColumn | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const COLUMNS: WorkflowColumn[] = [
    'Idea',
    'Script',
    'Record',
    'Edit',
    'Review',
    'Scheduled',
    'Published',
  ];

  const selectedCard = workflowCards.find((c) => c.id === selectedCardId);

  // Quick add card
  const handleQuickAdd = (column: WorkflowColumn) => {
    if (!quickAddTitle.trim()) return;
    addWorkflowCard(quickAddTitle, column, 'YouTube Shorts');
    setQuickAddTitle('');
    setQuickAddColumn(null);
  };

  // Drag and drop handlers
  const handleDragStart = (cardId: string) => {
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnColumn = (targetColumn: WorkflowColumn) => {
    if (!draggedCardId) return;
    moveWorkflowCard(draggedCardId, targetColumn);
    setDraggedCardId(null);
  };

  const publishedCount = workflowCards.filter((c) => c.column === 'Published').length;

  return (
    <PageShell
      title="Content Operations Workflow"
      description="Design, connect, and automate production pipelines with node-based canvas logic, multi-stage Kanban queues, and distribution calendar views."
      stepNumber={7}
      nextPageTitle="Insights"
      nextPagePath="/insights"
      nextPageCtaLabel="Continue to Insights"
      carryOverText={`${publishedCount} published pieces feed into live session production patterns on the Insights dashboard.`}
      actions={
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-secondary p-0.5 rounded-md border border-border">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'canvas'
                  ? 'bg-white text-black'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Canvas Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-black'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-black'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      }
    >
      {viewMode === 'canvas' ? (
        <WorkflowCanvas />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD (7 COLUMNS) */
        <div className="w-full overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-[1300px]">
            {COLUMNS.map((column) => {
              const cardsInCol = workflowCards.filter((c) => c.column === column);

              return (
                <div
                  key={column}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropOnColumn(column)}
                  className="flex-1 min-w-[180px] bg-secondary/40 border border-border/70 rounded-lg p-3 flex flex-col justify-between select-none"
                >
                  <div className="space-y-3">
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white">
                          {column}
                        </span>
                        <span className="w-4 h-4 rounded-md bg-white/10 text-muted-foreground text-[10px] font-mono flex items-center justify-center">
                          {cardsInCol.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQuickAddColumn(quickAddColumn === column ? null : column);
                          setQuickAddTitle('');
                        }}
                        className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
                        title="Add card"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick Add Form in Column */}
                    {quickAddColumn === column && (
                      <div className="p-2.5 rounded-md bg-secondary border border-signal space-y-2">
                        <input
                          type="text"
                          placeholder="Card title..."
                          value={quickAddTitle}
                          onChange={(e) => setQuickAddTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickAdd(column);
                          }}
                          className="w-full px-2 py-1 text-xs rounded-md bg-background border border-border text-white focus:outline-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setQuickAddColumn(null)}
                            className="px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(column)}
                            className="px-2.5 py-0.5 rounded bg-signal text-black font-semibold text-[11px]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cards Stack */}
                    <div className="space-y-2.5 min-h-[160px]">
                      {cardsInCol.map((card) => (
                        <motion.div
                          key={card.id}
                          layout
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          draggable
                          onDragStart={() => handleDragStart(card.id)}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`hairline-card p-3 space-y-2.5 cursor-grab active:cursor-grabbing border ${
                            selectedCardId === card.id
                              ? 'border-signal bg-secondary'
                              : 'border-border/80 bg-secondary/80 hover:border-white/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-xs text-white leading-tight">
                              {card.title}
                            </span>
                            <GripHorizontal className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span className="px-1.5 py-0.2 rounded bg-white/5 border border-border text-signal">
                              {card.platform}
                            </span>
                            <span>{card.dueDate.slice(5)}</span>
                          </div>

                          {/* Checklist preview */}
                          {card.checklist.length > 0 && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-muted-foreground" />
                              <span>
                                {card.checklist.filter((i) => i.done).length}/
                                {card.checklist.length} done
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CALENDAR VIEW (MONTH GRID) */
        <div className="hairline-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Distribution Calendar
              </span>
              <h3 className="font-display text-2xl text-white mt-0.5">
                October 2026 Schedule
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {workflowCards.filter((c) => c.column === 'Scheduled').length} items scheduled
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div
                key={d}
                className="text-center font-mono text-xs uppercase text-muted-foreground py-1 border-b border-border"
              >
                {d}
              </div>
            ))}

            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const dateStr = `2026-10-${day.toString().padStart(2, '0')}`;
              const matchedCards = workflowCards.filter(
                (c) => c.dueDate === dateStr
              );

              return (
                <div
                  key={day}
                  className="min-h-[90px] p-2 rounded-md bg-secondary/50 border border-border/60 space-y-1.5"
                >
                  <span className="text-[10px] font-mono text-muted-foreground block">
                    {day}
                  </span>

                  {matchedCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className="p-1.5 rounded-sm bg-signal/15 border border-signal text-[10px] text-white cursor-pointer hover:bg-signal/25 truncate font-medium"
                    >
                      {card.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARD DRAWER MODAL */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl p-6 rounded-lg bg-secondary border border-white/20 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between pb-3 border-b border-border/80">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-signal font-semibold">
                    {selectedCard.column} Column &bull; {selectedCard.platform}
                  </span>
                  <h3 className="font-display text-2xl text-white">
                    {selectedCard.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCardId(null)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Due Date */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground block mb-1">
                    Workflow Column
                  </label>
                  <select
                    value={selectedCard.column}
                    onChange={(e) =>
                      moveWorkflowCard(selectedCard.id, e.target.value as WorkflowColumn)
                    }
                    className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-muted-foreground block mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={selectedCard.dueDate}
                    onChange={(e) =>
                      updateWorkflowCard(selectedCard.id, { dueDate: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-white font-mono"
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Production Checklist
                </label>
                <div className="space-y-1.5">
                  {selectedCard.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        updateWorkflowCard(selectedCard.id, {
                          checklist: selectedCard.checklist.map((c) =>
                            c.id === item.id ? { ...c, done: !c.done } : c
                          ),
                        })
                      }
                      className="p-2 rounded-md bg-background/80 border border-border flex items-center gap-2.5 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        readOnly
                        className="rounded border-border text-signal"
                      />
                      <span className={item.done ? 'line-through text-muted-foreground' : 'text-white'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                  Production Notes
                </label>
                <textarea
                  rows={2}
                  value={selectedCard.notes}
                  onChange={(e) =>
                    updateWorkflowCard(selectedCard.id, { notes: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-md bg-background border border-border text-white"
                />
              </div>

              {/* Real Activity Log */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-[10px] uppercase font-mono text-muted-foreground block">
                  Action Audit History
                </label>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedCard.activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="text-[11px] text-muted-foreground flex items-center justify-between"
                    >
                      <span>{log.action}</span>
                      <span className="font-mono text-[10px]">{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions: Deep Links & Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-border/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCardId(null);
                      navigate('/editor');
                    }}
                    className="px-3 py-1.5 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Open in Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCardId(null);
                      navigate('/scripts');
                    }}
                    className="px-3 py-1.5 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>View Script</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    deleteWorkflowCard(selectedCard.id);
                    setSelectedCardId(null);
                  }}
                  className="px-3 py-1.5 rounded-md bg-warn/15 text-warn text-xs hover:bg-warn/25"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};
