const variantStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  attraction: 'bg-indigo-100 text-indigo-700',
  restaurant: 'bg-orange-100 text-orange-700',
  shopping: 'bg-pink-100 text-pink-700',
  entertainment: 'bg-purple-100 text-purple-700',
  hotel: 'bg-yellow-100 text-yellow-700',
  morning: 'bg-amber-50 text-amber-700 border-amber-200',
  afternoon: 'bg-sky-50 text-sky-700 border-sky-200',
  evening: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export function Badge({
  children,
  variant = 'draft',
  className = '',
}: {
  children: React.ReactNode
  variant?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variantStyles[variant] || 'bg-gray-100 text-gray-700'
      } ${className}`}
    >
      {children}
    </span>
  )
}
