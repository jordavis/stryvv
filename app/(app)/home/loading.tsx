// Skeleton cards while home loads.
export default function HomeLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-32 rounded-sv-sm bg-sv-surface-sunken" />
      <div className="h-[34px] w-3/4 rounded-sv-sm bg-sv-surface-sunken" />
      <div className="h-[52px] rounded-full bg-sv-surface-sunken" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-sv-lg border border-sv-border bg-sv-surface" />
      ))}
    </div>
  )
}
