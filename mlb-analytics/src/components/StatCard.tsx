type StatCardProps = {
  label: string
  value: string | number
  detail: string
}

function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}

export default StatCard
