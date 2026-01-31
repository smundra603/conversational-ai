import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
  secondary:
    'rounded border border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-50',
  ghost: 'rounded text-gray-900 hover:bg-gray-100 disabled:opacity-50'
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2'
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}) => {
  const classes = `${variantClasses[variant]} ${sizeClasses[size]} ${
    className ?? ''
  }`
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
