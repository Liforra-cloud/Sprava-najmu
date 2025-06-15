//components/LeasePaymentList.tsx


'use client'

type Props = {
  leaseId: string
}

export default function LeasePaymentList({ leaseId }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Formulář odeslán pro leaseId: ' + leaseId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Lease ID: {leaseId}</h2>
      <button type="submit">Test Submit</button>
    </form>
  );
}
