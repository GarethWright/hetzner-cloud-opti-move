import { CostAlternative } from '@/types/hetzner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TrendingDown, Cpu, HardDrive, ArrowRight, AlertTriangle, Power } from 'lucide-react';

interface AlternativeCardProps {
  alternative: CostAlternative;
  currentServerName: string;
  onMigrate: () => void;
  loading?: boolean;
}

export const AlternativeCard = ({
  alternative,
  currentServerName,
  onMigrate,
  loading,
}: AlternativeCardProps) => {
  const monthlyPrice = alternative.serverType.prices[0]?.price_monthly.gross
    ? parseFloat(alternative.serverType.prices[0].price_monthly.gross).toFixed(2)
    : 'N/A';
  
  // Determine architecture based on server type name
  const isARM = alternative.serverType.name.toLowerCase().startsWith('cax');
  const architecture = isARM ? 'ARM (Ampere Altra)' : 'x86 (AMD/Intel)';
  const architectureShort = isARM ? 'ARM' : 'x86';

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
            {alternative.serverType.name}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{architectureShort}</Badge>
            <Badge variant={alternative.comparisonType === 'better' ? 'default' : 'secondary'}>
              {alternative.comparisonType === 'better' ? 'Better Specs' : 'Same Specs'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>{alternative.serverType.cores} vCPU</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{alternative.serverType.memory}GB RAM</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{alternative.serverType.disk}GB Disk</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Architecture:</span>
            <span className="font-medium">{architecture}</span>
          </div>
        </div>

        {isARM && (
          <Alert className="border-amber-500 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-xs space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                ⚠️ Architecture Compatibility Check Required
              </p>
              <p className="text-amber-800 dark:text-amber-200">
                This is an ARM-based server. Verify your applications and dependencies support ARM64 architecture before migrating.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {!isARM && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-xs text-green-800 dark:text-green-200 font-medium">
              ✓ Same x86 architecture - Full compatibility with your current setup
            </AlertDescription>
          </Alert>
        )}
        
        <div className="pt-2 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly Cost:</span>
            <span className="font-semibold">€{monthlyPrice}</span>
          </div>
          <div className="flex justify-between items-center text-green-600 dark:text-green-400">
            <span className="text-sm font-medium">Monthly Savings:</span>
            <span className="font-bold">€{alternative.monthlySavings.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-green-600 dark:text-green-400">
            <span className="text-sm font-medium">Yearly Savings:</span>
            <span className="font-bold">€{alternative.yearlyPotentialSavings.toFixed(2)}</span>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={loading} className="w-full gap-2">
              {loading ? 'Migrating...' : (
                <>
                  Migrate to {alternative.serverType.name}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Power className="h-5 w-5 text-destructive" />
                Confirm Server Migration
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-left">
                <p className="font-semibold text-foreground">
                  This will migrate <span className="font-bold">{currentServerName}</span> to {alternative.serverType.name}
                </p>
                
                <Alert className="border-amber-500 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">⚠️ Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your server will be <strong>powered off</strong> automatically</li>
                      <li>Migration takes several minutes</li>
                      <li>You'll need to manually power on the server after migration</li>
                      {isARM && <li className="text-amber-900 dark:text-amber-100"><strong>Verify ARM compatibility first!</strong></li>}
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <p className="text-sm">
                  After migration, log into your Hetzner console to power on the server.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onMigrate} className="bg-destructive hover:bg-destructive/90">
                Proceed with Migration
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
