import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConstituencies, useProvinces, useDistricts } from '@/hooks/useGeographyData';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MapPin, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SECTORS = [
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'water', label: 'Water & Sanitation' },
  { value: 'roads', label: 'Roads & Infrastructure' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'community', label: 'Community Development' },
  { value: 'energy', label: 'Energy' },
  { value: 'governance', label: 'Governance' },
  { value: 'other', label: 'Other' },
] as const;

const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, 'Project name must be at least 5 characters')
    .max(200, 'Project name must be less than 200 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  sector: z.enum(['education', 'health', 'water', 'roads', 'agriculture', 'community', 'energy', 'governance', 'other'], {
    required_error: 'Please select a sector',
  }),
  constituency_id: z.string().uuid('Please select a constituency'),
  ward_id: z.string().uuid('Please select a ward').optional(),
  budget: z
    .number({ required_error: 'Budget is required' })
    .min(1000, 'Budget must be at least K1,000')
    .max(50000000, 'Budget cannot exceed K50,000,000'),
  beneficiaries: z
    .number()
    .min(1, 'At least 1 beneficiary required')
    .max(1000000, 'Beneficiaries cannot exceed 1,000,000')
    .optional(),
  location_description: z
    .string()
    .trim()
    .max(500, 'Location description must be less than 500 characters')
    .optional(),
  gps_latitude: z.number().min(-90).max(90).optional(),
  gps_longitude: z.number().min(-180).max(180).optional(),
  start_date: z.date().optional(),
  expected_end_date: z.date().optional(),
}).refine((data) => {
  if (data.start_date && data.expected_end_date) {
    return data.expected_end_date > data.start_date;
  }
  return true;
}, {
  message: 'Expected end date must be after start date',
  path: ['expected_end_date'],
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectSubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultConstituencyId?: string;
}

export function ProjectSubmissionForm({
  open,
  onOpenChange,
  defaultConstituencyId,
}: ProjectSubmissionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>();
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>();

  const { data: provinces } = useProvinces();
  const { data: districts } = useDistricts(selectedProvinceId);
  const { data: constituencies } = useConstituencies(selectedDistrictId);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      constituency_id: defaultConstituencyId || '',
      budget: undefined,
      beneficiaries: undefined,
      location_description: '',
    },
  });

  const selectedConstituencyId = form.watch('constituency_id');

  // Fetch wards for selected constituency
  const { data: wards } = useMutation({
    mutationFn: async (constituencyId: string) => {
      const { data, error } = await supabase
        .from('wards')
        .select('id, name, code')
        .eq('constituency_id', constituencyId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Generate project number
  const generateProjectNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PRJ-${year}-${random}`;
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const projectNumber = generateProjectNumber();
      
      const projectData = {
        project_number: projectNumber,
        name: data.name,
        description: data.description,
        sector: data.sector,
        constituency_id: data.constituency_id,
        ward_id: data.ward_id || null,
        budget: data.budget,
        beneficiaries: data.beneficiaries || null,
        location_description: data.location_description || null,
        gps_latitude: data.gps_latitude || null,
        gps_longitude: data.gps_longitude || null,
        start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null,
        expected_end_date: data.expected_end_date ? format(data.expected_end_date, 'yyyy-MM-dd') : null,
        status: 'draft' as const,
        submitted_by: user?.id,
        progress: 0,
        spent: 0,
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      // Log creation in audit_logs
      await supabase.from('audit_logs').insert([{
        entity_type: 'project',
        entity_id: project.id,
        action: 'create',
        event_type: 'insert',
        actor_id: user?.id,
        data_after: projectData,
        constituency_id: data.constituency_id,
      }]);

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${project.name}" created successfully`);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  // Fetch wards when constituency changes
  const handleConstituencyChange = async (constituencyId: string) => {
    form.setValue('constituency_id', constituencyId);
    form.setValue('ward_id', undefined);
    
    if (constituencyId) {
      const { data: wardsList } = await supabase
        .from('wards')
        .select('id, name, code')
        .eq('constituency_id', constituencyId)
        .order('name');
      
      // Store wards in state for selection
      if (wardsList) {
        setWardsData(wardsList);
      }
    }
  };

  const [wardsData, setWardsData] = useState<Array<{ id: string; name: string; code: string }>>([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Project</DialogTitle>
          <DialogDescription>
            Create a new CDF project proposal. All required fields must be completed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Construction of Classroom Block at Chilenje Primary School" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for the project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sector */}
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project sector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          {sector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the project objectives, scope, and expected outcomes..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 20 characters. Include objectives and expected outcomes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Province */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Province</label>
                <Select
                  value={selectedProvinceId}
                  onValueChange={(val) => {
                    setSelectedProvinceId(val);
                    setSelectedDistrictId(undefined);
                    form.setValue('constituency_id', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div className="space-y-2">
                <label className="text-sm font-medium">District</label>
                <Select
                  value={selectedDistrictId}
                  onValueChange={(val) => {
                    setSelectedDistrictId(val);
                    form.setValue('constituency_id', '');
                  }}
                  disabled={!selectedProvinceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Constituency */}
              <FormField
                control={form.control}
                name="constituency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Constituency *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleConstituencyChange}
                      disabled={!selectedDistrictId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select constituency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {constituencies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ward */}
            <FormField
              control={form.control}
              name="ward_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ward</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedConstituencyId || wardsData.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wardsData.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget and Beneficiaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (ZMW) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 500000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Amount in Zambian Kwacha
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiaries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Beneficiaries</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of people who will benefit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Start Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected End Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Description */}
            <FormField
              control={form.control}
              name="location_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Details
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the specific location, landmarks, or GPS coordinates..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GPS Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gps_latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPS Latitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.000001"
                        placeholder="e.g., -15.4167"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gps_longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPS Longitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.000001"
                        placeholder="e.g., 28.2833"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
