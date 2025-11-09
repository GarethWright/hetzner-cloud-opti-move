import { HetznerServer } from '@/types/hetzner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Cpu, HardDrive, MapPin } from 'lucide-react';

interface ServerCardProps {
  server: HetznerServer;
}

export const ServerCard = ({ server }: ServerCardProps) => {
  const monthlyPrice = server.server_type.prices[0]?.price_monthly.gross 
    ? parseFloat(server.server_type.prices[0].price_monthly.gross).toFixed(2)
    : 'N/A';
  const statusColor = server.status === 'running' ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {server.name}
          </div>
          <Badge variant="outline" className="gap-1">
            <div className={`h-2 w-2 rounded-full ${statusColor}`} />
            {server.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>{server.server_type.cores} vCPU</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{server.server_type.memory}GB RAM</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{server.server_type.disk}GB Disk</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{server.datacenter.location.city}</span>
          </div>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Badge variant="secondary">{server.server_type.name}</Badge>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Monthly Cost:</span>
            <span className="font-semibold">€{monthlyPrice}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
