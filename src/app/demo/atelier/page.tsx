import { AtelierDemo } from '@/components/demo/atelier/AtelierDemo'
import { parseDemoParams, type DemoSearchParams } from '@/lib/demo/atelier/params'

export default async function DemoAtelierPage({ searchParams }: { searchParams: Promise<DemoSearchParams> }) {
  const params = parseDemoParams(await searchParams)
  return <AtelierDemo initialScene={params.initialScene} mode={params.mode} speed={params.speed} />
}
