import { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card/50">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © 2024 AI-HR Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
