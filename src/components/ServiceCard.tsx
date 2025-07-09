import { cn } from '@/lib/utils';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export function ServiceCard({ title, description, icon, className }: ServiceCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md",
      className
    )}>
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}