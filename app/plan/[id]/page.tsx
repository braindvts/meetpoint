import Planner from "./Planner";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Planner peerId={id} />;
}
