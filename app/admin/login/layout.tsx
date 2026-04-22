// Login page has its own layout to exclude the admin sidebar
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
