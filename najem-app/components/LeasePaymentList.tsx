//components/LeasePaymentList.tsx


'use client'

type Props = {
  leaseId: string
}

export default function LeasePaymentList({ leaseId }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Tady to funguje!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Test Submit</button>
    </form>
  );
}
