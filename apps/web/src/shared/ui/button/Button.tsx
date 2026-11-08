import './Button.css'

type ButtonVariant = 'primary'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const mapVariantToClassName = {
  primary: 'button__primary',
}

export function Button({
  className,
  children,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${mapVariantToClassName[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
