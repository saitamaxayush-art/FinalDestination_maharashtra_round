import React, { useState, useRef } from 'react';
import { PageShell } from '../components/shared/PageShell';
import { useStore } from '../store/useStore';
import { Asset, AssetType } from '../types';
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  Folder as FolderIcon,
  Trash2,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Search,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Edit2,
  Check,
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const {
    assets,
    folders,
    selectedAssetId,
    deletedAssetBackup,
    addAsset,
    deleteAsset,
    undoDeleteAsset,
    updateAssetTags,
    renameAsset,
    moveAssetToFolder,
    createFolder,
    setSelectedAssetId,
    loadSampleAssets,
    clearSampleAssets,
  } = useStore();

  const [activeFolderId, setActiveFolderId] = useState<string | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rename asset in place state
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      let detectedType: AssetType = 'image';
      if (file.type.startsWith('video/')) detectedType = 'video';
      else if (file.type.startsWith('audio/')) detectedType = 'audio';

      // Read metadata & create canvas preview if possible
      let resolution: string | undefined;
      let duration: number | undefined;
      let thumbnail: string | undefined;

      if (detectedType === 'video') {
        try {
          const video = document.createElement('video');
          video.src = objectUrl;
          video.muted = true;
          await new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(true);
            video.onerror = () => resolve(false);
          });
          duration = Math.round(video.duration);
          resolution = `${video.videoWidth}x${video.videoHeight}`;

          // Draw frame to canvas for thumbnail
          video.currentTime = Math.min(1, video.duration / 2);
          await new Promise((resolve) => {
            video.onseeked = () => resolve(true);
          });
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 320, 180);
            thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          }
        } catch {
          // ignore error
        }
      }

      const newAsset: Asset = {
        id: `usr_${Date.now()}_${i}`,
        name: file.name,
        type: detectedType,
        size: file.size,
        duration,
        resolution,
        url: objectUrl,
        folderId: activeFolderId !== 'all' ? activeFolderId : undefined,
        tags: [detectedType.toUpperCase()],
        createdAt: new Date().toISOString().split('T')[0],
        thumbnail,
      };

      addAsset(newAsset);
    }

    setToastMessage(`Uploaded ${files.length} asset(s) successfully.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered and sorted assets
  const filteredAssets = assets
    .filter((asset) => {
      const matchesFolder = activeFolderId === 'all' || asset.folderId === activeFolderId;
      const matchesType = selectedType === 'all' || asset.type === selectedType;
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFolder && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec?: number) => {
    if (!sec) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSelectAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    selectedAssetIds.forEach((id) => deleteAsset(id));
    setToastMessage(`Deleted ${selectedAssetIds.length} asset(s).`);
    setSelectedAssetIds([]);
  };

  const handleSaveRename = (id: string) => {
    if (renameValue.trim()) {
      renameAsset(id, renameValue.trim());
    }
    setRenamingAssetId(null);
  };

  const hasSampleAssets = assets.some((a) => a.isSample);

  return (
    <PageShell
      title="Asset Management"
      description="Ingest, tag and organize raw footage, voice tracks and production stills. All processing stays local."
      stepNumber={1}
      nextPageTitle="Scripts"
      nextPagePath="/scripts"
      carryOverText={`${assets.length} media assets in library ready for script mapping and footage detection.`}
      actions={
        <div className="flex items-center gap-2">
          {hasSampleAssets ? (
            <button
              type="button"
              onClick={clearSampleAssets}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-border bg-secondary text-muted-foreground hover:text-white transition-colors"
            >
              Clear samples
            </button>
          ) : (
            <button
              type="button"
              onClick={loadSampleAssets}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-signal/60 bg-signal/15 text-signal hover:bg-signal/25 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load sample project</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-1.5 rounded-md bg-white text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-md bg-secondary border border-border text-white text-xs shadow-2xl flex items-center gap-3">
          <span>{toastMessage}</span>
          {deletedAssetBackup && (
            <button
              type="button"
              onClick={() => {
                undoDeleteAsset();
                setToastMessage(null);
              }}
              className="px-2 py-1 rounded-md bg-white text-black font-semibold text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          )}
        </div>
      )}

      {/* Floating Action Bar for Multi-Select */}
      {selectedAssetIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg bg-black/90 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center gap-4 text-xs">
          <span className="font-semibold text-white">
            {selectedAssetIds.length} asset(s) selected
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-3 py-1 rounded-md bg-warn/20 border border-warn text-warn hover:bg-warn/30 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete selected</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedAssetIds([])}
            className="text-muted-foreground hover:text-white"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Main layout: Folder sidebar + Library grid/list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* FOLDERS SIDEBAR */}
        <div className="hairline-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Folders
            </span>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isCreatingFolder && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createFolder(newFolderName);
                    setNewFolderName('');
                    setIsCreatingFolder(false);
                  }
                }}
                className="w-full px-2.5 py-1 text-xs rounded-md bg-secondary border border-border text-white focus:outline-none focus:border-white/40"
              />
            </div>
          )}

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveFolderId('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                activeFolderId === 'all'
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderIcon className="w-3.5 h-3.5 text-signal" />
                <span>All Assets</span>
              </div>
              <span className="text-[11px] font-mono opacity-80">{assets.length}</span>
            </button>

            {folders.map((folder) => {
              const count = assets.filter((a) => a.folderId === folder.id).length;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setActiveFolderId(folder.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const assetId = e.dataTransfer.getData('text/plain');
                    if (assetId) moveAssetToFolder(assetId, folder.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    activeFolderId === folder.id
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FolderIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <span className="text-[11px] font-mono opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ASSET LIBRARY AREA */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls: Search, Type filter, Sort, View mode toggle */}
          <div className="hairline-card p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assets or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-secondary/80 border border-border text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {/* Type filter segmented buttons */}
              <div className="flex items-center bg-secondary/80 p-0.5 rounded-md border border-border text-xs">
                {(['all', 'video', 'audio', 'image'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                      selectedType === t
                        ? 'bg-white text-black font-semibold'
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort and View Mode */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary/80 px-2 py-1 rounded-md border border-border text-xs text-muted-foreground">
                <ArrowUpDown className="w-3.5 h-3.5 text-signal" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  <option value="date" className="bg-secondary text-white">Date added</option>
                  <option value="name" className="bg-secondary text-white">Name</option>
                  <option value="size" className="bg-secondary text-white">Size</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-border/80 hover:border-white/40 rounded-lg p-6 text-center cursor-pointer transition-colors bg-secondary/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-8 h-8 text-signal mx-auto mb-2 opacity-80" />
            <div className="text-xs font-semibold text-white">
              Drop media files here or click to browse
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Supports MP4, MOV, WAV, MP3, PNG, JPG. Generated thumbnails and audio waveforms remain local.
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredAssets.length === 0 ? (
            <div className="hairline-card p-12 text-center space-y-4">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto text-muted-foreground opacity-40"
              >
                <rect x="10" y="16" width="60" height="48" rx="6" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="32 30 52 40 32 50 32 30" fill="currentColor" opacity="0.6" />
                <circle cx="20" cy="26" r="3" fill="currentColor" />
                <circle cx="28" cy="26" r="3" fill="currentColor" />
              </svg>
              <div className="space-y-1">
                <h4 className="font-display text-2xl text-white">No assets found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Drag and drop files to populate this workspace, or load sample project assets to explore the pipeline immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSampleAssets}
                className="px-4 py-2 rounded-md bg-signal text-black font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load sample project</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const isSelectedForBulk = selectedAssetIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', asset.id)}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`hairline-card p-3 space-y-3 cursor-pointer transition-all border ${
                      selectedAssetId === asset.id ? 'border-signal bg-secondary' : 'hover:border-white/40'
                    }`}
                  >
                    {/* Thumbnail / Waveform frame */}
                    <div className="w-full h-32 rounded-md bg-black/60 relative overflow-hidden flex items-center justify-center border border-border/60">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                      ) : asset.type === 'video' ? (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Film className="w-8 h-8 text-signal opacity-80" />
                          <span className="text-[10px] font-mono">1080p Video</span>
                        </div>
                      ) : asset.type === 'audio' ? (
                        <div className="w-full h-full flex items-center justify-center px-4 gap-1">
                          {[40, 70, 30, 90, 60, 45, 80, 20, 95, 60, 30, 75, 50, 85].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 bg-signal/70 rounded-sm"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <ImageIcon className="w-8 h-8 text-white/60" />
                          <span className="text-[10px] font-mono">Image Asset</span>
                        </div>
                      )}

                      {/* Multi-select Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectAsset(asset.id, e)}
                        className={`absolute top-2 left-2 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors z-20 ${
                          isSelectedForBulk
                            ? 'bg-signal border-signal text-black'
                            : 'bg-black/60 border-white/40 text-transparent hover:border-white'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>

                      {/* Badge: Sample */}
                      {asset.isSample && (
                        <span className="absolute top-2 left-8 px-1.5 py-0.5 rounded-md bg-white/20 text-white font-mono text-[10px] uppercase border border-white/20">
                          Sample
                        </span>
                      )}

                      {/* Duration / resolution tag */}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px]">
                        {asset.duration ? formatSeconds(asset.duration) : asset.resolution || 'Graphic'}
                      </span>
                    </div>

                    {/* Asset Details & Rename */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        {renamingAssetId === asset.id ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(asset.id);
                              }}
                              className="px-1.5 py-0.5 text-xs bg-background border border-signal text-white rounded-md w-full"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(asset.id)}
                              className="p-1 rounded bg-signal text-black"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                              {asset.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingAssetId(asset.id);
                                setRenameValue(asset.name);
                              }}
                              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white"
                              title="Rename asset"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span>{formatBytes(asset.size)}</span>
                        <span>{asset.createdAt}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-md bg-white/5 border border-border text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="hairline-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/80 border-b border-border text-muted-foreground font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3 w-8"></th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Duration / Spec</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAssets.map((asset) => {
                    const isSelectedForBulk = selectedAssetIds.includes(asset.id);
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`cursor-pointer transition-colors ${
                          selectedAssetId === asset.id ? 'bg-signal/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="p-3" onClick={(e) => toggleSelectAsset(asset.id, e)}>
                          <div
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                              isSelectedForBulk
                                ? 'bg-signal border-signal text-black'
                                : 'border-border text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-white truncate max-w-[200px]">
                          {asset.name}
                          {asset.isSample && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-muted-foreground text-[10px] font-mono">
                              Sample
                            </span>
                          )}
                        </td>
                        <td className="p-3 capitalize text-muted-foreground">{asset.type}</td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {asset.duration ? formatSeconds(asset.duration) : asset.resolution || '-'}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{formatBytes(asset.size)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {asset.tags.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-border text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAsset(asset.id);
                              setToastMessage(`Deleted ${asset.name}`);
                            }}
                            className="p-1 rounded-md hover:bg-warn/20 text-muted-foreground hover:text-warn transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ASSET PREVIEW DRAWER */}
      {selectedAsset && (
        <div className="mt-8 hairline-card p-6 border-signal/40 bg-secondary/90">
          <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-signal font-semibold">
                Asset Inspector
              </span>
              <span className="text-sm font-semibold text-white">{selectedAsset.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAssetId(null)}
              className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Player / Zoom Container */}
            <div className="w-full h-56 rounded-md bg-black border border-border flex items-center justify-center overflow-hidden relative">
              {selectedAsset.url ? (
                selectedAsset.type === 'video' ? (
                  <video src={selectedAsset.url} controls className="w-full h-full object-contain" />
                ) : selectedAsset.type === 'audio' ? (
                  <audio src={selectedAsset.url} controls className="w-3/4" />
                ) : (
                  <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Play className="w-10 h-10 text-signal mx-auto opacity-80" />
                  <span className="text-xs text-white font-mono block">
                    Sample Media Mock ({selectedAsset.type.toUpperCase()})
                  </span>
                  <span className="text-[11px] text-muted-foreground/70 block">
                    Upload a real file to trigger native HTML5 video/audio playback.
                  </span>
                </div>
              )}
            </div>

            {/* Real Metadata & Edit Tags */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-md bg-white/5 border border-border">
                  <span className="text-muted-foreground block mb-0.5">File size</span>
                  <span className="font-mono font-semibold text-white">{formatBytes(selectedAsset.size)}</span>
                </div>
                <div className="p-2.5 rounded-md bg-white/5 border border-border">
                  <span className="text-muted-foreground block mb-0.5">Duration</span>
                  <span className="font-mono font-semibold text-white">
                    {selectedAsset.duration ? formatSeconds(selectedAsset.duration) : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-white/5 border border-border">
                  <span className="text-muted-foreground block mb-0.5">Resolution</span>
                  <span className="font-mono font-semibold text-white">{selectedAsset.resolution || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-md bg-white/5 border border-border">
                  <span className="text-muted-foreground block mb-0.5">Format</span>
                  <span className="font-mono font-semibold text-white uppercase">{selectedAsset.type}</span>
                </div>
              </div>

              {/* Tag Editing */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                  Tags (press enter to add)
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {selectedAsset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-white/10 border border-border text-xs text-white flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateAssetTags(
                            selectedAsset.id,
                            selectedAsset.tags.filter((t) => t !== tag)
                          )
                        }
                        className="hover:text-warn"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val && !selectedAsset.tags.includes(val)) {
                          updateAssetTags(selectedAsset.id, [...selectedAsset.tags, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs text-white focus:outline-none focus:border-white/40 w-24"
                  />
                </div>
              </div>

              {/* Delete action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    deleteAsset(selectedAsset.id);
                    setSelectedAssetId(null);
                    setToastMessage(`Deleted ${selectedAsset.name}`);
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-warn/15 border border-warn text-warn text-xs font-semibold hover:bg-warn/25 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete asset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
