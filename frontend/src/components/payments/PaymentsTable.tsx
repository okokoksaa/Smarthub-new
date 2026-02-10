import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, CheckCircle, XCircle, Bot, AlertTriangle } from 'lucide-react';
import { Payment, PaymentStatus } from '@/types/cdf';
import { cn } from '@/lib/utils';

interface PaymentsTableProps {
  payments: Payment[];
}

const statusStyles: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  panel_a_review: { label: 'Panel A Review', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  panel_b_review: { label: 'Panel B Review', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  authorized: { label: 'Authorized', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  executed: { label: 'Executed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Payment ID</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Contractor</TableHead>
            <TableHead>Milestone</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Risk</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="group">
              <TableCell className="font-mono text-sm">{payment.id}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium line-clamp-1">{payment.projectName}</p>
                  <p className="text-xs text-muted-foreground">{payment.projectId}</p>
                </div>
              </TableCell>
              <TableCell>{payment.contractorName}</TableCell>
              <TableCell>
                <span className="text-sm">{payment.milestone}</span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('font-normal', statusStyles[payment.status].className)}
                >
                  {statusStyles[payment.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                {payment.aiRiskScore !== undefined && (
                  <div className="flex items-center gap-1.5">
                    {payment.aiRiskScore >= 50 ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        payment.aiRiskScore >= 50
                          ? 'text-destructive'
                          : payment.aiRiskScore >= 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      )}
                    >
                      {payment.aiRiskScore}
                    </span>
                    {payment.aiFlags && payment.aiFlags.length > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                        {payment.aiFlags.length} flag
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bot className="mr-2 h-4 w-4" />
                      AI Analysis
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-emerald-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
