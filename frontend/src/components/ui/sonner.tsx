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
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:pointer-events-auto flex flex-col items-center justify-center text-center gap-1 font-sans text-xs leading-relaxed w-full",
            title: "text-center font-medium text-foreground text-xs leading-snug w-full",
            description: "text-center text-muted-foreground text-xs leading-normal mt-0.5 w-full",
          },
        }}
        {...props}
      />
    </div>
  );
};

export { Toaster };
