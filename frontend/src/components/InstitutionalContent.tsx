export function InstitutionalContent({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
      {content}
    </div>
  );
}
