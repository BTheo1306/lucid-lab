import { FilmDemo } from '@/components/demo/atelier-v2/FilmDemo'
import { parseDemoParams, type DemoSearchParams } from '@/lib/demo/atelier/params'

export default async function DemoAtelierFilmPage({ searchParams }: { searchParams: Promise<DemoSearchParams> }) {
  const params = parseDemoParams(await searchParams)
  return <FilmDemo initialScene={params.initialScene} mode={params.mode} speed={params.speed} />
}
