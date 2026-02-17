"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MemoryNode, MemoryEdge } from "@/lib/types";
import { MemoryNodeCard } from "./MemoryNodeCard";

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface MemoryGraphCanvasProps {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  linkMode: boolean;
  linkSourceId: string | null;
  searchQuery: string;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onCreateEdge: (sourceId: string, targetId: string) => void;
  onSetLinkSource: (nodeId: string | null) => void;
  onDragNodeStart: (nodeId: string) => void;
}

export function MemoryGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  linkMode,
  linkSourceId,
  searchQuery,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onCreateEdge,
  onSetLinkSource,
  onDragNodeStart,
}: MemoryGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Filter nodes based on search
  const filteredNodes = searchQuery
    ? nodes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : nodes;

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Get child count for each node
  const getChildCount = (nodeId: string) => nodes.filter(n => n.parentId === nodeId).length;

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(viewport.scale * delta, 0.25), 2);

      // Zoom towards mouse position
      const scaleChange = newScale / viewport.scale;
      const newX = mouseX - (mouseX - viewport.x) * scaleChange;
      const newY = mouseY - (mouseY - viewport.y) * scaleChange;

      setViewport({ x: newX, y: newY, scale: newScale });
    }
  }, [viewport]);

  // Handle pan start (on canvas background)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan if clicking directly on the canvas background
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).closest('svg[class*="absolute inset-0"]')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  }, [viewport]);

  // Handle node drag start (from node card)
  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const mouseY = (e.clientY - rect.top - viewport.y) / viewport.scale;

    setDraggedNodeId(nodeId);
    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
    onDragNodeStart(nodeId);
  }, [nodes, viewport, onDragNodeStart]);

  // Handle mouse move for both panning and node dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewport((v) => ({
        ...v,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }

    if (draggedNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - viewport.x) / viewport.scale - dragOffset.x;
      const y = (e.clientY - rect.top - viewport.y) / viewport.scale - dragOffset.y;

      onMoveNode(draggedNodeId, Math.round(x), Math.round(y));
    }
  }, [isPanning, panStart, draggedNodeId, dragOffset, viewport, onMoveNode]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedNodeId(null);
  }, []);

  // Handle node click for link mode
  const handleNodeClick = useCallback((nodeId: string) => {
    if (linkMode) {
      if (!linkSourceId) {
        onSetLinkSource(nodeId);
      } else if (linkSourceId !== nodeId) {
        onCreateEdge(linkSourceId, nodeId);
        onSetLinkSource(null);
      }
    } else {
      onSelectNode(nodeId);
      onSelectEdge(null);
    }
  }, [linkMode, linkSourceId, onSetLinkSource, onCreateEdge, onSelectNode, onSelectEdge]);

  // Handle edge click
  const handleEdgeClick = useCallback((edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectEdge(edgeId);
    onSelectNode(null);
  }, [onSelectEdge, onSelectNode]);

  // Handle canvas click to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectNode(null);
      onSelectEdge(null);
      if (linkMode) {
        onSetLinkSource(null);
      }
    }
  }, [onSelectNode, onSelectEdge, linkMode, onSetLinkSource]);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (nodes.length === 0) return;

    const padding = 50;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + 200));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + 150));

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1);

    const centerX = (rect.width - contentWidth * scale) / 2 - minX * scale + padding * scale;
    const centerY = (rect.height - contentHeight * scale) / 2 - minY * scale + padding * scale;

    setViewport({ x: centerX, y: centerY, scale });
  }, [nodes]);

  // Zoom controls
  const zoomIn = () => setViewport((v) => ({ ...v, scale: Math.min(v.scale * 1.2, 2) }));
  const zoomOut = () => setViewport((v) => ({ ...v, scale: Math.max(v.scale / 1.2, 0.25) }));
  const resetZoom = () => setViewport({ x: 0, y: 0, scale: 1 });

  // Get node position by id
  const getNodeCenter = (nodeId: string): { x: number; y: number } | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return { x: node.x + 100, y: node.y + 60 }; // Center of 200x120 node
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSelectNode(null);
        onSelectEdge(null);
        onSetLinkSource(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelectNode, onSelectEdge, onSetLinkSource]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <div className="border-t border-gray-200 my-1" />
        <button
          onClick={fitToScreen}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Fit to screen"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={resetZoom}
          className="p-2 hover:bg-gray-100 rounded transition-colors text-xs text-gray-500"
          aria-label="Reset zoom"
        >
          {Math.round(viewport.scale * 100)}%
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{ touchAction: "none" }}
      >
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern
              id="grid"
              width={20 * viewport.scale}
              height={20 * viewport.scale}
              patternUnits="userSpaceOnUse"
              x={viewport.x % (20 * viewport.scale)}
              y={viewport.y % (20 * viewport.scale)}
            >
              <circle cx="1" cy="1" r="1" fill="#e5e7eb" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Transform container */}
        <div
          className="absolute"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Edges SVG */}
          <svg
            className="absolute overflow-visible pointer-events-none"
            style={{ width: 1, height: 1 }}
          >
            {edges.map((edge) => {
              const sourceCenter = getNodeCenter(edge.source);
              const targetCenter = getNodeCenter(edge.target);
              if (!sourceCenter || !targetCenter) return null;

              const isSelected = selectedEdgeId === edge.id;
              const isFiltered = !filteredNodeIds.has(edge.source) || !filteredNodeIds.has(edge.target);

              return (
                <g key={edge.id} style={{ opacity: isFiltered ? 0.2 : 1 }}>
                  {/* Clickable area */}
                  <line
                    x1={sourceCenter.x}
                    y1={sourceCenter.y}
                    x2={targetCenter.x}
                    y2={targetCenter.y}
                    stroke="transparent"
                    strokeWidth={20}
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => handleEdgeClick(edge.id, e)}
                  />
                  {/* Visible line */}
                  <line
                    x1={sourceCenter.x}
                    y1={sourceCenter.y}
                    x2={targetCenter.x}
                    y2={targetCenter.y}
                    stroke={isSelected ? "#1f2937" : "#9ca3af"}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={edge.label ? "none" : "4 4"}
                    className="transition-all duration-150"
                  />
                  {/* Label */}
                  {edge.label && (
                    <text
                      x={(sourceCenter.x + targetCenter.x) / 2}
                      y={(sourceCenter.y + targetCenter.y) / 2 - 8}
                      textAnchor="middle"
                      className="text-[10px] fill-gray-500 pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Link mode preview line */}
            {linkMode && linkSourceId && (
              <line
                x1={getNodeCenter(linkSourceId)?.x || 0}
                y1={getNodeCenter(linkSourceId)?.y || 0}
                x2={getNodeCenter(linkSourceId)?.x || 0}
                y2={getNodeCenter(linkSourceId)?.y || 0}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 4"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isFiltered = !filteredNodeIds.has(node.id);
            const childCount = getChildCount(node.id);

            return (
              <div
                key={node.id}
                style={{ opacity: isFiltered ? 0.3 : 1, transition: "opacity 0.2s" }}
              >
                <MemoryNodeCard
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isLinkSource={linkSourceId === node.id}
                  onSelect={() => handleNodeClick(node.id)}
                  onDragStart={() => {}}
                  onMouseDownForDrag={(e) => handleNodeMouseDown(node.id, e)}
                  onPositionChange={(x, y) => onMoveNode(node.id, x, y)}
                  childCount={childCount}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Link mode indicator */}
      {linkMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {linkSourceId ? "Click another node to create link" : "Click a node to start linking"}
        </div>
      )}

      {/* Mini-map */}
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-white/80 border border-gray-200 rounded-lg overflow-hidden">
        <div className="w-full h-full relative">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute w-2 h-1.5 bg-gray-400 rounded-sm"
              style={{
                left: `${(node.x / 1000) * 100}%`,
                top: `${(node.y / 600) * 100}%`,
              }}
            />
          ))}
          {/* Viewport indicator */}
          <div
            className="absolute border border-gray-900 bg-gray-900/10"
            style={{
              left: `${(-viewport.x / viewport.scale / 1000) * 100}%`,
              top: `${(-viewport.y / viewport.scale / 600) * 100}%`,
              width: `${(100 / viewport.scale)}%`,
              height: `${(100 / viewport.scale)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
