// ============================================================================
// Smart Capital Gain Wizard - Common Components
// 공통 UI 컴포넌트
// ============================================================================

import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading, 
    leftIcon, 
    rightIcon, 
    className, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg shadow-primary-500/25',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
    };
    
    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'placeholder:text-slate-400',
              error
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300',
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ---------------------------------------------------------------------------
// NumberInput
// ---------------------------------------------------------------------------

interface NumberInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  suffix?: string;
  allowDecimal?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, suffix, allowDecimal = false, ...props }, ref) => {
    const formatValue = (val: number | string): string => {
      const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
      if (isNaN(num)) return '';
      return num.toLocaleString('ko-KR');
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      const num = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
      onChange(isNaN(num) ? 0 : num);
    };
    
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={formatValue(value)}
        onChange={handleChange}
        rightAddon={suffix && <span className="text-slate-400">{suffix}</span>}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  placeholder,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          error
            ? 'border-red-300 bg-red-50 text-red-900'
            : 'border-slate-200 text-slate-900 hover:border-slate-300'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card Selection
// ---------------------------------------------------------------------------

interface CardOption {
  id: string;
  label: string;
  subLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface CardSelectionProps {
  options: CardOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export const CardSelection: React.FC<CardSelectionProps> = ({
  options,
  value,
  onChange,
  columns = 3,
}) => {
  const gridCols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  
  return (
    <div className={clsx('grid gap-3', gridCols[columns])}>
      {options.map((opt) => {
        const isSelected = value === opt.id;
        
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => !opt.disabled && onChange(opt.id)}
            disabled={opt.disabled}
            className={clsx(
              'relative p-4 rounded-2xl border-2 transition-all duration-200 text-left',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
              opt.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-5 h-5 text-primary-600" />
              </div>
            )}
            {opt.icon && (
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                isSelected ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
              )}>
                {opt.icon}
              </div>
            )}
            <div className={clsx(
              'font-semibold',
              isSelected ? 'text-primary-900' : 'text-slate-700'
            )}>
              {opt.label}
            </div>
            {opt.subLabel && (
              <div className={clsx(
                'text-sm mt-0.5',
                isSelected ? 'text-primary-600' : 'text-slate-500'
              )}>
                {opt.subLabel}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Info Box
// ---------------------------------------------------------------------------

interface InfoBoxProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: ReactNode;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  type = 'info',
  title,
  children,
}) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  
  const icons = {
    info: <HelpCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
  };
  
  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      styles[type]
    )}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div>
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Result Row
// ---------------------------------------------------------------------------

interface ResultRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  large?: boolean;
  indent?: boolean;
}

export const ResultRow: React.FC<ResultRowProps> = ({
  label,
  value,
  highlight = false,
  large = false,
  indent = false,
}) => {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('ko-KR') + '원'
    : value;
  
  return (
    <div className={clsx(
      'flex justify-between items-center py-2',
      indent && 'pl-4',
      highlight && 'bg-primary-50 -mx-4 px-4 rounded-lg'
    )}>
      <span className={clsx(
        large ? 'text-base font-semibold' : 'text-sm',
        highlight ? 'text-primary-900' : 'text-slate-600'
      )}>
        {label}
      </span>
      <span className={clsx(
        large ? 'text-xl font-bold' : 'text-base font-semibold',
        highlight ? 'text-primary-600' : 'text-slate-900'
      )}>
        {formattedValue}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export const Divider: React.FC<{ className?: string }> = ({ className }) => (
  <hr className={clsx('border-slate-200', className)} />
);
