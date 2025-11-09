import React, { useState } from 'react';
import { HetznerServer, HetznerServerType } from '@/types/hetzner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Layers, AlertTriangle, Power, ArrowRight } from 'lucide-react';

interface BulkMigrationDialogProps {
  servers: HetznerServer[];
  targetServerType: HetznerServerType;
  totalSavings: number;
  onConfirm: (powerOnAfter: boolean) => void;
  disabled?: boolean;
}

export const BulkMigrationDialog = ({
  servers,
  targetServerType,
  totalSavings,
  onConfirm,
  disabled,
}: BulkMigrationDialogProps) => {
  const [powerOnAfter, setPowerOnAfter] = useState(true);

  const isARM = targetServerType.name.toLowerCase().startsWith('cax');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled} variant="default" size="lg" className="gap-2">
          <Layers className="h-5 w-5" />
          Bulk Migrate {servers.length} Servers
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Bulk Server Migration
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <div>
              <p className="font-semibold text-foreground mb-2">
                Migrating {servers.length} server{servers.length !== 1 ? 's' : ''} to {targetServerType.name}
              </p>
              
              <div className="bg-muted rounded-md p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Target Server Type:</span>
                  <Badge>{targetServerType.name}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Architecture:</span>
                  <Badge variant={isARM ? 'secondary' : 'outline'}>
                    {isARM ? 'ARM' : 'x86'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
                  <span>Total Monthly Savings:</span>
                  <span>€{totalSavings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Servers to migrate:</p>
              <ul className="space-y-1 text-sm">
                {servers.map(server => (
                  <li key={server.id} className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    {server.name}
                    <span className="text-muted-foreground">
                      ({server.server_type.name} → {targetServerType.name})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Alert className="border-amber-500 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">⚠️ Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All servers will be <strong>powered off</strong> automatically</li>
                  <li>Migrations will run sequentially (one at a time)</li>
                  <li>This process may take 10-15 minutes total</li>
                  {isARM && <li className="text-amber-900 dark:text-amber-100"><strong>Verify ARM compatibility for all servers!</strong></li>}
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2 p-3 bg-background rounded-md border">
              <Checkbox 
                id="bulk-power-on" 
                checked={powerOnAfter}
                onCheckedChange={(checked) => setPowerOnAfter(checked as boolean)}
              />
              <Label htmlFor="bulk-power-on" className="text-sm cursor-pointer">
                Automatically power on all servers after migration
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(powerOnAfter)} 
            className="bg-primary hover:bg-primary/90"
          >
            <Power className="h-4 w-4 mr-2" />
            Proceed with Bulk Migration
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
