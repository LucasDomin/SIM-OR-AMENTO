import { getStatusColor, getStatusLabel } from '../lib/utils';

interface BudgetStatusBadgeProps {
  status: string;
}

export function BudgetStatusBadge({ status }: BudgetStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}
