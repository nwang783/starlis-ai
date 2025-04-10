"use client"

import { X, Plus, ChevronRight, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useRef } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Canvas {
  id: string
  title: string
  content: React.ReactNode
}

interface RightCanvasProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

function SortableTab({ canvas, isActive, onClick, onDelete, isDragging }: {
  canvas: Canvas
  isActive: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  isDragging?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: canvas.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-background shadow-sm" 
          : "hover:bg-background/50",
        isDragging && "opacity-50"
      )}
    >
      <div
        className="flex items-center gap-1.5 flex-1"
        onClick={onClick}
      >
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-background/50 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium">{canvas.title}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-background/80 rounded-full"
        )}
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

function DraggingTab({ canvas }: { canvas: Canvas }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background shadow-lg">
      <div className="flex items-center gap-1.5 flex-1">
        <div className="p-1">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">{canvas.title}</span>
      </div>
    </div>
  )
}

export function RightCanvas({ isOpen, onClose, children }: RightCanvasProps) {
  const [canvases, setCanvases] = useState<Canvas[]>([
    { id: "1", title: "Canvas 1", content: children }
  ])
  const [activeCanvasId, setActiveCanvasId] = useState("1")
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const addCanvas = () => {
    const newId = (canvases.length + 1).toString()
    setCanvases([...canvases, { id: newId, title: `Canvas ${newId}`, content: <div>New Canvas Content</div> }])
    setActiveCanvasId(newId)
  }

  const deleteCanvas = (id: string) => {
    if (canvases.length === 1) return // Don't delete the last canvas
    const newCanvases = canvases.filter(canvas => canvas.id !== id)
    setCanvases(newCanvases)
    if (activeCanvasId === id) {
      setActiveCanvasId(newCanvases[0].id)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = canvases.findIndex(canvas => canvas.id === active.id)
      const newIndex = canvases.findIndex(canvas => canvas.id === over.id)
      
      setCanvases(arrayMove(canvases, oldIndex, newIndex))
    }
    
    setActiveDragId(null)
  }

  const activeCanvas = canvases.find(canvas => canvas.id === activeCanvasId)
  const draggingCanvas = activeDragId ? canvases.find(canvas => canvas.id === activeDragId) : null

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-[50vw] bg-background border-l shadow-lg z-50 transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-2 py-2 border-b bg-muted/50">
          <div ref={containerRef} className="flex-1 flex gap-1 overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={canvases.map(canvas => canvas.id)}
                strategy={horizontalListSortingStrategy}
              >
                {canvases.map(canvas => (
                  <SortableTab
                    key={canvas.id}
                    canvas={canvas}
                    isActive={activeCanvasId === canvas.id}
                    isDragging={activeDragId === canvas.id}
                    onClick={() => setActiveCanvasId(canvas.id)}
                    onDelete={(e) => {
                      e.stopPropagation()
                      deleteCanvas(canvas.id)
                    }}
                  />
                ))}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {draggingCanvas ? <DraggingTab canvas={draggingCanvas} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-background/80"
              onClick={addCanvas}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-background/80"
              onClick={onClose}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeCanvas?.content}
        </div>
      </div>
    </div>
  )
} 