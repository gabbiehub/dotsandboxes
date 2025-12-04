import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyle = "font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform active:scale-95 shadow-lg flex items-center justify-center";
  
  const variants = {
    primary: "bg-pastel-p2 text-white hover:bg-sky-300 shadow-sky-200/50",
    secondary: "bg-white text-pastel-text border-2 border-slate-100 hover:border-pastel-p2 shadow-slate-200/50",
    danger: "bg-pastel-p1 text-white hover:bg-rose-300 shadow-rose-200/50"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};