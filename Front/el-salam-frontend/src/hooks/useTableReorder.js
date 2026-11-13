import { useState, useRef, useCallback } from "react";

/**
 * Hook لإدارة السحب والإفلات وإعادة الترتيب (Drag & Drop)
 * يدعم:
 * 1. السحب بالماوس (HTML5 Drag & Drop) لسطح المكتب
 * 2. الضغط المطول باللمس (Touch Long-Press & Drag) للموبايل والتابلت
 */
export function useTableReorder({ items = [], onReorder, enabled = true }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const longPressTimerRef = useRef(null);
  const touchStartYRef = useRef(0);
  const currentDragIndexRef = useRef(null);
  const currentTargetIndexRef = useRef(null);

  // تحديث المرجع الداخلي
  const updateTargetIndex = (idx) => {
    currentTargetIndexRef.current = idx;
    setDropTargetIndex(idx);
  };

  // 1. Mouse Drag & Drop
  const handleDragStart = useCallback(
    (e, index) => {
      if (!enabled) return;
      setDraggedIndex(index);
      currentDragIndexRef.current = index;
      currentTargetIndexRef.current = index;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      }
    },
    [enabled]
  );

  const handleDragOver = useCallback(
    (e, index) => {
      if (!enabled || currentDragIndexRef.current === null) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      if (currentTargetIndexRef.current !== index) {
        updateTargetIndex(index);
      }
    },
    [enabled]
  );

  const handleDrop = useCallback(
    (e, targetIndex) => {
      if (!enabled) return;
      e.preventDefault();
      const sourceIndex = currentDragIndexRef.current;
      if (sourceIndex !== null && sourceIndex !== targetIndex) {
        const newItems = [...items];
        const [moved] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, moved);
        onReorder?.(newItems);
      }
      setDraggedIndex(null);
      setDropTargetIndex(null);
      currentDragIndexRef.current = null;
      currentTargetIndexRef.current = null;
    },
    [enabled, items, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    currentDragIndexRef.current = null;
    currentTargetIndexRef.current = null;
    setIsLongPressing(false);
  }, []);

  // 2. Touch / Long-Press handlers
  const handleTouchStart = useCallback(
    (e, index) => {
      if (!enabled) return;
      const touch = e.touches[0];
      touchStartYRef.current = touch.clientY;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // ضغطة مطولة لمدة 250 ميلي ثانية للتفريق بين السحب والتمرير العادي
      longPressTimerRef.current = setTimeout(() => {
        setDraggedIndex(index);
        currentDragIndexRef.current = index;
        currentTargetIndexRef.current = index;
        setIsLongPressing(true);
        try {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(40);
          }
        } catch {}
      }, 250);
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!enabled) return;
      const touch = e.touches[0];

      // إذا تحرك الإصبع قبل اكتمال وقت الضغطة المطولة يتم إلغاؤها ليعمل السكرول العادي
      if (longPressTimerRef.current && !isLongPressing) {
        if (Math.abs(touch.clientY - touchStartYRef.current) > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      // إذا كان في وضع السحب النشط بعد الضغط المطول
      if (isLongPressing && currentDragIndexRef.current !== null) {
        e.preventDefault(); // منع التمرير أثناء السحب
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = element?.closest("[data-reorder-index]");
        if (row) {
          const targetIdx = Number(row.getAttribute("data-reorder-index"));
          if (!isNaN(targetIdx) && targetIdx !== currentTargetIndexRef.current) {
            updateTargetIndex(targetIdx);
          }
        }
      }
    },
    [enabled, isLongPressing]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressing && currentDragIndexRef.current !== null) {
      const sourceIndex = currentDragIndexRef.current;
      const targetIndex = currentTargetIndexRef.current;
      if (targetIndex !== null && sourceIndex !== targetIndex) {
        const newItems = [...items];
        const [moved] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, moved);
        onReorder?.(newItems);
      }
    }

    setDraggedIndex(null);
    setDropTargetIndex(null);
    currentDragIndexRef.current = null;
    currentTargetIndexRef.current = null;
    setIsLongPressing(false);
  }, [isLongPressing, items, onReorder]);

  const getRowProps = useCallback(
    (index) => ({
      "data-reorder-index": index,
      draggable: enabled,
      onDragStart: (e) => handleDragStart(e, index),
      onDragOver: (e) => handleDragOver(e, index),
      onDrop: (e) => handleDrop(e, index),
      onDragEnd: handleDragEnd,
      onTouchStart: (e) => handleTouchStart(e, index),
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    }),
    [
      enabled,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    ]
  );

  return {
    draggedIndex,
    dropTargetIndex,
    isLongPressing,
    getRowProps,
  };
}

