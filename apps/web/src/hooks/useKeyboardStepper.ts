import type { KeyboardEvent } from "react";

export interface KeyboardStepperOptions {
  /** Current value, the basis for relative steps. */
  value: number;
  /** Arrow-key increment. */
  step: number;
  /** Page-key increment. */
  largeStep: number;
  /** Target value for the Home key. */
  homeValue: number;
  /** Target value for the End key. */
  endValue: number;
  /**
   * Applied to every computed target before `onChange`: a clamp for bounded
   * controls, a modulo wrap for periodic ones.
   */
  bound: (raw: number) => number;
  onChange: (next: number) => void;
}

/**
 * Returns an `onKeyDown` handler implementing the standard slider keyboard
 * map: arrows step by `step`, Page keys by `largeStep`, Home/End jump to fixed
 * targets. Mapped keys are prevented; keys outside the map pass through
 * untouched.
 */
export function useKeyboardStepper(options: KeyboardStepperOptions) {
  const { value, step, largeStep, homeValue, endValue, bound, onChange } = options;
  return (e: KeyboardEvent): void => {
    let next: number;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        next = value + step;
        break;
      case "ArrowDown":
      case "ArrowLeft":
        next = value - step;
        break;
      case "PageUp":
        next = value + largeStep;
        break;
      case "PageDown":
        next = value - largeStep;
        break;
      case "Home":
        next = homeValue;
        break;
      case "End":
        next = endValue;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(bound(next));
  };
}
