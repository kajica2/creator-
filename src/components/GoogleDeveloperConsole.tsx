import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings,
  Key,
  Cloud,
  Code,
  Database,
  Shield,
  BarChart3,
  Globe,
  RefreshCw
} from 'lucide-react';

interface GoogleService {
  id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled' | 'error';
  apiKey?: string;
  quotaUsed?: number;
  quotaLimit?: number;
  icon: React.ReactNode;
  consoleUrl: string;
  category: 'AI' | 'Storage' | 'Analytics' | 'Auth' | 'Compute';
}

const googleServices: GoogleService[] = [
  {
    id: 'gemini-api',
    name: 'Gemini API',
    description: 'Google AI language model for text generation and analysis',
    status: 'enabled',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY ? '****' + import.meta.env.VITE_GEMINI_API_KEY.slice(-4) : undefined,
    quotaUsed: 2500,
    quotaLimit: 100000,
    icon: <Code className="w-5 h-5" />,
    consoleUrl: 'https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com',
    category: 'AI'
  },
  {
    id: 'oauth2',
    name: 'OAuth 2.0',
    description: 'Google Sign-In and user authentication',
    status: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'enabled' : 'disabled',
    icon: <Shield className="w-5 h-5" />,
    consoleUrl: 'https://console.cloud.google.com/apis/credentials',
    category: 'Auth'
  },
  {
    id: 'cloud-storage',
    name: 'Cloud Storage',
    description: 'File storage and content delivery',
    status: 'disabled',
    icon: <Cloud className="w-5 h-5" />,
    consoleUrl: 'https://console.cloud.google.com/storage',
    category: 'Storage'
  },
  {
    id: 'analytics',
    name: 'Google Analytics',
    description: 'Web analytics and user behavior tracking',
    status: 'disabled',
    icon: <BarChart3 className="w-5 h-5" />,
    consoleUrl: 'https://analytics.google.com/',
    category: 'Analytics'
  },
  {
    id: 'maps-api',
    name: 'Maps API',
    description: 'Location services and mapping functionality',
    status: 'disabled',
    icon: <Globe className="w-5 h-5" />,
    consoleUrl: 'https://console.cloud.google.com/apis/library/maps-backend.googleapis.com',
    category: 'Compute'
  },
  {
    id: 'firestore',
    name: 'Firestore Database',
    description: 'NoSQL document database',
    status: 'disabled',
    icon: <Database className="w-5 h-5" />,
    consoleUrl: 'https://console.firebase.google.com/',
    category: 'Storage'
  }
];

const getCategoryColor = (category: string) => {
  const colors = {
    'AI': 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    'Storage': 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'Analytics': 'bg-green-600/20 text-green-300 border-green-500/30',
    'Auth': 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
    'Compute': 'bg-red-600/20 text-red-300 border-red-500/30'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-600/20 text-gray-300';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'enabled':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return <XCircle className="w-4 h-4 text-gray-400" />;
  }
};

export function GoogleDeveloperConsole() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = ['All', 'AI', 'Storage', 'Analytics', 'Auth', 'Compute'];

  const filteredServices = selectedCategory === 'All'
    ? googleServices
    : googleServices.filter(service => service.category === selectedCategory);

  const enabledServices = googleServices.filter(s => s.status === 'enabled').length;
  const totalQuotaUsed = googleServices.reduce((sum, s) => sum + (s.quotaUsed || 0), 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call to refresh service status
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const projectId = import.meta.env.VITE_GOOGLE_PROJECT_ID || 'your-project-id';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Google Developer Console
            </h1>
            <p className="text-xl text-gray-300">
              Manage your Google Cloud Platform services and APIs
            </p>
            <Badge className="mt-2 bg-blue-600/20 text-blue-300">
              Project: {projectId}
            </Badge>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {/* Setup Instructions */}
        <Alert className="mb-8 bg-blue-900/20 border-blue-500/30">
          <Settings className="w-4 h-4" />
          <AlertDescription className="text-blue-200">
            <strong>Setup Required:</strong> To connect your Google Developer Console:
            <br />
            1. Visit <a href="https://console.cloud.google.com/" className="text-blue-400 hover:underline" target="_blank" rel="noopener">Google Cloud Console</a>
            <br />
            2. Create or select a project
            <br />
            3. Enable required APIs and create credentials
            <br />
            4. Update your .env.local file with the credentials
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">{enabledServices}</div>
                  <div className="text-sm text-gray-400">Active Services</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-purple-400">{totalQuotaUsed.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">API Calls Today</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Key className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-blue-400">{googleServices.length}</div>
                  <div className="text-sm text-gray-400">Available APIs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-yellow-400">Active</div>
                  <div className="text-sm text-gray-400">Project Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`${
                selectedCategory === category
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "border-gray-600 text-gray-300 hover:bg-purple-600/10"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="bg-gray-800/30 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300">
                      {service.icon}
                    </div>
                    <CardTitle className="text-lg text-white">
                      {service.name}
                    </CardTitle>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                <div className="flex gap-2">
                  <Badge className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                  <Badge
                    variant={service.status === 'enabled' ? 'default' : 'secondary'}
                    className={service.status === 'enabled' ? 'bg-green-600' : 'bg-gray-600'}
                  >
                    {service.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  {service.description}
                </p>

                {service.apiKey && (
                  <div className="mb-3 p-2 bg-gray-900/50 rounded text-xs">
                    <span className="text-gray-500">API Key: </span>
                    <span className="text-green-400 font-mono">{service.apiKey}</span>
                  </div>
                )}

                {service.quotaUsed && service.quotaLimit && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Quota Usage</span>
                      <span>{service.quotaUsed?.toLocaleString()} / {service.quotaLimit?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${(service.quotaUsed / service.quotaLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-purple-400 border-purple-500/30 hover:bg-purple-600/10"
                    asChild
                  >
                    <a href={service.consoleUrl} target="_blank" rel="noopener noreferrer">
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300"
                    asChild
                  >
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 p-6 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4 border-blue-500/30 hover:bg-blue-600/10"
              asChild
            >
              <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener">
                <Code className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">API Library</div>
                  <div className="text-sm text-gray-400">Browse and enable APIs</div>
                </div>
              </a>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4 border-green-500/30 hover:bg-green-600/10"
              asChild
            >
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">
                <Key className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Credentials</div>
                  <div className="text-sm text-gray-400">Manage API keys & OAuth</div>
                </div>
              </a>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4 border-purple-500/30 hover:bg-purple-600/10"
              asChild
            >
              <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener">
                <BarChart3 className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Usage Dashboard</div>
                  <div className="text-sm text-gray-400">Monitor API usage</div>
                </div>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}