import { useEffect, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';

export function useAlgorithmAnimation() {
  const isAnimating = useGraphStore((s) => s.isAnimating);
  const animationSteps = useGraphStore((s) => s.animationSteps);
  const currentStepIndex = useGraphStore((s) => s.currentStepIndex);
  const animationSpeed = useGraphStore((s) => s.animationSpeed);
  const setCurrentStepIndex = useGraphStore((s) => s.setCurrentStepIndex);
  const setAnimating = useGraphStore((s) => s.setAnimating);
  const setNodeColor = useGraphStore((s) => s.setNodeColor);
  const setEdgeColor = useGraphStore((s) => s.setEdgeColor);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAnimating) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (currentStepIndex >= animationSteps.length) {
      setAnimating(false);
      return;
    }

    const step = animationSteps[currentStepIndex];
    const delay = (step.delay || 300) / animationSpeed;

    timerRef.current = setTimeout(() => {
      if (step.nodes && step.color) {
        if (
          step.type === 'visit' ||
          step.type === 'highlight-node' ||
          step.type === 'color-node'
        ) {
          for (const node of step.nodes) {
            setNodeColor(node, step.color);
          }
        }
      }

      if (step.edges && step.color) {
        if (step.type === 'highlight-edge' || step.type === 'color-edge') {
          for (const [from, to] of step.edges) {
            setEdgeColor(from, to, step.color);
          }
        }
      }

      setCurrentStepIndex(currentStepIndex + 1);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    isAnimating,
    animationSteps,
    currentStepIndex,
    animationSpeed,
    setNodeColor,
    setEdgeColor,
    setCurrentStepIndex,
    setAnimating,
  ]);
}
