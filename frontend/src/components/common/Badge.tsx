const colorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
  deprecated: 'bg-red-100 text-red-700',
  production: 'bg-blue-100 text-blue-700',
  staging: 'bg-purple-100 text-purple-700',
  development: 'bg-orange-100 text-orange-700',
  private: 'bg-gray-100 text-gray-600',
  public: 'bg-green-100 text-green-700',
  internal: 'bg-blue-100 text-blue-700',
  'system-assigned': 'bg-indigo-100 text-indigo-700',
  'user-assigned': 'bg-teal-100 text-teal-700',
  GitHub: 'bg-gray-900 text-white',
  'Azure DevOps': 'bg-blue-600 text-white',
  Owner: 'bg-red-100 text-red-700',
  Contributor: 'bg-amber-100 text-amber-700',
  Reader: 'bg-sky-100 text-sky-700',
}

interface Props {
  value: string
  className?: string
}

export default function Badge({ value, className = '' }: Props) {
  const colors = colorMap[value] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}>
      {value}
    </span>
  )
}
