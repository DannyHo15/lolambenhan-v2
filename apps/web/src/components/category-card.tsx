import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CategoryCardProps {
  title: string
  description: string
  href: string
  icon?: React.ReactNode
}

export function CategoryCard({ title, description, href, icon }: CategoryCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full glass hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer">
        <CardHeader>
          {icon && <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
            {icon}
          </div>}
          <CardTitle className="text-foreground group-hover:text-primary transition-colors text-[18px]">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[14px]">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
