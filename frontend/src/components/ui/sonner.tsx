import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <div
      ref={(el) => {
        if (el) {
          el.addEventListener("pointerdown", (e) => e.stopPropagation(), true);
          el.addEventListener("mousedown", (e) => e.stopPropagation(), true);
          el.addEventListener("touchstart", (e) => e.stopPropagation(), true);
          el.addEventListener("click", (e) => e.stopPropagation(), true);
        }
      }}
      className="z-[99999] relative"
    >
      <Sonner
        className="toaster group"
        position="bottom-left"
        closeButton={false} // Disable dual default button
        duration={4000}
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:pointer-events-auto flex items-center justify-between gap-3 text-left font-sans text-xs leading-relaxed",
            title: "text-left font-medium text-foreground text-xs leading-snug",
            description: "text-left text-muted-foreground text-xs leading-normal mt-0.5",
          },
        }}
        {...props}
      />
    </div>
  );
};

export { Toaster };
