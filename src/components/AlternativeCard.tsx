import { CostAlternative } from '@/types/hetzner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, Cpu, HardDrive, ArrowRight } from 'lucide-react';

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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
            {alternative.serverType.name}
          </div>
          <Badge variant={alternative.comparisonType === 'better' ? 'default' : 'secondary'}>
            {alternative.comparisonType === 'better' ? 'Better Specs' : 'Same Specs'}
          </Badge>
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

        <Button onClick={onMigrate} disabled={loading} className="w-full gap-2">
          {loading ? 'Migrating...' : (
            <>
              Migrate to {alternative.serverType.name}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
