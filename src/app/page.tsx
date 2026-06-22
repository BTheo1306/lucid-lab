import HomePage from '@/components/marketing/HomePage'
import { getAllPosts } from '@/lib/blog/posts'

export default async function Page() {
  const posts = await getAllPosts('fr')
  const latestPosts = posts.filter((p) => !p.frontmatter.draft).slice(0, 3)
  return <HomePage lang="fr" latestPosts={latestPosts} />
}
