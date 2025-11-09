import { useState } from 'react';
import { HetznerServer, HetznerServerType, CostAlternative } from '@/types/hetzner';
import { useHetzner } from '@/hooks/useHetzner';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { ServerCard } from '@/components/ServerCard';
import { AlternativeCard } from '@/components/AlternativeCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Cloud, RefreshCw } from 'lucide-react';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [servers, setServers] = useState<HetznerServer[]>([]);
  const [serverTypes, setServerTypes] = useState<HetznerServerType[]>([]);
  const [alternatives, setAlternatives] = useState<Map<number, CostAlternative[]>>(new Map());
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

  const handleMigrate = async (serverId: number, newServerTypeId: number) => {
    if (!apiKey) return;
    await changeServerType(apiKey, serverId, newServerTypeId);
    handleRefresh();
  };

  const totalMonthlySavings = Array.from(alternatives.values())
    .flat()
    .reduce((sum, alt) => sum + alt.monthlySavings, 0);

  const totalYearlySavings = totalMonthlySavings * 12;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Servers</h1>
            <p className="text-muted-foreground">
              {servers.length} server{servers.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {alternatives.size > 0 && (
          <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <h2 className="text-2xl font-bold mb-2">Potential Savings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  €{totalMonthlySavings.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yearly</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  €{totalYearlySavings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {servers.map(server => {
          const serverAlternatives = alternatives.get(server.id) || [];
          
          return (
            <div key={server.id} className="space-y-4">
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
                        onMigrate={() => handleMigrate(server.id, alt.serverType.id)}
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
          );
        })}
      </div>
    </div>
  );
};

export default Index;
