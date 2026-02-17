"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import type { MemoryNode, MemoryEdge, MemoryNodeType, MemoryFile } from "@/lib/types";
import { getGraph, saveGraph, addNode, updateNode, deleteNode, addEdge, updateEdge, deleteEdge } from "@/lib/storage/graphStore";
import { saveFile } from "@/lib/storage/fileStore";
import { MemoryGraphCanvas } from "@/components/memory/MemoryGraphCanvas";
import { MemoryInspector } from "@/components/memory/MemoryInspector";

const NODE_TYPES: { value: MemoryNodeType; label: string; icon: string }[] = [
  { value: "fact", label: "Fact", icon: "📝" },
  { value: "decision", label: "Decision", icon: "⚖️" },
  { value: "preference", label: "Preference", icon: "⭐" },
  { value: "risk", label: "Risk", icon: "⚠️" },
  { value: "note", label: "Note", icon: "📌" },
  { value: "link", label: "Link", icon: "🔗" },
  { value: "file", label: "File", icon: "📎" },
];

export default function MemoryGraphPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [edges, setEdges] = useState<MemoryEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewNodeModal, setShowNewNodeModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<MemoryNodeType>("note");
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load graph on mount
  useEffect(() => {
    const graph = getGraph(projectId);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [projectId]);

  // Save graph when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveGraph(projectId, { nodes, edges });
    }
  }, [projectId, nodes, edges]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) || null : null;

  // Node operations
  const handleCreateNode = useCallback(() => {
    if (!newNodeTitle.trim()) return;

    // Place new node in a visible position
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;

    const newNode = addNode(projectId, {
      title: newNodeTitle.trim(),
      content: "",
      type: newNodeType,
      tags: [],
      pinned: false,
      x,
      y,
      files: [],
      parentId: null,
      collapsed: false,
    });

    setNodes(prev => [...prev, newNode]);
    setNewNodeTitle("");
    setNewNodeType("note");
    setShowNewNodeModal(false);
    setSelectedNodeId(newNode.id);
  }, [projectId, newNodeTitle, newNodeType]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<MemoryNode>) => {
    const updated = updateNode(projectId, nodeId, updates);
    if (updated) {
      setNodes(prev => prev.map(n => n.id === nodeId ? updated : n));
    }
  }, [projectId]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    deleteNode(projectId, nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [projectId]);

  const handleMoveNode = useCallback((nodeId: string, x: number, y: number) => {
    handleUpdateNode(nodeId, { x, y });
  }, [handleUpdateNode]);

  // Edge operations
  const handleCreateEdge = useCallback((sourceId: string, targetId: string) => {
    const newEdge = addEdge(projectId, sourceId, targetId, null);
    setEdges(prev => {
      // Check for duplicates
      if (prev.some(e => e.source === sourceId && e.target === targetId)) {
        return prev;
      }
      return [...prev, newEdge];
    });
  }, [projectId]);

  const handleUpdateEdge = useCallback((edgeId: string, updates: Partial<MemoryEdge>) => {
    const updated = updateEdge(projectId, edgeId, updates);
    if (updated) {
      setEdges(prev => prev.map(e => e.id === edgeId ? updated : e));
    }
  }, [projectId]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    deleteEdge(projectId, edgeId);
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setSelectedEdgeId(null);
  }, [projectId]);

  // File upload for quick node creation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    for (const file of Array.from(e.target.files)) {
      try {
        const stored = await saveFile(file);
        const fileData: MemoryFile = {
          id: stored.id,
          name: stored.name,
          type: stored.type,
          size: stored.size,
          createdAt: stored.createdAt,
        };

        // Create a file node
        const x = 100 + Math.random() * 300;
        const y = 100 + Math.random() * 300;

        const newNode = addNode(projectId, {
          title: file.name,
          content: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          type: "file",
          tags: [file.type.split("/")[0]],
          pinned: false,
          x,
          y,
          files: [fileData],
          parentId: null,
          collapsed: false,
        });

        setNodes(prev => [...prev, newNode]);
      } catch (err) {
        console.error("Failed to upload file:", err);
      }
    }

    e.target.value = "";
  };

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    const count = nodes.length;
    if (count === 0) return;

    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 250;

    const updatedNodes = nodes.map((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        ...node,
        x: 50 + col * spacing,
        y: 50 + row * spacing,
        updated_at: new Date().toISOString(),
      };
    });

    setNodes(updatedNodes);
    saveGraph(projectId, { nodes: updatedNodes, edges });
  }, [nodes, edges, projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node/edge
      if ((e.key === "Delete" || e.key === "Backspace") && !e.target?.toString().includes("Input")) {
        if (selectedNodeId) {
          handleDeleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          handleDeleteEdge(selectedEdgeId);
        }
      }
      // Toggle link mode with L
      if (e.key === "l" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setLinkMode(prev => !prev);
          setLinkSourceId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
        <button
          onClick={() => setShowNewNodeModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Node
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.mp3,.mp4,.wav,.webm,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => {
            setLinkMode(!linkMode);
            setLinkSourceId(null);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
            linkMode
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {linkMode ? "Exit Link Mode" : "Link Mode"}
        </button>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-48 pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          onClick={handleAutoLayout}
          className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          title="Auto-layout"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </button>

        <div className="text-xs text-gray-400">
          {nodes.length} nodes · {edges.length} edges
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Canvas */}
        <div className="flex-1 relative">
          <MemoryGraphCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            linkMode={linkMode}
            linkSourceId={linkSourceId}
            searchQuery={searchQuery}
            onSelectNode={setSelectedNodeId}
            onSelectEdge={setSelectedEdgeId}
            onMoveNode={handleMoveNode}
            onCreateEdge={handleCreateEdge}
            onSetLinkSource={setLinkSourceId}
            onDragNodeStart={() => {}}
          />
        </div>

        {/* Inspector Panel */}
        <div className="w-80 border-l border-gray-200 bg-white">
          <MemoryInspector
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateNode={handleUpdateNode}
            onUpdateEdge={handleUpdateEdge}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          />
        </div>
      </div>

      {/* New Node Modal */}
      {showNewNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewNodeModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Node</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {NODE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNewNodeType(t.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                        newNodeType === t.value
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[10px] text-gray-600">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                  placeholder="Enter node title..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewNodeModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNode}
                disabled={!newNodeTitle.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
