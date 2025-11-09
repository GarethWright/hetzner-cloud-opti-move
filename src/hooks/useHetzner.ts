import { useState } from 'react';
import { HetznerServer, HetznerServerType } from '@/types/hetzner';
import { useToast } from '@/hooks/use-toast';

const HETZNER_API_BASE = 'https://api.hetzner.cloud/v1';

export const useHetzner = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWithAuth = async (
    endpoint: string, 
    apiKey: string, 
    method: string = 'GET',
    body?: any
  ) => {
    const response = await fetch(`${HETZNER_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
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
      await fetchWithAuth(`/servers/${serverId}/actions/rebuild`, apiKey, 'POST', { image });
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

  const waitForServerStatus = async (
    apiKey: string,
    serverId: number,
    targetStatus: string,
    maxAttempts: number = 30
  ): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const data = await fetchWithAuth(`/servers/${serverId}`, apiKey);
        if (data.server.status === targetStatus) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error checking server status:', error);
      }
    }
    return false;
  };

  const changeServerType = async (
    apiKey: string,
    serverId: number,
    serverType: string,
    upgradeDisk: boolean = false,
    powerOnAfter: boolean = true
  ) => {
    setLoading(true);
    try {
      // First, check if server is already off
      const serverData = await fetchWithAuth(`/servers/${serverId}`, apiKey);
      
      if (serverData.server.status !== 'off') {
        toast({
          title: 'Powering off server',
          description: 'Server must be offline to change type...',
        });
        
        await fetchWithAuth(
          `/servers/${serverId}/actions/poweroff`, 
          apiKey, 
          'POST'
        );
        
        // Wait for server to be fully powered off
        const isOff = await waitForServerStatus(apiKey, serverId, 'off');
        if (!isOff) {
          throw new Error('Server did not power off in time');
        }
      }
      
      // Now change the server type
      toast({
        title: 'Changing server type',
        description: 'Migrating to new server type...',
      });
      
      const changeResult = await fetchWithAuth(
        `/servers/${serverId}/actions/change_type`, 
        apiKey, 
        'POST',
        { 
          server_type: serverType,
          upgrade_disk: upgradeDisk 
        }
      );
      
      if (powerOnAfter) {
        toast({
          title: 'Migration complete',
          description: 'Powering server back on...',
        });
        
        // Wait for the change_type action to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Power the server back on
        await fetchWithAuth(
          `/servers/${serverId}/actions/poweron`, 
          apiKey, 
          'POST'
        );
        
        toast({
          title: 'Migration successful',
          description: 'Server has been migrated and is now powering on.',
        });
      } else {
        toast({
          title: 'Migration successful',
          description: 'Server type has been changed. You can power it back on from the Hetzner console.',
        });
      }
    } catch (error) {
      toast({
        title: 'Migration failed',
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
