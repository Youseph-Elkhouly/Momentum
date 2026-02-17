"use client";

import { useState, useRef, useEffect } from "react";
import type { MemoryNode, MemoryEdge, MemoryNodeType, MemoryFile } from "@/lib/types";
import { saveFile, getFile, deleteFile, createBlobUrl, revokeBlobUrl } from "@/lib/storage/fileStore";

const NODE_TYPES: { value: MemoryNodeType; label: string }[] = [
  { value: "fact", label: "Fact" },
  { value: "decision", label: "Decision" },
  { value: "preference", label: "Preference" },
  { value: "risk", label: "Risk" },
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "file", label: "File" },
];

interface MemoryInspectorProps {
  selectedNode: MemoryNode | null;
  selectedEdge: MemoryEdge | null;
  onUpdateNode: (nodeId: string, updates: Partial<MemoryNode>) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<MemoryEdge>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClose: () => void;
}

export function MemoryInspector({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}: MemoryInspectorProps) {
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  // Load blob URLs for files
  useEffect(() => {
    if (!selectedNode) return;

    const loadFileUrls = async () => {
      const urls: Record<string, string> = {};
      for (const file of node.files) {
        try {
          const storedFile = await getFile(file.id);
          if (storedFile) {
            urls[file.id] = createBlobUrl(storedFile.blob);
          }
        } catch (err) {
          console.error("Failed to load file:", err);
        }
      }
      setFileUrls(urls);
    };

    loadFileUrls();

    return () => {
      // Cleanup blob URLs
      Object.values(fileUrls).forEach(revokeBlobUrl);
    };
  }, [selectedNode?.id, selectedNode?.files.length]);

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Select a node or edge to inspect
      </div>
    );
  }

  // Edge Inspector
  if (selectedEdge) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Edge Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
            <input
              type="text"
              value={selectedEdge.label || ""}
              onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value || null })}
              placeholder="e.g., depends on, supports..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <button
            onClick={() => onDeleteEdge(selectedEdge.id)}
            className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete Edge
          </button>
        </div>
      </div>
    );
  }

  // Node Inspector - at this point selectedNode is guaranteed to be non-null
  const node = selectedNode!;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = [...node.tags, tagInput.trim()];
    onUpdateNode(node.id, { tags: newTags });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = node.tags.filter((t) => t !== tag);
    onUpdateNode(node.id, { tags: newTags });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles: MemoryFile[] = [];

    for (const file of Array.from(e.target.files)) {
      try {
        const stored = await saveFile(file);
        newFiles.push({
          id: stored.id,
          name: stored.name,
          type: stored.type,
          size: stored.size,
          createdAt: stored.createdAt,
        });
      } catch (err) {
        console.error("Failed to save file:", err);
      }
    }

    if (newFiles.length > 0) {
      onUpdateNode(node.id, {
        files: [...node.files, ...newFiles],
      });
    }

    e.target.value = "";
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      onUpdateNode(node.id, {
        files: node.files.filter((f) => f.id !== fileId),
      });
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isMediaFile = (type: string): boolean => {
    return type.startsWith("audio/") || type.startsWith("video/");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Node Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={node.type}
            onChange={(e) => onUpdateNode(node.id, { type: e.target.value as MemoryNodeType })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {NODE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input
            type="text"
            value={node.title}
            onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
          <textarea
            value={node.content}
            onChange={(e) => onUpdateNode(node.id, { content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {node.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500" aria-label={`Remove tag ${tag}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="Add tag..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Add
            </button>
          </div>
        </div>

        {/* Pinned */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pinned"
            checked={node.pinned}
            onChange={(e) => onUpdateNode(node.id, { pinned: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <label htmlFor="pinned" className="text-sm text-gray-700">
            Pin this node
          </label>
        </div>

        {/* Files */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500">Attachments</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              + Add file
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.mp3,.mp4,.wav,.webm,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {node.files.length === 0 ? (
            <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-400">
              No files attached
            </div>
          ) : (
            <div className="space-y-2">
              {node.files.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-2 bg-gray-50">
                    <span className="text-lg">
                      {file.type.startsWith("audio/") ? "🎵" : file.type.startsWith("video/") ? "🎬" : file.type.startsWith("image/") ? "🖼️" : "📄"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 truncate">{file.name}</div>
                      <div className="text-[10px] text-gray-400">{formatFileSize(file.size)}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      aria-label="Delete file"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Media preview */}
                  {fileUrls[file.id] && isMediaFile(file.type) && (
                    <div className="p-2">
                      {file.type.startsWith("audio/") ? (
                        <audio controls className="w-full h-8" src={fileUrls[file.id]} />
                      ) : (
                        <video controls className="w-full max-h-32 rounded" src={fileUrls[file.id]} />
                      )}
                    </div>
                  )}

                  {/* Open button for non-media */}
                  {fileUrls[file.id] && !isMediaFile(file.type) && (
                    <div className="p-2 border-t border-gray-100">
                      <a
                        href={fileUrls[file.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Open file →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDeleteNode(node.id)}
          className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
