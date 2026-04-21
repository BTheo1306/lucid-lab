"use client"

import { motion, type PanInfo } from "framer-motion"
import type React from "react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MessageCircle,
  FileText,
  GitBranch,
  Bell,
  PenTool,
  Database,
  Plus,
  ArrowRight,
  Zap,
  Mail,
} from "lucide-react"

// Interfaces
interface WorkflowNode {
  id: string
  type: "trigger" | "action" | "condition"
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  position: { x: number; y: number }
}

interface WorkflowConnection {
  from: string
  to: string
}

// Constants
const NODE_WIDTH = 210
const NODE_HEIGHT = 100

const nodeTemplates: Omit<WorkflowNode, "id" | "position">[] = [
  {
    type: "trigger",
    title: "WhatsApp",
    description: "Message reçu d'un contact",
    icon: MessageCircle,
    color: "emerald",
  },
  {
    type: "action",
    title: "Notion",
    description: "Créer une fiche client",
    icon: FileText,
    color: "blue",
  },
  {
    type: "condition",
    title: "n8n Logic",
    description: "Filtrer par priorité",
    icon: GitBranch,
    color: "amber",
  },
  {
    type: "action",
    title: "Slack",
    description: "Notifier l'équipe",
    icon: Bell,
    color: "purple",
  },
  {
    type: "action",
    title: "Figma",
    description: "Générer un brief design",
    icon: PenTool,
    color: "pink",
  },
  {
    type: "action",
    title: "CRM",
    description: "Mettre à jour le pipeline",
    icon: Database,
    color: "indigo",
  },
  {
    type: "action",
    title: "Email",
    description: "Envoyer un suivi automatique",
    icon: Mail,
    color: "rose",
  },
  {
    type: "trigger",
    title: "Zapier / Make",
    description: "Déclencher un scénario",
    icon: Zap,
    color: "orange",
  },
]

const initialNodes: WorkflowNode[] = [
  {
    id: "node-1",
    type: "trigger",
    title: "WhatsApp",
    description: "Message reçu d'un contact",
    icon: MessageCircle,
    color: "emerald",
    position: { x: 40, y: 120 },
  },
  {
    id: "node-2",
    type: "action",
    title: "Notion",
    description: "Créer une fiche client",
    icon: FileText,
    color: "blue",
    position: { x: 300, y: 120 },
  },
  {
    id: "node-3",
    type: "condition",
    title: "n8n Logic",
    description: "Filtrer par priorité",
    icon: GitBranch,
    color: "amber",
    position: { x: 560, y: 120 },
  },
  {
    id: "node-4",
    type: "action",
    title: "Slack",
    description: "Notifier l'équipe commerciale",
    icon: Bell,
    color: "purple",
    position: { x: 820, y: 60 },
  },
  {
    id: "node-5",
    type: "action",
    title: "Email",
    description: "Envoyer un suivi automatique",
    icon: Mail,
    color: "rose",
    position: { x: 820, y: 200 },
  },
]

const initialConnections: WorkflowConnection[] = [
  { from: "node-1", to: "node-2" },
  { from: "node-2", to: "node-3" },
  { from: "node-3", to: "node-4" },
  { from: "node-3", to: "node-5" },
]

const colorClasses: Record<string, string> = {
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  blue: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  purple: "border-purple-400/40 bg-purple-400/10 text-purple-400",
  pink: "border-pink-400/40 bg-pink-400/10 text-pink-400",
  indigo: "border-indigo-400/40 bg-indigo-400/10 text-indigo-400",
  rose: "border-rose-400/40 bg-rose-400/10 text-rose-400",
  orange: "border-orange-400/40 bg-orange-400/10 text-orange-400",
}

// Connection Line Component
function WorkflowConnectionLine({
  from,
  to,
  nodes,
}: {
  from: string
  to: string
  nodes: WorkflowNode[]
}) {
  const fromNode = nodes.find((n) => n.id === from)
  const toNode = nodes.find((n) => n.id === to)
  if (!fromNode || !toNode) return null

  const startX = fromNode.position.x + NODE_WIDTH
  const startY = fromNode.position.y + NODE_HEIGHT / 2
  const endX = toNode.position.x
  const endY = toNode.position.y + NODE_HEIGHT / 2

  const cp1X = startX + (endX - startX) * 0.5
  const cp2X = endX - (endX - startX) * 0.5

  const path = `M${startX},${startY} C${cp1X},${startY} ${cp2X},${endY} ${endX},${endY}`

  return (
    <path
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeDasharray="8,6"
      strokeLinecap="round"
      opacity={0.3}
      className="text-foreground"
    />
  )
}

// Main Component
export function WorkflowBlock() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes)
  const [connections, setConnections] = useState<WorkflowConnection[]>(initialConnections)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(...initialNodes.map((n) => n.position.x + NODE_WIDTH))
    const maxY = Math.max(...initialNodes.map((n) => n.position.y + NODE_HEIGHT))
    return { width: maxX + 80, height: maxY + 80 }
  })

  const handleDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId)
    const node = nodes.find((n) => n.id === nodeId)
    if (node) {
      dragStartPosition.current = { x: node.position.x, y: node.position.y }
    }
  }

  const handleDrag = (nodeId: string, { offset }: PanInfo) => {
    if (draggingNodeId !== nodeId || !dragStartPosition.current) return
    const newX = Math.max(0, dragStartPosition.current.x + offset.x)
    const newY = Math.max(0, dragStartPosition.current.y + offset.y)

    flushSync(() => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId ? { ...node, position: { x: newX, y: newY } } : node
        )
      )
    })

    setContentSize((prev) => ({
      width: Math.max(prev.width, newX + NODE_WIDTH + 80),
      height: Math.max(prev.height, newY + NODE_HEIGHT + 80),
    }))
  }

  const handleDragEnd = () => {
    setDraggingNodeId(null)
    dragStartPosition.current = null
  }

  const addNode = () => {
    const template = nodeTemplates[Math.floor(Math.random() * nodeTemplates.length)]
    const lastNode = nodes[nodes.length - 1]
    const newPosition = lastNode
      ? { x: lastNode.position.x + 260, y: lastNode.position.y }
      : { x: 40, y: 120 }

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      ...template,
      position: newPosition,
    }

    flushSync(() => {
      setNodes((prev) => [...prev, newNode])
      if (lastNode) {
        setConnections((prev) => [...prev, { from: lastNode.id, to: newNode.id }])
      }
    })

    setContentSize((prev) => ({
      width: Math.max(prev.width, newPosition.x + NODE_WIDTH + 80),
      height: Math.max(prev.height, newPosition.y + NODE_HEIGHT + 80),
    }))

    canvasRef.current?.scrollTo({
      left: newPosition.x + NODE_WIDTH - (canvasRef.current.clientWidth ?? 0) + 100,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400"
          >
            Live
          </Badge>
          <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground/50">
            Workflow IA
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addNode}
          className="h-8 gap-2 rounded-lg text-xs uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground"
          aria-label="Ajouter un nœud"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Ajouter un outil</span>
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative h-[340px] w-full overflow-auto rounded-xl border border-border/30 bg-background/40 sm:h-[420px]"
        role="region"
        aria-label="Workflow canvas"
        tabIndex={0}
      >
        <div
          className="relative"
          style={{ minWidth: contentSize.width, minHeight: contentSize.height }}
        >
          {/* SVG Connections */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={contentSize.width}
            height={contentSize.height}
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {connections.map((c) => (
              <WorkflowConnectionLine
                key={`${c.from}-${c.to}`}
                from={c.from}
                to={c.to}
                nodes={nodes}
              />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon
            const isDragging = draggingNodeId === node.id

            return (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                dragConstraints={{ left: 0, top: 0, right: 100000, bottom: 100000 }}
                onDragStart={() => handleDragStart(node.id)}
                onDrag={(_, info) => handleDrag(node.id, info)}
                onDragEnd={handleDragEnd}
                style={{ x: node.position.x, y: node.position.y, width: NODE_WIDTH, transformOrigin: "0 0" }}
                className="absolute cursor-grab"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileDrag={{ scale: 1.04, zIndex: 50, cursor: "grabbing" }}
                aria-grabbed={isDragging}
              >
                <Card
                  className={`group/node relative w-full overflow-hidden rounded-xl border ${colorClasses[node.color]} bg-background/80 p-3 backdrop-blur transition-all hover:shadow-lg ${isDragging ? "shadow-xl ring-2 ring-primary/50" : ""}`}
                  role="article"
                  aria-label={`${node.type} : ${node.title}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/node:opacity-100" />
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${colorClasses[node.color]} bg-background/80 backdrop-blur`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Badge
                          variant="outline"
                          className="mb-0.5 rounded-full border-border/40 bg-background/80 px-1.5 py-0 text-[9px] uppercase tracking-[0.15em] text-foreground/50"
                        >
                          {node.type}
                        </Badge>
                        <h3 className="truncate text-xs font-semibold tracking-tight text-foreground">
                          {node.title}
                        </h3>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-relaxed text-foreground/60">
                      {node.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                      <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
                      <span className="uppercase tracking-[0.1em]">Connecté</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/30 bg-background/40 px-4 py-2.5 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="uppercase tracking-[0.15em]">
              {nodes.length} {nodes.length === 1 ? "Outil" : "Outils"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="uppercase tracking-[0.15em]">
              {connections.length} {connections.length === 1 ? "Connexion" : "Connexions"}
            </span>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/35">
          Glissez les blocs pour réorganiser
        </p>
      </div>
    </div>
  )
}
