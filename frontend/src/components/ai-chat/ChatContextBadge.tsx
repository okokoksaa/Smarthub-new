import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Wallet,
  CreditCard,
  Shield,
  MessageCircle,
} from 'lucide-react';

interface ChatContextBadgeProps {
  contextType: string;
  entityName?: string;
}

const contextConfig: Record<string, { icon: any; label: string; color: string }> = {
  general: {
    icon: MessageCircle,
    label: 'General',
    color: 'bg-gray-100 text-gray-700',
  },
  project: {
    icon: FolderKanban,
    label: 'Project',
    color: 'bg-blue-100 text-blue-700',
  },
  payment: {
    icon: CreditCard,
    label: 'Payment',
    color: 'bg-green-100 text-green-700',
  },
  budget: {
    icon: Wallet,
    label: 'Budget',
    color: 'bg-purple-100 text-purple-700',
  },
  compliance: {
    icon: Shield,
    label: 'Compliance',
    color: 'bg-orange-100 text-orange-700',
  },
};

export function ChatContextBadge({ contextType, entityName }: ChatContextBadgeProps) {
  const config = contextConfig[contextType] || contextConfig.general;
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      {entityName && (
        <>
          <span className="mx-1">:</span>
          <span className="font-normal truncate max-w-[100px]">{entityName}</span>
        </>
      )}
    </Badge>
  );
}
