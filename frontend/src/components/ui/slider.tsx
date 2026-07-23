import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, defaultValue, min = 0, max = 100, minStepsBetweenThumbs = 2, onValueChange, ...props }, ref) => {
  const currentVal = value ?? defaultValue ?? [min, max];
  const thumbs = Array.isArray(currentVal) ? currentVal : [currentVal];

  const sortedValue = Array.isArray(value)
    ? [Math.min(value[0], value[1]), Math.max(value[0], value[1])]
    : value;

  const handleValueChange = (vals: number[]) => {
    if (!onValueChange) return;
    if (Array.isArray(vals) && vals.length === 2) {
      let [a, b] = vals;
      let minV = Math.min(a, b);
      let maxV = Math.max(a, b);

      if (maxV - minV < 20) {
        if (Array.isArray(value)) {
          if (a !== value[0]) {
            minV = Math.min(a, value[1] - 20);
            maxV = value[1];
          } else {
            maxV = Math.max(b, value[0] + 20);
            minV = value[0];
          }
        }
      }
      onValueChange([Math.max(min, minV), Math.min(max, maxV)]);
    } else {
      onValueChange(vals);
    }
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      min={min}
      max={max}
      value={sortedValue}
      defaultValue={defaultValue}
      minStepsBetweenThumbs={minStepsBetweenThumbs}
      onValueChange={handleValueChange}
      className={cn(
        "relative flex w-full touch-none select-none items-center cursor-pointer py-2",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbs.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing z-10"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
