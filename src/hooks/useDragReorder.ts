import { useState, useCallback } from "react";

interface DragState {
  draggedIndex: number | null;
  draggedOverIndex: number | null;
}

export function useDragReorder<T>(
  items: T[],
  onReorder: (fromIndex: number, toIndex: number) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    draggedIndex: null,
    draggedOverIndex: null,
  });

  const handleDragStart = useCallback((index: number) => {
    setDragState({ draggedIndex: index, draggedOverIndex: null });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragState((prev) => ({ ...prev, draggedOverIndex: index }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({ ...prev, draggedOverIndex: null }));
  }, []);

  const handleDragEnd = useCallback(() => {
    const { draggedIndex, draggedOverIndex } = dragState;

    if (
      draggedIndex !== null &&
      draggedOverIndex !== null &&
      draggedIndex !== draggedOverIndex
    ) {
      onReorder(draggedIndex, draggedOverIndex);
    }

    setDragState({ draggedIndex: null, draggedOverIndex: null });
  }, [dragState, onReorder]);

  const getDragClassName = useCallback(
    (index: number) => {
      const classes = [];
      
      if (dragState.draggedIndex === index) {
        classes.push('opacity-50 scale-95');
      }
      
      if (
        dragState.draggedOverIndex === index &&
        dragState.draggedIndex !== index
      ) {
        classes.push('ring-2 ring-blue-400');
      }
      
      return classes.join(' ');
    },
    [dragState]
  );

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDragEnd,
    getDragClassName,
  };
}


