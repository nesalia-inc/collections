import { orderBy, asc, desc } from '@deessejs/collections'
type PostEntity = {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  viewCount: number
  createdAt: Date
  publishedAt?: Date
  authorId: string
  priority: number
}
const orderByCreatedAtAsc = orderBy((p) => [
  asc(p.createdAt),
])
console.log(orderByCreatedAtAsc)
