export interface HetznerServer {
  id: number;
  name: string;
  status: string;
  server_type: {
    id: number;
    name: string;
    cores: number;
    memory: number;
    disk: number;
    prices: Array<{
      location: string;
      price_hourly: {
        gross: string;
        net: string;
      };
      price_monthly: {
        gross: string;
        net: string;
      };
    }>;
  };
  datacenter: {
    id: number;
    name: string;
    location: {
      id: number;
      name: string;
      city: string;
      country: string;
    };
  };
  image: {
    id: number;
    name: string;
    description: string;
  };
  created: string;
}

export interface HetznerServerType {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
  prices: Array<{
    location: string;
    price_hourly: {
      gross: string;
      net: string;
    };
    price_monthly: {
      gross: string;
      net: string;
    };
  }>;
}

export interface CostAlternative {
  serverType: HetznerServerType;
  monthlySavings: number;
  yearlyPotentialSavings: number;
  comparisonType: 'same' | 'better';
}
