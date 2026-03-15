'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationStep {
  id: number;
  title: string;
  path: string;
}

const steps: NavigationStep[] = [
  { id: 1, title: 'Future Signal', path: '/future-signals' },
  { id: 2, title: 'Local Challenge', path: '/local-challenges' },
  { id: 3, title: 'Interpretation', path: '/interpretation' },
  { id: 4, title: 'Tomorrow Headline', path: '/tomorrow-headlines' }
];

export default function Navigation() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Aizu Future Workshop
          </Link>
          
          <div className="flex items-center space-x-4">
            {steps.map((step) => {
              const isActive = pathname === step.path;
              return (
                <div
                  key={step.id}
                  className={`flex items-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${isActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                  >
                    {step.id}
                  </div>
                  <span className="ml-2 hidden md:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
