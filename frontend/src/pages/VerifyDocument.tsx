import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ShieldCheck, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// TypeScript interface for the verification response
export interface DocumentVerificationResult {
  valid: boolean;
  document_type: string | null;
  file_hash: string | null;
  upload_timestamp: string | null;
  project_id: string | null;
  project_name: string | null;
  project_status: string | null;
  uploader_role: string | null;
  is_immutable: boolean | null;
}

type VerificationState = 'loading' | 'valid' | 'invalid' | 'error';

const formatDocumentType = (type: string | null): string => {
  if (!type) return 'Document';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const VerifyDocument = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<VerificationState>('loading');
  const [result, setResult] = useState<DocumentVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyDocument = async () => {
      if (!id) {
        setState('invalid');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_document_public', {
          doc_id: id
        });

        if (error) {
          console.error('Verification error:', error);
          setErrorMessage(error.message);
          setState('error');
          return;
        }

        if (data && data.valid) {
          setResult(data as DocumentVerificationResult);
          setState('valid');
        } else {
          setState('invalid');
        }
      } catch (err) {
        console.error('Verification failed:', err);
        setErrorMessage('Failed to connect to verification service');
        setState('error');
      }
    };

    verifyDocument();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Government Header */}
      <header className="bg-green-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <Shield className="h-12 w-12" />
            <div className="text-center">
              <h1 className="text-2xl font-bold">Republic of Zambia</h1>
              <p className="text-green-200 text-sm">Ministry of Local Government</p>
              <p className="text-green-300 text-xs">CDF Document Verification Portal</p>
            </div>
            <Shield className="h-12 w-12" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center pb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Digital Document Verification
            </h2>
            <p className="text-sm text-muted-foreground">
              Document ID: <code className="bg-muted px-2 py-1 rounded text-xs">{id}</code>
            </p>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="pt-6">
            {/* Loading State */}
            {state === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-16 w-16 animate-spin text-green-600" />
                <p className="text-lg font-medium text-muted-foreground">
                  Verifying Digital Signature...
                </p>
                <p className="text-sm text-muted-foreground">
                  Checking document authenticity against the System of Record
                </p>
              </div>
            )}

            {/* Valid State */}
            {state === 'valid' && result && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative">
                    <ShieldCheck className="h-24 w-24 text-green-600" />
                    <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700 text-lg px-4 py-1">
                    ✓ Verified Authentic
                  </Badge>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Document Type</p>
                      <p className="font-semibold text-foreground">{formatDocumentType(result.document_type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                      <Badge variant={result.is_immutable ? "default" : "secondary"}>
                        {result.is_immutable ? 'Immutable Record' : 'Active Document'}
                      </Badge>
                    </div>
                  </div>

                  {result.project_name && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Related Project</p>
                      <p className="font-semibold text-foreground">{result.project_name}</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {result.project_status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Official Signature</p>
                    <p className="font-medium text-foreground">
                      Digitally signed by <span className="font-semibold">{result.uploader_role}</span>
                    </p>
                    {result.upload_timestamp && (
                      <p className="text-sm text-muted-foreground">
                        on {format(new Date(result.upload_timestamp), 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Cryptographic Hash (SHA-256)</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 break-all font-mono">
                      {result.file_hash}
                    </code>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  This document is registered in the CDF Digital System of Record and has been verified as authentic.
                </p>
              </div>
            )}

            {/* Invalid State */}
            {state === 'invalid' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <ShieldAlert className="h-24 w-24 text-destructive" />
                  <Badge variant="destructive" className="text-lg px-4 py-1">
                    ⚠ Verification Failed
                  </Badge>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center space-y-3">
                  <p className="font-semibold text-destructive">
                    Document Record Not Found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This document could not be verified in the official CDF Digital System of Record.
                    This may indicate a forged or tampered document.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-amber-800">
                    Report Suspected Fraud
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    If you believe this document was presented as authentic, please report to:
                  </p>
                  <a 
                    href="https://acc.gov.zm" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-medium mt-2"
                  >
                    Anti-Corruption Commission <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <ShieldAlert className="h-24 w-24 text-amber-500" />
                  <Badge variant="outline" className="text-lg px-4 py-1 border-amber-500 text-amber-700">
                    Service Error
                  </Badge>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center space-y-2">
                  <p className="font-medium text-amber-800">
                    Verification Service Unavailable
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {errorMessage || 'Please try again later or contact support.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>CDF Smart Hub - Government of Zambia</p>
          <p className="mt-1">Powered by Blockchain-Grade Document Integrity</p>
        </footer>
      </main>
    </div>
  );
};

export default VerifyDocument;
