import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Calendar as CalendarIcon, Users, FileCheck, AlertTriangle, MapPin, Home } from 'lucide-react';
import { useWdcSignoff } from '@/hooks/useWdcSignoff';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const signoffSchema = z.object({
  meeting_date: z.date({
    required_error: 'Meeting date is required',
  }),
  chair_name: z
    .string()
    .trim()
    .min(2, 'Chair name must be at least 2 characters')
    .max(100, 'Chair name must be less than 100 characters'),
  chair_nrc: z
    .string()
    .trim()
    .max(20, 'NRC must be less than 20 characters')
    .optional(),
  attendees_count: z
    .number({ required_error: 'Number of attendees is required' })
    .min(1, 'At least 1 attendee required')
    .max(500, 'Maximum 500 attendees'),
  quorum_met: z.boolean(),
  chair_signed: z.boolean(),
  meeting_minutes_url: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  // Residency verification fields
  residents_count: z
    .number()
    .min(0, 'Cannot be negative')
    .optional(),
  non_residents_count: z
    .number()
    .min(0, 'Cannot be negative')
    .optional(),
  residency_verified: z.boolean(),
  residency_verification_method: z.string().optional(),
  residency_threshold_met: z.boolean(),
  residency_notes: z
    .string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

type SignoffFormData = z.infer<typeof signoffSchema>;

const VERIFICATION_METHODS = [
  { value: 'nrc_check', label: 'NRC Verification' },
  { value: 'voter_roll', label: 'Voter Registration Roll' },
  { value: 'chief_attestation', label: 'Chief/Headman Attestation' },
  { value: 'utility_bills', label: 'Utility Bills/Lease Documents' },
  { value: 'council_records', label: 'Council Residency Records' },
  { value: 'other', label: 'Other Method' },
];

interface WdcSignoffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  wardId?: string;
}

export function WdcSignoffForm({
  open,
  onOpenChange,
  projectId,
  projectName,
  wardId,
}: WdcSignoffFormProps) {
  const { signoff, createSignoff, updateSignoff, isCreating, isUpdating } = useWdcSignoff(projectId);
  const isExisting = !!signoff;

  const form = useForm<SignoffFormData>({
    resolver: zodResolver(signoffSchema),
    defaultValues: {
      meeting_date: signoff?.meeting_date ? new Date(signoff.meeting_date) : undefined,
      chair_name: signoff?.chair_name || '',
      chair_nrc: signoff?.chair_nrc || '',
      attendees_count: signoff?.attendees_count || undefined,
      quorum_met: signoff?.quorum_met || false,
      chair_signed: signoff?.chair_signed || false,
      meeting_minutes_url: signoff?.meeting_minutes_url || '',
      notes: signoff?.notes || '',
      // Residency fields
      residents_count: signoff?.residents_count || undefined,
      non_residents_count: signoff?.non_residents_count || 0,
      residency_verified: signoff?.residency_verified || false,
      residency_verification_method: signoff?.residency_verification_method || '',
      residency_threshold_met: signoff?.residency_threshold_met || false,
      residency_notes: signoff?.residency_notes || '',
    },
  });

  const onSubmit = (data: SignoffFormData) => {
    const payload = {
      project_id: projectId,
      ward_id: wardId,
      meeting_date: format(data.meeting_date, 'yyyy-MM-dd'),
      chair_name: data.chair_name,
      chair_nrc: data.chair_nrc || undefined,
      attendees_count: data.attendees_count,
      quorum_met: data.quorum_met,
      chair_signed: data.chair_signed,
      meeting_minutes_url: data.meeting_minutes_url || undefined,
      notes: data.notes || undefined,
      // Residency fields
      residents_count: data.residents_count,
      non_residents_count: data.non_residents_count || 0,
      residency_verified: data.residency_verified,
      residency_verification_method: data.residency_verification_method || undefined,
      residency_threshold_met: data.residency_threshold_met,
      residency_notes: data.residency_notes || undefined,
    };

    if (isExisting && signoff) {
      updateSignoff({ id: signoff.id, ...payload });
    } else {
      createSignoff(payload);
    }
    onOpenChange(false);
  };

  const watchQuorumMet = form.watch('quorum_met');
  const watchChairSigned = form.watch('chair_signed');
  const watchResidencyMet = form.watch('residency_threshold_met');
  const allRequirementsMet = watchQuorumMet && watchChairSigned && watchResidencyMet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            WDC Sign-off
          </DialogTitle>
          <DialogDescription>
            Record WDC meeting minutes and chair approval for: <strong>{projectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-warning/20 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            Per Section 15(2)(a) of the CDF Act, projects cannot be submitted to CDFC without valid WDC minutes, chair sign-off, and ward residency verification.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Meeting Date */}
            <FormField
              control={form.control}
              name="meeting_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Meeting Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select meeting date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chair Name and NRC */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chair_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WDC Chair Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name of WDC Chair" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chair_nrc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chair NRC</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123456/78/1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Attendees Count */}
            <FormField
              control={form.control}
              name="attendees_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Attendees *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="e.g., 15"
                        className="pl-9"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Total members present at the meeting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Minutes URL */}
            <FormField
              control={form.control}
              name="meeting_minutes_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minutes Document URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to uploaded meeting minutes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="space-y-3 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="quorum_met"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Quorum was met at the meeting
                      </FormLabel>
                      <FormDescription>
                        Minimum required members were present
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chair_signed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        WDC Chair has signed off on this project
                      </FormLabel>
                      <FormDescription>
                        Chair confirms community approval
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Residency Verification Section */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Home className="h-4 w-4" />
                Residency Verification
              </div>

              {/* Residents Count */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="residents_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward Residents</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 12"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Attendees residing in ward
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="non_residents_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Non-Residents</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 2"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Attendees from outside ward
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Verification Method */}
              <FormField
                control={form.control}
                name="residency_verification_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How was residency verified?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VERIFICATION_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Residency Checkboxes */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="residency_verified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Residency verification completed</FormLabel>
                        <FormDescription>
                          Attendees' ward residency has been verified
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residency_threshold_met"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ward residency threshold met</FormLabel>
                        <FormDescription>
                          Majority of attendees are ward residents (≥75%)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Residency Notes */}
              <FormField
                control={form.control}
                name="residency_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residency Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any notes about residency verification..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status indicator */}
            {allRequirementsMet ? (
              <Alert className="border-success/20 bg-success/5">
                <FileCheck className="h-4 w-4 text-success" />
                <AlertDescription className="text-sm text-success">
                  All WDC requirements met. Project can be submitted to CDFC.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-destructive/20 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm text-destructive">
                  {[
                    !watchQuorumMet && 'Quorum not met',
                    !watchChairSigned && 'Chair signature required',
                    !watchResidencyMet && 'Residency threshold not met',
                  ].filter(Boolean).join('. ')}.
                </AlertDescription>
              </Alert>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about the meeting..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExisting ? 'Update Sign-off' : 'Record Sign-off'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
