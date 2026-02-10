import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  FileText,
  Building2,
  Calendar,
  Banknote,
  Bot,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Payment, useApprovePayment, useRejectPayment } from '@/hooks/usePayments';
import { format } from 'date-fns';

interface PaymentApprovalCardProps {
  payment: Payment;
  panel: 'a' | 'b';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentApprovalCard({ payment, panel }: PaymentApprovalCardProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();

  const isHighRisk = (payment.ai_risk_score ?? 0) > 50;
  const isMediumRisk = (payment.ai_risk_score ?? 0) > 30 && (payment.ai_risk_score ?? 0) <= 50;

  const handleApprove = async () => {
    await approvePayment.mutateAsync({ paymentId: payment.id, panel });
    setShowApproveDialog(false);
  };

  const handleReject = async () => {
    await rejectPayment.mutateAsync(payment.id);
    setShowRejectDialog(false);
  };

  return (
    <>
      <Card className={cn(
        'relative overflow-hidden transition-all',
        isHighRisk && 'border-destructive/50 shadow-destructive/20 shadow-lg'
      )}>
        {/* AI Risk Indicator Banner */}
        {isHighRisk && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive to-destructive/50 animate-pulse" />
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {payment.payment_number}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {payment.project?.name || 'Unknown Project'}
              </CardDescription>
            </div>
            
            {/* AI Risk Badge */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              isHighRisk 
                ? 'bg-destructive/10 animate-pulse' 
                : isMediumRisk 
                  ? 'bg-amber-500/10' 
                  : 'bg-emerald-500/10'
            )}>
              {isHighRisk ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                  <span className="text-sm font-semibold text-destructive">
                    ⚠ High Anomaly
                  </span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-600">
                    ✓ Low Risk
                  </span>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Payment Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                Amount
              </p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(payment.amount)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Requested
              </p>
              <p className="text-sm font-medium">
                {format(new Date(payment.created_at), 'dd MMM yyyy')}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Milestone</p>
              <Badge variant="outline" className="font-normal">
                {payment.milestone || 'Not specified'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Beneficiary</p>
              <p className="text-sm font-medium truncate">
                {payment.beneficiary_name}
              </p>
            </div>
          </div>

          <Separator />

          {/* AI Analysis Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI Risk Analysis</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                'text-3xl font-bold',
                isHighRisk 
                  ? 'text-destructive' 
                  : isMediumRisk 
                    ? 'text-amber-600' 
                    : 'text-emerald-600'
              )}>
                {payment.ai_risk_score ?? 0}
              </div>
              
              {/* Risk Score Bar */}
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-500',
                      isHighRisk 
                        ? 'bg-gradient-to-r from-destructive to-destructive/70' 
                        : isMediumRisk 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    )}
                    style={{ width: `${payment.ai_risk_score ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* AI Flags */}
            {payment.ai_flags && payment.ai_flags.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {payment.ai_flags.map((flag, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 text-sm bg-destructive/5 text-destructive p-2 rounded-md"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supporting Document */}
          {payment.document && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invoice:</span>
                <span className="font-medium truncate">{payment.document.file_name}</span>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 pt-4">
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowRejectDialog(true)}
            disabled={rejectPayment.isPending}
          >
            {rejectPayment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </>
            )}
          </Button>
          
          <Button
            variant="default"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowApproveDialog(true)}
            disabled={approvePayment.isPending}
          >
            {approvePayment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve (Panel {panel.toUpperCase()})
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Confirm Panel {panel.toUpperCase()} Approval
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to approve payment <strong>{payment.payment_number}</strong> for{' '}
                  <strong>{formatCurrency(payment.amount)}</strong>.
                </p>
                
                {isHighRisk && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>Warning:</strong> This payment has been flagged with a high AI risk score ({payment.ai_risk_score}).
                      Please ensure you have reviewed all supporting documentation.
                    </span>
                  </div>
                )}
                
                <p className="text-sm">
                  {panel === 'a' 
                    ? 'This will advance the payment to Panel B for final authorization.'
                    : 'This will execute the payment and release funds to the beneficiary.'}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Confirm Payment Rejection
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to reject payment <strong>{payment.payment_number}</strong> for{' '}
                  <strong>{formatCurrency(payment.amount)}</strong>.
                </p>
                <p className="text-sm">
                  This action will be logged in the audit trail. The payment request will be marked as rejected and the submitter will be notified.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
