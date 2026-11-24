import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import React from 'react';

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <Button>Get started</Button>
      <ThemeToggle />
    </div>
  );
}
