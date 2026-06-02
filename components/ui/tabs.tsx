import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function Tabs({
  value,
  onValueChange,
  children,
  className
}: React.HTMLAttributes<HTMLDivElement> & TabsContextValue) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

function TabsTrigger({
  value,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext);
  const selected = context?.value === value;

  return (
    <button
      type="button"
      aria-selected={selected}
      className={cn(
        "rounded-full px-4 py-2 text-xs font-bold transition-colors",
        selected ? "bg-navy text-white" : "bg-cloud text-slate-500 hover:bg-slate-200",
        className
      )}
      onClick={() => context?.onValueChange(value)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger };
