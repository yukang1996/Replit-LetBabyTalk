import { cn } from "@/lib/utils";

interface BearMascotProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function BearMascot({ size = "medium", className }: BearMascotProps) {
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  return (
    <div className={cn(
      "bg-white rounded-full flex items-center justify-center shadow-lg",
      sizeClasses[size],
      className
    )}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-3/4 h-3/4"
        fill="none"
      >
        {/* Bear face */}
        <circle cx="50" cy="55" r="25" fill="#f8d7da" stroke="#f472b6" strokeWidth="2"/>
        
        {/* Ears */}
        <circle cx="35" cy="35" r="8" fill="#f8d7da" stroke="#f472b6" strokeWidth="1.5"/>
        <circle cx="65" cy="35" r="8" fill="#f8d7da" stroke="#f472b6" strokeWidth="1.5"/>
        <circle cx="35" cy="35" r="4" fill="#f472b6"/>
        <circle cx="65" cy="35" r="4" fill="#f472b6"/>
        
        {/* Eyes */}
        <circle cx="42" cy="50" r="3" fill="#2d1b25"/>
        <circle cx="58" cy="50" r="3" fill="#2d1b25"/>
        <circle cx="43" cy="49" r="1" fill="white"/>
        <circle cx="59" cy="49" r="1" fill="white"/>
        
        {/* Nose */}
        <ellipse cx="50" cy="58" rx="2" ry="1.5" fill="#2d1b25"/>
        
        {/* Mouth */}
        <path d="M 46 65 Q 50 68 54 65" stroke="#2d1b25" strokeWidth="2" fill="none" strokeLinecap="round"/>
        
        {/* Cheeks */}
        <circle cx="30" cy="58" r="3" fill="#f472b6" opacity="0.6"/>
        <circle cx="70" cy="58" r="3" fill="#f472b6" opacity="0.6"/>
      </svg>
    </div>
  );
}
