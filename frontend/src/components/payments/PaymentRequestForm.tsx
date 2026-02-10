import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjectDocuments } from '@/hooks/useDocuments';
import { useSubmitPayment } from '@/hooks/usePayments';
import { Plus, FileText, AlertTriangle, Loader2 } from 'lucide-react';

const formSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Amount must be a positive number'),
  milestone: z.string().min(1, 'Milestone is required'),
  documentId: z.string().optional(),
  description: z.string().optional(),
  beneficiaryName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentRequestFormProps {
  projectId: string;
  constituencyId: string;
  projectName?: string;
  remainingBudget?: number;
  trigger?: React.ReactNode;
}

const MILESTONE_OPTIONS = [
  { value: 'mobilization', label: 'Mobilization (10%)' },
  { value: 'foundation', label: 'Foundation Complete (20%)' },
  { value: 'structure', label: 'Structure Complete (30%)' },
  { value: 'roofing', label: 'Roofing Complete (20%)' },
  { value: 'finishing', label: 'Finishing Works (15%)' },
  { value: 'completion', label: 'Project Completion (5%)' },
  { value: 'retention', label: 'Retention Release' },
  { value: 'other', label: 'Other' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentRequestForm({
  projectId,
  constituencyId,
  projectName,
  remainingBudget,
  trigger,
}: PaymentRequestFormProps) {
  const [open, setOpen] = useState(false);
  
  const { data: documents = [], isLoading: loadingDocs } = useProjectDocuments(projectId);
  const submitPayment = useSubmitPayment();

  // Filter to only invoice-type documents
  const invoiceDocuments = documents.filter(
    (doc) => doc.document_type === 'invoice'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      milestone: '',
      documentId: '',
      description: '',
      beneficiaryName: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const result = await submitPayment.mutateAsync({
      projectId,
      amount: parseFloat(values.amount),
      documentId: values.documentId || undefined,
      description: values.description || undefined,
      milestone: values.milestone,
      beneficiaryName: values.beneficiaryName || undefined,
    });

    if (result.success) {
      form.reset();
      setOpen(false);
    }
  };

  const watchAmount = form.watch('amount');
  const parsedAmount = parseFloat(watchAmount) || 0;
  const exceedsBudget = remainingBudget !== undefined && parsedAmount > remainingBudget;
  const isHighRisk = parsedAmount > 100000;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Payment Request
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Payment Request</DialogTitle>
          <DialogDescription>
            {projectName && (
              <span className="font-medium text-foreground">{projectName}</span>
            )}
            {remainingBudget !== undefined && (
              <span className="block mt-1">
                Remaining Budget: <span className="font-semibold text-primary">{formatCurrency(remainingBudget)}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (ZMW)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        K
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </FormControl>
                  <div className="flex gap-2 mt-1">
                    {exceedsBudget && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Exceeds Budget
                      </Badge>
                    )}
                    {isHighRisk && !exceedsBudget && (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        High Risk Amount (&gt;100k)
                      </Badge>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="milestone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milestone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select milestone..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MILESTONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supporting Invoice</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice document..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingDocs ? (
                        <SelectItem value="loading" disabled>
                          Loading documents...
                        </SelectItem>
                      ) : invoiceDocuments.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No invoice documents found
                        </SelectItem>
                      ) : (
                        invoiceDocuments.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{doc.file_name}</span>
                              {doc.is_immutable && (
                                <Badge variant="secondary" className="text-xs">Signed</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the invoice document for this payment request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beneficiaryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiary Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contractor or supplier name" />
                  </FormControl>
                  <FormDescription>
                    Leave blank to use the project contractor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional details about this payment..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitPayment.isPending || exceedsBudget}
              >
                {submitPayment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Payment Request'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
