// components/RentSummaryCard.tsx

type Summary = {
  totalDue: number
  paidThisMonth: number
  totalPaid: number
  debt: number
  debtThisMonth: number
}

export default function RentSummaryCard({ summary }: { summary: Summary }) {
  return (
    <section className="p-4 border rounded bg-gray-50">
      <h2 className="font-bold mb-2">Souhrn nájemného</h2>
      <ul className="space-y-1 text-sm">
        <li>💰 Celkem dlužné: {summary.totalDue} Kč</li>
        <li>📅 Zaplaceno tento měsíc: {summary.paidThisMonth} Kč</li>
        <li>📊 Celkem zaplaceno: {summary.totalPaid} Kč</li>
        <li>📈 Celkový dluh: {summary.debt} Kč</li>
        <li>⚠️ Dluh tento měsíc: {summary.debtThisMonth} Kč</li>
        {summary.debt === 0 && <li className="text-green-600">✅ Vše uhrazeno</li>}
      </ul>
    </section>
  )
}
