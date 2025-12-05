import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-ink-200",
        className
      )}
    />
  );
}

/**
 * Text line skeleton - for paragraphs and labels
 */
export function SkeletonText({ 
  className,
  lines = 1,
  lastLineWidth = "75%"
}: SkeletonProps & { lines?: number; lastLineWidth?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ 
            width: i === lines - 1 && lines > 1 ? lastLineWidth : "100%" 
          }}
        />
      ))}
    </div>
  );
}

/**
 * Circle skeleton - for avatars and icons
 */
export function SkeletonCircle({ 
  className,
  size = 48 
}: SkeletonProps & { size?: number }) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Card skeleton - for content cards
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/60 bg-white p-5 space-y-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Photo skeleton - for image placeholders
 */
export function SkeletonPhoto({ 
  className,
  aspectRatio = "4/5"
}: SkeletonProps & { aspectRatio?: string }) {
  return (
    <Skeleton
      className={cn("w-full", className)}
      style={{ aspectRatio }}
    />
  );
}

/**
 * Input field skeleton - for form inputs
 */
export function SkeletonInput({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * Button skeleton
 */
export function SkeletonButton({ className }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-10 w-24 rounded-full", className)} />
  );
}

/**
 * Stat card skeleton - for dashboard stats
 */
export function SkeletonStat({ className }: SkeletonProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/60 bg-white p-5",
      className
    )}>
      <SkeletonCircle size={48} className="mb-3 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

/**
 * Match card skeleton - specific to match cards layout
 */
export function SkeletonMatchCard({ className }: SkeletonProps) {
  return (
    <div className={cn(
      "rounded-3xl border border-white/60 bg-white overflow-hidden",
      className
    )}>
      <SkeletonPhoto aspectRatio="4/5" className="rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile skeleton - matches ProfileView layout
 */
export function SkeletonProfile({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <SkeletonButton />
          <SkeletonButton className="w-28" />
        </div>
      </div>

      {/* Photos Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-20" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonPhoto key={i} aspectRatio="4/3" className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Bio Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <SkeletonText lines={3} />
      </div>

      {/* Hobbies Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonCircle size={24} />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SkeletonStat />
          <SkeletonStat />
        </div>
      </div>
    </div>
  );
}

/**
 * Settings skeleton - matches settings page layout
 */
export function SkeletonSettings({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Account Settings Section */}
      <div className="card-elevated p-6 space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="space-y-4">
          <SkeletonInput />
          <SkeletonInput />
        </div>
      </div>

      {/* Matching Preferences Section */}
      <div className="card-elevated p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="space-y-4">
          <SkeletonInput />
          <SkeletonInput />
        </div>
        <SkeletonButton className="w-32" />
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-error-200 bg-error-50/60 p-6 space-y-4">
        <Skeleton className="h-7 w-32 bg-error-200" />
        <Skeleton className="h-4 w-64 bg-error-200" />
        <SkeletonButton className="bg-error-200" />
      </div>
    </div>
  );
}

