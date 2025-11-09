import { useState } from 'react';
import { HetznerServer, HetznerServerType, CostAlternative } from '@/types/hetzner';
import { useHetzner } from '@/hooks/useHetzner';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { ServerCard } from '@/components/ServerCard';
import { AlternativeCard } from '@/components/AlternativeCard';
import { BulkMigrationDialog } from '@/components/BulkMigrationDialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { Cloud, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [servers, setServers] = useState<HetznerServer[]>([]);
  const [serverTypes, setServerTypes] = useState<HetznerServerType[]>([]);
  const [alternatives, setAlternatives] = useState<Map<number, CostAlternative[]>>(new Map());
  const [selectedServers, setSelectedServers] = useState<Set<number>>(new Set());
  const [bulkMigrating, setBulkMigrating] = useState(false);
  const { loading, getServers, getServerTypes, changeServerType } = useHetzner();

  const findCostAlternatives = (
    server: HetznerServer,
    allServerTypes: HetznerServerType[]
  ): CostAlternative[] => {
    const currentType = server.server_type;
    const currentPrice = parseFloat(currentType.prices[0]?.price_monthly.gross || '0');
    
    return allServerTypes
      .filter(type => {
        // Must be cheaper or same price with better specs
        const typePrice = parseFloat(type.prices[0]?.price_monthly.gross || '0');
        if (typePrice >= currentPrice) return false;
        
        // Must have same or better specs
        return (
          type.cores >= currentType.cores &&
          type.memory >= currentType.memory &&
          type.disk >= currentType.disk
        );
      })
      .map(type => {
        const typePrice = parseFloat(type.prices[0]?.price_monthly.gross || '0');
        const monthlySavings = currentPrice - typePrice;
        const yearlyPotentialSavings = monthlySavings * 12;
        
        const isBetter =
          type.cores > currentType.cores ||
          type.memory > currentType.memory ||
          type.disk > currentType.disk;
        
        return {
          serverType: type,
          monthlySavings,
          yearlyPotentialSavings,
          comparisonType: isBetter ? 'better' : 'same',
        } as CostAlternative;
      })
      .sort((a, b) => b.monthlySavings - a.monthlySavings);
  };

  const handleFetchServers = async (key: string) => {
    setApiKey(key);
    sessionStorage.setItem('hetzner_api_key', key);
    
    const [fetchedServers, fetchedTypes] = await Promise.all([
      getServers(key),
      getServerTypes(key),
    ]);
    
    setServers(fetchedServers);
    setServerTypes(fetchedTypes);
    
    const newAlternatives = new Map<number, CostAlternative[]>();
    fetchedServers.forEach(server => {
      const alts = findCostAlternatives(server, fetchedTypes);
      if (alts.length > 0) {
        newAlternatives.set(server.id, alts);
      }
    });
    setAlternatives(newAlternatives);
  };

  const handleRefresh = () => {
    const storedKey = sessionStorage.getItem('hetzner_api_key');
    if (storedKey) {
      handleFetchServers(storedKey);
    }
  };

  const handleMigrate = async (serverId: number, newServerTypeName: string, powerOnAfter: boolean) => {
    if (!apiKey) return;
    await changeServerType(apiKey, serverId, newServerTypeName, false, powerOnAfter);
    handleRefresh();
  };

  const toggleServerSelection = (serverId: number) => {
    const newSelection = new Set(selectedServers);
    if (newSelection.has(serverId)) {
      newSelection.delete(serverId);
    } else {
      newSelection.add(serverId);
    }
    setSelectedServers(newSelection);
  };

  const selectAllServers = () => {
    const serversWithAlternatives = servers.filter(s => alternatives.has(s.id));
    setSelectedServers(new Set(serversWithAlternatives.map(s => s.id)));
  };

  const clearSelection = () => {
    setSelectedServers(new Set());
  };

  const getBulkMigrationSummary = (): { migrations: Array<{ server: HetznerServer; targetType: HetznerServerType; savings: number }>; totalSavings: number } | null => {
    if (selectedServers.size === 0) return null;

    const selectedServersList = servers.filter(s => selectedServers.has(s.id));
    if (selectedServersList.length === 0) return null;

    // Check if all selected servers have the same architecture
    const architectures = new Set(
      selectedServersList.map(s => s.server_type.name.toLowerCase().startsWith('cax') ? 'arm' : 'x86')
    );
    if (architectures.size > 1) return null; // Mixed architectures

    // Build migration plan with each server's best alternative
    const migrations = selectedServersList
      .map(server => {
        const serverAlts = alternatives.get(server.id) || [];
        if (serverAlts.length === 0) return null;
        
        const bestAlt = serverAlts[0]; // First alternative is the best (already sorted)
        return {
          server,
          targetType: bestAlt.serverType,
          savings: bestAlt.monthlySavings
        };
      })
      .filter(m => m !== null) as Array<{ server: HetznerServer; targetType: HetznerServerType; savings: number }>;

    if (migrations.length === 0) return null;

    const totalSavings = migrations.reduce((sum, m) => sum + m.savings, 0);

    return { migrations, totalSavings };
  };

  const handleBulkMigrate = async (powerOnAfter: boolean) => {
    if (!apiKey || selectedServers.size === 0) return;

    const summary = getBulkMigrationSummary();
    if (!summary) return;

    setBulkMigrating(true);

    for (const migration of summary.migrations) {
      try {
        await changeServerType(apiKey, migration.server.id, migration.targetType.name, false, powerOnAfter);
      } catch (error) {
        console.error(`Failed to migrate server ${migration.server.name}:`, error);
      }
    }

    setBulkMigrating(false);
    clearSelection();
    handleRefresh();
  };

  const totalMonthlySavings = Array.from(alternatives.values())
    .flat()
    .reduce((sum, alt) => sum + alt.monthlySavings, 0);

  const totalYearlySavings = totalMonthlySavings * 12;
  
  const serversWithAlternatives = alternatives.size;
  const totalAlternatives = Array.from(alternatives.values()).reduce((sum, alts) => sum + alts.length, 0);
  
  const hasARMAlternatives = Array.from(alternatives.values())
    .flat()
    .some(alt => alt.serverType.name.toLowerCase().startsWith('cax'));

  const bulkMigrationSummary = getBulkMigrationSummary();
  const selectedServersList = servers.filter(s => selectedServers.has(s.id));
  const hasMixedArchitectures = selectedServersList.length > 0 && (() => {
    const architectures = new Set(
      selectedServersList.map(s => s.server_type.name.toLowerCase().startsWith('cax') ? 'arm' : 'x86')
    );
    return architectures.size > 1;
  })();

  if (!apiKey || servers.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Cloud className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Hetzner Cost Optimizer</h1>
            <p className="text-muted-foreground">
              Find cost-effective alternatives for your Hetzner Cloud servers
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <ApiKeyInput onSubmit={handleFetchServers} loading={loading} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Servers</h1>
            <p className="text-muted-foreground">
              {servers.length} server{servers.length !== 1 ? 's' : ''} found
              {selectedServers.size > 0 && (
                <Badge variant="default" className="ml-2">
                  {selectedServers.size} selected
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedServers.size > 0 && (
              <>
                {hasMixedArchitectures ? (
                  <Alert className="inline-flex items-center px-3 py-2 border-amber-500 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                    <span className="text-sm text-amber-800 dark:text-amber-200">
                      Cannot bulk migrate: Mixed architectures (ARM + x86)
                    </span>
                  </Alert>
                ) : bulkMigrationSummary ? (
                  <BulkMigrationDialog
                    migrations={bulkMigrationSummary.migrations}
                    totalSavings={bulkMigrationSummary.totalSavings}
                    onConfirm={handleBulkMigrate}
                    disabled={bulkMigrating || loading}
                  />
                ) : (
                  <Badge variant="secondary" className="px-3 py-2">
                    No alternatives found for selected servers
                  </Badge>
                )}
                <Button onClick={clearSelection} variant="outline" size="sm">
                  Clear Selection
                </Button>
              </>
            )}
            {selectedServers.size === 0 && serversWithAlternatives > 1 && (
              <Button onClick={selectAllServers} variant="secondary" size="sm">
                Select All ({serversWithAlternatives})
              </Button>
            )}
            <Button onClick={handleRefresh} disabled={loading || bulkMigrating} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${(loading || bulkMigrating) ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {alternatives.size > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800 space-y-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">💰 Cost Optimization Summary</h2>
                <p className="text-sm text-muted-foreground">
                  Analysis of {servers.length} server{servers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-background/60 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Servers with Alternatives</p>
                <p className="text-2xl font-bold">{serversWithAlternatives} / {servers.length}</p>
              </div>
              <div className="bg-background/60 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Alternatives Found</p>
                <p className="text-2xl font-bold">{totalAlternatives}</p>
              </div>
              <div className="bg-background/60 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Potential Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  €{totalMonthlySavings.toFixed(2)}
                </p>
              </div>
              <div className="bg-background/60 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Potential Yearly Savings</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  €{totalYearlySavings.toFixed(2)}
                </p>
              </div>
            </div>

            {serversWithAlternatives > 1 && (
              <Alert className="border-primary bg-primary/10">
                <Layers className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  <p className="font-semibold mb-1">💡 Tip: Use Bulk Migration</p>
                  <p>Select multiple servers using the checkboxes below to migrate them all at once to their individual best alternatives.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {hasARMAlternatives && (
              <Alert className="border-amber-500 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  Some alternatives use ARM architecture. Review compatibility before migrating.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {servers.map(server => {
          const serverAlternatives = alternatives.get(server.id) || [];
          const hasAlternatives = serverAlternatives.length > 0;
          const isSelected = selectedServers.has(server.id);
          
          return (
            <div key={server.id} className="space-y-4">
              <div className={`flex items-start gap-3 transition-all ${isSelected ? 'ring-2 ring-primary rounded-lg p-2' : ''}`}>
                {hasAlternatives && (
                  <div className="flex items-center pt-6">
                    <Checkbox
                      id={`server-${server.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleServerSelection(server.id)}
                      className="h-5 w-5"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <ServerCard server={server} />
              
              {serverAlternatives.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                      {serverAlternatives.length} cost-effective alternative
                      {serverAlternatives.length !== 1 ? 's' : ''} found
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {serverAlternatives.map((alt, idx) => (
                      <AlternativeCard
                        key={idx}
                        alternative={alt}
                        currentServerName={server.name}
                        onMigrate={(powerOnAfter) => handleMigrate(server.id, alt.serverType.name, powerOnAfter)}
                        loading={loading}
                      />
                    ))}
                  </div>
                </>
              )}
              
                  {serverAlternatives.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No cost-effective alternatives found for this server
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Index;
