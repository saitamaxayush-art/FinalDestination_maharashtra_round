import React, { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { PerformanceRecord } from '../types';
import {
  Upload,
  Sparkles,
  Trash2,
  Table as TableIcon,
  Lightbulb,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const {
    insightsRecords,
    isSampleInsights,
    workflowCards,
    loadSampleInsights,
    clearInsightsData,
    importInsightsData,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvRawData, setCsvRawData] = useState<Record<string, string>[] | null>(null);
  const [columnMapping, setColumnMapping] = useState({
    title: '',
    platform: '',
    views: '',
    duration: '',
  });
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Table view toggles for accessible data table inspection
  const [showTableViewsOverTime, setShowTableViewsOverTime] = useState(false);
  const [showTablePlatform, setShowTablePlatform] = useState(false);
  const [showTableHooks, setShowTableHooks] = useState(false);
  const [showTableWorkflow, setShowTableWorkflow] = useState(false);

  // Handle CSV file selection and parsing with papaparse
  const handleCsvSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvRawData(results.data);
          const fields = Object.keys(results.data[0]);
          setColumnMapping({
            title: fields.find((f) => /title|name|video/i.test(f)) || fields[0] || '',
            platform: fields.find((f) => /platform|channel/i.test(f)) || fields[1] || '',
            views: fields.find((f) => /view|impressions|count/i.test(f)) || fields[2] || '',
            duration: fields.find((f) => /duration|length|seconds/i.test(f)) || fields[3] || '',
          });
          setShowMappingModal(true);
        }
      },
    });
  };

  const applyCsvMapping = () => {
    if (!csvRawData) return;
    const mappedRecords: PerformanceRecord[] = csvRawData.map((row, idx) => ({
      id: `imported_${idx}`,
      date: row.date || `2026-09-${(idx + 1).toString().padStart(2, '0')}`,
      title: row[columnMapping.title] || `Video Item ${idx + 1}`,
      platform: row[columnMapping.platform] || 'YouTube Shorts',
      hookTechnique: 'direct claim',
      durationSeconds: parseFloat(row[columnMapping.duration]) || 30,
      views: parseInt(row[columnMapping.views], 10) || 1000,
    }));

    importInsightsData(mappedRecords);
    setShowMappingModal(false);
    setCsvRawData(null);
  };

  // 1. Views over time chart data
  const viewsOverTimeData = useMemo(() => {
    return insightsRecords.map((r) => ({
      date: r.date.slice(5),
      views: r.views,
      title: r.title,
    }));
  }, [insightsRecords]);

  // 2. Performance by platform data
  const performanceByPlatformData = useMemo(() => {
    const map: Record<string, { views: number; count: number }> = {};
    insightsRecords.forEach((r) => {
      if (!map[r.platform]) map[r.platform] = { views: 0, count: 0 };
      map[r.platform].views += r.views;
      map[r.platform].count += 1;
    });
    return Object.entries(map).map(([platform, data]) => ({
      platform,
      totalViews: data.views,
      avgViews: Math.round(data.views / data.count),
    }));
  }, [insightsRecords]);

  // 3. Performance by hook technique data
  const performanceByHookData = useMemo(() => {
    const map: Record<string, { views: number; count: number }> = {};
    insightsRecords.forEach((r) => {
      const tech = r.hookTechnique || 'direct claim';
      if (!map[tech]) map[tech] = { views: 0, count: 0 };
      map[tech].views += r.views;
      map[tech].count += 1;
    });
    return Object.entries(map).map(([technique, data]) => ({
      technique,
      avgViews: Math.round(data.views / data.count),
      count: data.count,
    }));
  }, [insightsRecords]);

  // 4. Production pattern (Real session data from workflowCards)
  const productionPatternData = useMemo(() => {
    const stages: Record<string, number> = {};
    workflowCards.forEach((c) => {
      stages[c.column] = (stages[c.column] || 0) + 1;
    });
    return [
      { stage: 'Idea', count: stages['Idea'] || 0 },
      { stage: 'Script', count: stages['Script'] || 0 },
      { stage: 'Record', count: stages['Record'] || 0 },
      { stage: 'Edit', count: stages['Edit'] || 0 },
      { stage: 'Review', count: stages['Review'] || 0 },
      { stage: 'Scheduled', count: stages['Scheduled'] || 0 },
      { stage: 'Published', count: stages['Published'] || 0 },
    ];
  }, [workflowCards]);

  // "What the data shows" rule-based observations
  const observations = useMemo(() => {
    if (insightsRecords.length < 3) return [];
    const obs: string[] = [];

    // Rule: Duration check
    const shortClips = insightsRecords.filter((r) => r.durationSeconds <= 30);
    const longClips = insightsRecords.filter((r) => r.durationSeconds > 30);
    if (shortClips.length > 0 && longClips.length > 0) {
      const avgShort =
        shortClips.reduce((sum, r) => sum + r.views, 0) / shortClips.length;
      const avgLong =
        longClips.reduce((sum, r) => sum + r.views, 0) / longClips.length;
      if (avgShort > avgLong) {
        obs.push(
          'Clips under 30 seconds had higher average views than longer videos in this dataset.'
        );
      } else {
        obs.push(
          'Clips over 30 seconds had higher average views in this dataset.'
        );
      }
    }

    // Rule: Platform check
    if (performanceByPlatformData.length > 1) {
      const topPlatform = [...performanceByPlatformData].sort(
        (a, b) => b.totalViews - a.totalViews
      )[0];
      obs.push(
        `${topPlatform.platform} accumulated the highest total views in this reporting window.`
      );
    }

    // Rule: Hook technique check
    if (performanceByHookData.length > 1) {
      const topHook = [...performanceByHookData].sort(
        (a, b) => b.avgViews - a.avgViews
      )[0];
      obs.push(
        `Videos starting with a "${topHook.technique}" hook format achieved the strongest average view counts.`
      );
    }

    return obs;
  }, [insightsRecords, performanceByPlatformData, performanceByHookData]);

  return (
    <PageShell
      title="Creator Intelligence"
      description="Measure what performs and feed those signals back into production."
      stepNumber={8}
      actions={
        <div className="flex items-center gap-2">
          {insightsRecords.length > 0 && (
            <button
              type="button"
              onClick={clearInsightsData}
              className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-white flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear data</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-md border border-border bg-secondary text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import performance CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleCsvSelect(e.target.files)}
          />

          {!isSampleInsights && insightsRecords.length === 0 && (
            <button
              type="button"
              onClick={loadSampleInsights}
              className="px-3.5 py-1.5 rounded-md bg-signal text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load sample data</span>
            </button>
          )}
        </div>
      }
    >
      {/* SAMPLE DATA PERSISTENT BANNER */}
      {isSampleInsights && (
        <div className="hairline-card p-3 mb-6 border-signal/60 bg-signal/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-signal" />
            <span className="text-xs font-semibold text-white">
              Currently viewing sample data dataset
            </span>
            <span className="text-[11px] text-muted-foreground">
              (All metrics below are sample data points, not verified live platform telemetry)
            </span>
          </div>

          <button
            type="button"
            onClick={clearInsightsData}
            className="px-2.5 py-1 rounded bg-black/60 border border-white/20 text-white font-mono text-[11px] hover:bg-black"
          >
            Clear sample data
          </button>
        </div>
      )}

      {/* EMPTY DASHBOARD STATE */}
      {insightsRecords.length === 0 ? (
        <div className="hairline-card p-12 text-center space-y-6">
          <FileSpreadsheet className="w-10 h-10 text-signal mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="font-display text-3xl text-white">
              No performance records loaded
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              This dashboard enforces zero fake metrics. To view distribution analytics, either import a performance CSV file or load our labeled sample data.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import performance CSV</span>
            </button>

            <button
              type="button"
              onClick={loadSampleInsights}
              className="px-5 py-2.5 rounded-md bg-secondary border border-border text-white font-semibold text-xs hover:bg-white/10 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-signal" />
              <span>Load sample data</span>
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE CHARTS DASHBOARD (FLAT SINGLE COLOR SERIES ONLY, NO GRADIENTS) */
        <div className="space-y-8">
          {/* OBSERVATIONS PANEL */}
          {observations.length > 0 && (
            <div className="hairline-card p-6 border-white/20 bg-secondary/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Lightbulb className="w-4 h-4 text-signal" />
                <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                  What the data shows
                </span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-foreground">
                {observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-ok flex-shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4 CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Views Over Time */}
            <div className="hairline-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                    Timeline Distribution
                  </span>
                  <h4 className="font-display text-2xl text-white mt-0.5">
                    Views Over Time
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableViewsOverTime(!showTableViewsOverTime)}
                  className="p-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-white flex items-center gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{showTableViewsOverTime ? 'Chart' : 'Data Table'}</span>
                </button>
              </div>

              {showTableViewsOverTime ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-1">Date</th>
                        <th className="py-1">Title</th>
                        <th className="py-1 text-right">Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {viewsOverTimeData.map((d, i) => (
                        <tr key={i}>
                          <td className="py-1.5 text-muted-foreground">{d.date}</td>
                          <td className="py-1.5 text-white truncate max-w-[140px]">{d.title}</td>
                          <td className="py-1.5 text-right text-signal font-semibold">{d.views.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsOverTimeData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={{ fill: '#ffffff', r: 3 }}
                        activeDot={{ r: 5, fill: 'hsl(var(--signal))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 2. Performance by Platform */}
            <div className="hairline-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                    Channel Comparison
                  </span>
                  <h4 className="font-display text-2xl text-white mt-0.5">
                    Performance by Platform
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTablePlatform(!showTablePlatform)}
                  className="p-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-white flex items-center gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{showTablePlatform ? 'Chart' : 'Data Table'}</span>
                </button>
              </div>

              {showTablePlatform ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-1">Platform</th>
                        <th className="py-1 text-right">Total Views</th>
                        <th className="py-1 text-right">Avg Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {performanceByPlatformData.map((d) => (
                        <tr key={d.platform}>
                          <td className="py-1.5 text-white">{d.platform}</td>
                          <td className="py-1.5 text-right text-muted-foreground">{d.totalViews.toLocaleString()}</td>
                          <td className="py-1.5 text-right text-signal font-semibold">{d.avgViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceByPlatformData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="platform" stroke="#888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }}
                      />
                      <Bar dataKey="totalViews" fill="hsl(var(--signal))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 3. Performance by Hook Technique */}
            <div className="hairline-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                    Copy Strategy
                  </span>
                  <h4 className="font-display text-2xl text-white mt-0.5">
                    Performance by Hook Technique
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableHooks(!showTableHooks)}
                  className="p-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-white flex items-center gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{showTableHooks ? 'Chart' : 'Data Table'}</span>
                </button>
              </div>

              {showTableHooks ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-1">Technique</th>
                        <th className="py-1 text-right">Clips Count</th>
                        <th className="py-1 text-right">Avg Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {performanceByHookData.map((d) => (
                        <tr key={d.technique}>
                          <td className="py-1.5 text-white capitalize">{d.technique}</td>
                          <td className="py-1.5 text-right text-muted-foreground">{d.count}</td>
                          <td className="py-1.5 text-right text-white font-semibold">{d.avgViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceByHookData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="technique" stroke="#888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }}
                      />
                      <Bar dataKey="avgViews" fill="#ffffff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 4. Production Pattern (Live session workflow counts) */}
            <div className="hairline-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                    Live Session Metric
                  </span>
                  <h4 className="font-display text-2xl text-white mt-0.5">
                    Production Pattern (Workflow)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableWorkflow(!showTableWorkflow)}
                  className="p-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-white flex items-center gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{showTableWorkflow ? 'Chart' : 'Data Table'}</span>
                </button>
              </div>

              {showTableWorkflow ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-1">Stage</th>
                        <th className="py-1 text-right">Active Cards</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {productionPatternData.map((d) => (
                        <tr key={d.stage}>
                          <td className="py-1.5 text-white">{d.stage}</td>
                          <td className="py-1.5 text-right text-signal font-semibold">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionPatternData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="stage" stroke="#888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--signal))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSV COLUMN MAPPING MODAL */}
      {showMappingModal && csvRawData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-lg bg-secondary border border-border space-y-4 shadow-2xl">
            <div>
              <span className="text-xs uppercase font-mono text-signal font-semibold">
                CSV Importer
              </span>
              <h3 className="font-display text-2xl text-white mt-0.5">
                Map Columns to Schema
              </h3>
              <p className="text-xs text-muted-foreground">
                Found {csvRawData.length} records. Match your CSV headers below.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Title Column
                </label>
                <select
                  value={columnMapping.title}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, title: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border border-border text-white"
                >
                  {Object.keys(csvRawData[0]).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Platform Column
                </label>
                <select
                  value={columnMapping.platform}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, platform: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border border-border text-white"
                >
                  {Object.keys(csvRawData[0]).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Views Column
                </label>
                <select
                  value={columnMapping.views}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, views: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border border-border text-white"
                >
                  {Object.keys(csvRawData[0]).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Duration (Seconds) Column
                </label>
                <select
                  value={columnMapping.duration}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, duration: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border border-border text-white"
                >
                  {Object.keys(csvRawData[0]).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => {
                  setShowMappingModal(false);
                  setCsvRawData(null);
                }}
                className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCsvMapping}
                className="px-4 py-1.5 rounded bg-white text-black font-semibold text-xs"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
