
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";

interface LegalDocument {
  id: string;
  type: string;
  locale: string;
  title: string;
  content: string;
  isActive: boolean;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Terms() {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchTermsDocument();
  }, [language]);

  const fetchTermsDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/legal-documents/terms/${language}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Terms and Conditions not found for this language');
        } else {
          throw new Error('Failed to fetch terms and conditions');
        }
        return;
      }

      const data = await response.json();
      setDocument(data);
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('Failed to load Terms and Conditions');
      toast({
        title: "Error",
        description: "Failed to load Terms and Conditions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    // Check if content is HTML or markdown
    if (content.includes('<') && content.includes('>')) {
      // Render as HTML
      return (
        <div 
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    } else {
      // Render as plain text with basic formatting
      return (
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {content}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-bg p-4 flex items-center">
          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-white font-medium text-lg">
            {t('settings.terms')}
          </span>
        </div>

        {/* Loading Content */}
        <div className="p-4">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('common.loading')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="gradient-bg p-4 flex items-center">
          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-white font-medium text-lg">
            {t('settings.terms')}
          </span>
        </div>

        {/* Error Content */}
        <div className="p-4">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Document Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  {error || 'Terms and Conditions are not available at the moment.'}
                </p>
                <Button 
                  onClick={fetchTermsDocument}
                  variant="outline"
                  className="rounded-2xl"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center">
        <Link href="/settings">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <span className="text-white font-medium text-lg">
          {document.title}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              {document.title}
            </CardTitle>
            {document.version && (
              <p className="text-sm text-gray-500">Version: {document.version}</p>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {renderContent(document.content)}
            
            {/* Last Updated */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: {new Date(document.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
