import {
  Globe, KeyRound, HardDrive, Database, Monitor, Container,
  Network, Brain, Search, BarChart3, Workflow, MessageSquare,
  Radio, Shield, Eye, Gauge, Bot, Sparkles, Cpu,
  ServerCog, Cloudy, LayoutGrid, Boxes, Cable, Waypoints,
  type LucideIcon,
} from 'lucide-react'

interface AzureIconConfig {
  icon: LucideIcon
  bg: string    // tailwind bg class
  text: string  // tailwind text class
  label: string // short human-readable name
}

const AZURE_ICON_MAP: Record<string, AzureIconConfig> = {
  // Legacy microsoft.* keys
  'microsoft.web/sites':                        { icon: Globe,       bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'App Service' },
  'microsoft.web/staticsites':                  { icon: Globe,       bg: 'bg-sky-50',      text: 'text-sky-600',     label: 'Static Web App' },
  'microsoft.search/searchservices':            { icon: Search,      bg: 'bg-purple-50',   text: 'text-purple-600',  label: 'Search Service' },
  'microsoft.cognitiveservices/accounts':       { icon: Brain,       bg: 'bg-violet-50',   text: 'text-violet-600',  label: 'Cognitive Services' },
  'microsoft.cognitiveservices/aiservices':     { icon: Sparkles,    bg: 'bg-violet-50',   text: 'text-violet-600',  label: 'AI Services' },
  'microsoft.machinelearningservices/workspaces': { icon: Cpu,      bg: 'bg-indigo-50',   text: 'text-indigo-600',  label: 'ML Workspace' },
  'microsoft.keyvault/vaults':                  { icon: KeyRound,    bg: 'bg-yellow-50',   text: 'text-yellow-600',  label: 'Key Vault' },
  'microsoft.documentdb/databaseaccounts':      { icon: Database,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Cosmos DB' },
  'microsoft.logic/workflows':                  { icon: Workflow,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Logic App' },
  'microsoft.insights/components':              { icon: BarChart3,   bg: 'bg-purple-50',   text: 'text-purple-600',  label: 'App Insights' },
  'microsoft.storage/storageaccounts':          { icon: HardDrive,   bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'Storage' },
  'microsoft.sql/servers':                      { icon: Database,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'SQL Server' },
  'microsoft.datafactory/factories':            { icon: Workflow,    bg: 'bg-green-50',    text: 'text-green-600',   label: 'Data Factory' },
  'microsoft.containerregistry/registries':     { icon: Container,   bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Container Registry' },
  'microsoft.containerapps/containerapps':      { icon: Boxes,       bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Container App' },
  'microsoft.kubernetes/connectedclusters':     { icon: LayoutGrid,  bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Kubernetes' },
  'microsoft.network/virtualnetworks':          { icon: Network,     bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'VNet' },
  'microsoft.network/applicationgateways':      { icon: Cable,       bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'App Gateway' },
  'microsoft.network/loadbalancers':            { icon: Waypoints,   bg: 'bg-purple-50',   text: 'text-purple-600',  label: 'Load Balancer' },
  'microsoft.compute/virtualmachines':          { icon: Monitor,     bg: 'bg-sky-50',      text: 'text-sky-600',     label: 'Virtual Machine' },
  'microsoft.eventhub/namespaces':              { icon: Radio,       bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Event Hub' },
  'microsoft.servicebus/namespaces':            { icon: MessageSquare, bg: 'bg-blue-50',   text: 'text-blue-600',    label: 'Service Bus' },
  'microsoft.cache/redis':                      { icon: Gauge,       bg: 'bg-red-50',      text: 'text-red-500',     label: 'Redis Cache' },
  'microsoft.signalrservice/signalr':           { icon: Radio,       bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'SignalR' },
  'microsoft.apimanagement/service':            { icon: ServerCog,   bg: 'bg-cyan-50',     text: 'text-cyan-600',    label: 'API Management' },
  'microsoft.dbforpostgresql/flexibleservers':  { icon: Database,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'PostgreSQL' },
  'microsoft.dbformysql/flexibleservers':       { icon: Database,    bg: 'bg-orange-50',   text: 'text-orange-600',  label: 'MySQL' },
  'microsoft.monitor/accounts':                 { icon: Eye,         bg: 'bg-green-50',    text: 'text-green-600',   label: 'Monitor' },
  'microsoft.dashboard/grafana':                { icon: BarChart3,   bg: 'bg-orange-50',   text: 'text-orange-600',  label: 'Grafana' },
  'microsoft.managedidentity/userassignedidentities': { icon: Shield, bg: 'bg-yellow-50', text: 'text-yellow-600',  label: 'Managed Identity' },
  'microsoft.authorization/roleassignments':    { icon: Shield,      bg: 'bg-yellow-50',   text: 'text-yellow-600',  label: 'Role Assignment' },
  'microsoft.operationalinsights/workspaces':   { icon: BarChart3,   bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Log Analytics' },
  'microsoft.cdn/profiles':                     { icon: Cloudy,      bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'CDN' },
  'microsoft.communication/communicationservices': { icon: MessageSquare, bg: 'bg-blue-50', text: 'text-blue-600',  label: 'Communication' },
  'microsoft.botservice/botservices':           { icon: Bot,         bg: 'bg-green-50',    text: 'text-green-600',   label: 'Bot Service' },
  'microsoft.openai/accounts':                  { icon: Sparkles,    bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'OpenAI' },

  // Friendly display names (from resource type dropdown)
  'azure app service (web app)':                { icon: Globe,       bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Azure App Service (Web app)' },
  'app service plan':                           { icon: ServerCog,   bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'App Service Plan' },
  'static web app':                             { icon: Globe,       bg: 'bg-sky-50',      text: 'text-sky-600',     label: 'Static Web App' },
  'azure cosmosdb for postgresql cluster':      { icon: Database,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Azure CosmosDB for PostgreSQL Cluster' },
  'azure cosmos db database':                   { icon: Database,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Azure Cosmos DB database' },
  'storage account':                            { icon: HardDrive,   bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'Storage Account' },
  'ai search':                                  { icon: Search,      bg: 'bg-purple-50',   text: 'text-purple-600',  label: 'AI Search' },
  'azure ai foundry':                           { icon: Cpu,         bg: 'bg-indigo-50',   text: 'text-indigo-600',  label: 'Azure AI Foundry' },
  'azure ai services multi-service account':    { icon: Sparkles,    bg: 'bg-violet-50',   text: 'text-violet-600',  label: 'Azure AI services multi-service account' },
  'computer vision':                            { icon: Eye,         bg: 'bg-green-50',    text: 'text-green-600',   label: 'Computer vision' },
  'logic app':                                  { icon: Workflow,    bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Logic App' },
  'application insights':                       { icon: BarChart3,   bg: 'bg-purple-50',   text: 'text-purple-600',  label: 'Application Insights' },
  'log analytics workspace':                    { icon: BarChart3,   bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Log Analytics Workspace' },
  'translator':                                 { icon: MessageSquare, bg: 'bg-blue-50',   text: 'text-blue-600',    label: 'Translator' },
  'document intelligence':                      { icon: Brain,       bg: 'bg-violet-50',   text: 'text-violet-600',  label: 'Document intelligence' },
}

const DEFAULT_ICON: AzureIconConfig = { icon: ServerCog, bg: 'bg-gray-50', text: 'text-gray-500', label: 'Resource' }

export function getAzureIcon(resourceType: string): AzureIconConfig {
  if (!resourceType) return DEFAULT_ICON
  const key = resourceType.toLowerCase().trim()
  return AZURE_ICON_MAP[key] ?? DEFAULT_ICON
}

/** Render a small Azure icon badge for a resource type */
export function AzureResourceIcon({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) {
  const config = getAzureIcon(type)
  const Icon = config.icon
  const sizeClasses = size === 'md' ? 'p-2 rounded-xl' : 'p-1.5 rounded-lg'
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className={`${config.bg} ${sizeClasses} shrink-0`} title={config.label}>
      <Icon className={`${iconSize} ${config.text}`} />
    </div>
  )
}
