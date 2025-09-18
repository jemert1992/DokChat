interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message, 
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className={`${fullScreen ? 'flex flex-col items-center justify-center min-h-screen' : ''} ${className}`}>
      <div className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
      {message && (
        <p className={`mt-4 text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-sm' : size === 'xl' ? 'text-lg' : 'text-base'} animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );

  return spinner;
}