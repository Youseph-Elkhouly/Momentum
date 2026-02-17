"use client";

interface NotesInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function NotesInput({ value, onChange, placeholder }: NotesInputProps) {
  return (
    <section className="flex flex-col h-full">
      <label htmlFor="notes" className="sr-only">
        Notes / Conversation
      </label>
      <textarea
        id="notes"
        name="notes"
        rows={6}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder ?? "Add notes or describe what you're working on…"}
        className="w-full resize-y min-h-[120px] px-4 py-3 text-text-primary placeholder:text-text-secondary bg-white border border-border rounded-md text-[15px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-border focus:border-border"
        aria-label="Notes and conversation input"
      />
    </section>
  );
}
