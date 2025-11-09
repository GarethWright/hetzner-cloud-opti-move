import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, ExternalLink, Info } from 'lucide-react';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
  loading?: boolean;
}

export const ApiKeyInput = ({ onSubmit, loading }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="font-semibold">How to get your Hetzner API key:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Log in to your Hetzner Cloud Console</li>
            <li>Go to Security → API Tokens</li>
            <li>Click "Generate API Token"</li>
            <li>Give it a name and select "Read & Write" permissions</li>
            <li>Copy the token and paste it below</li>
          </ol>
          <a
            href="https://console.hetzner.cloud/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open Hetzner Cloud Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="api-key" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Hetzner Cloud API Key
        </Label>
        <div className="relative">
          <Input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Hetzner API key"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Your API key is stored only in your browser session and never sent to our servers.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading || !apiKey.trim()}>
        {loading ? 'Loading...' : 'Fetch Servers'}
      </Button>
    </form>
  );
};
