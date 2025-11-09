import { useState } from 'react';
import { HetznerServer, HetznerServerType } from '@/types/hetzner';
import { useToast } from '@/hooks/use-toast';

const HETZNER_API_BASE = 'https://api.hetzner.cloud/v1';

export const useHetzner = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWithAuth = async (endpoint: string, apiKey: string) => {
    const response = await fetch(`${HETZNER_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const getServers = async (apiKey: string): Promise<HetznerServer[]> => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/servers', apiKey);
      return data.servers;
    } catch (error) {
      toast({
        title: 'Error fetching servers',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getServerTypes = async (apiKey: string): Promise<HetznerServerType[]> => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/server_types', apiKey);
      return data.server_types;
    } catch (error) {
      toast({
        title: 'Error fetching server types',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const rebuildServer = async (apiKey: string, serverId: number, image: string) => {
    setLoading(true);
    try {
      await fetchWithAuth(`/servers/${serverId}/actions/rebuild`, apiKey);
      toast({
        title: 'Server rebuild initiated',
        description: 'Your server is being rebuilt. This may take a few minutes.',
      });
    } catch (error) {
      toast({
        title: 'Error rebuilding server',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changeServerType = async (
    apiKey: string,
    serverId: number,
    serverTypeId: number,
    upgradeDisk: boolean = false
  ) => {
    setLoading(true);
    try {
      await fetchWithAuth(`/servers/${serverId}/actions/change_type`, apiKey);
      toast({
        title: 'Server type change initiated',
        description: 'Your server is being migrated. This may take several minutes.',
      });
    } catch (error) {
      toast({
        title: 'Error changing server type',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getServers,
    getServerTypes,
    rebuildServer,
    changeServerType,
  };
};
