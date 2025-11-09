import { useState } from 'react';
import { HetznerServer, HetznerServerType } from '@/types/hetzner';
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Layers, AlertTriangle, Server, ArrowRight } from 'lucide-react';

interface BulkMigrationDialogProps {
  migrations: Array<{
    server: HetznerServer;
    targetType: HetznerServerType;
    savings: number;
  }>;
  totalSavings: number;
  onConfirm: (powerOnAfter: boolean) => void;
  disabled?: boolean;
}

export function BulkMigrationDialog({ migrations, totalSavings, onConfirm, disabled }: BulkMigrationDialogProps) {
  const [powerOnAfter, setPowerOnAfter] = useState(true);

  const hasARMArchitecture = migrations.some(m => m.targetType.name.toLowerCase().startsWith('cax'));
  const uniqueTargetTypes = new Set(migrations.map(m => m.targetType.name));

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="lg" disabled={disabled} className="gap-2">
          <Layers className="h-5 w-5" />
          Bulk Migrate {migrations.length} Servers
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Bulk Server Migration
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            {/* Migration Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Servers to Migrate</p>
                <p className="text-xl font-bold">{migrations.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Server Types</p>
                <p className="text-sm font-medium">{uniqueTargetTypes.size} different {uniqueTargetTypes.size === 1 ? 'type' : 'types'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Monthly Savings</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  €{totalSavings.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Yearly Savings</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  €{(totalSavings * 12).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Migration Details */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Migration Plan:</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {migrations.map((migration) => (
                  <div key={migration.server.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{migration.server.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        €{migration.savings.toFixed(2)}/mo
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {migration.server.server_type.name}
                      </Badge>
                      <ArrowRight className="h-3 w-3" />
                      <Badge variant={migration.targetType.name.toLowerCase().startsWith('cax') ? "default" : "outline"} className="text-xs">
                        {migration.targetType.name}
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                      <span>{migration.targetType.cores} cores</span>
                      <span>{migration.targetType.memory}GB RAM</span>
                      <span>{migration.targetType.disk}GB disk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs space-y-2">
                <p className="font-semibold">⚠️ Important: Migration Process</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All servers will be powered off during migration</li>
                  <li>Migrations will be performed sequentially (one at a time)</li>
                  <li>This process may take several minutes</li>
                  <li>Backup your data before proceeding</li>
                  {hasARMArchitecture && (
                    <li className="font-semibold text-amber-600 dark:text-amber-400">
                      Some targets use ARM architecture - ensure your applications are compatible
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>

            {/* Power On Option */}
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Checkbox
                id="powerOnAfter"
                checked={powerOnAfter}
                onCheckedChange={(checked) => setPowerOnAfter(checked as boolean)}
              />
              <Label
                htmlFor="powerOnAfter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Automatically power on all servers after migration
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(powerOnAfter)}>
            Proceed with Bulk Migration
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
