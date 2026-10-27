/* Kolom kosong: tempat visualisasi target vs realisasi dari logbook periset */
function ChartCard({ id }: { id: string }) {
  return (
    <div
      data-chart={id}
      className="h-[350px] rounded-2xl bg-white shadow-[0_8px_18px_rgba(0,0,0,0.2)]"
    />
  );
}

export default function ChartGrid({
  ids,
  className = "",
}: {
  ids: string[];
  className?: string;
}) {
  return (
    <section
      className={`grid grid-cols-[581px_581px] gap-x-[54px] gap-y-[63px] ${className}`}
    >
      {ids.map((id) => (
        <ChartCard key={id} id={id} />
      ))}
    </section>
  );
}