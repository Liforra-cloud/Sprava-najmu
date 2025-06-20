// components/TenantHeader.tsx

export default function TenantHeader({ tenant }: { tenant: any }) {
  return (
    <section>
      <h1 className="text-3xl font-bold mb-4">{tenant.full_name}</h1>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="font-semibold">Email:</dt>
        <dd>
          <a href={`mailto:${tenant.email}`} className="underline text-blue-600">
            {tenant.email}
          </a>
        </dd>
        <dt className="font-semibold">Telefon:</dt>
        <dd>{tenant.phone || '—'}</dd>
        <dt className="font-semibold">Rodné číslo:</dt>
        <dd>{tenant.personal_id || '—'}</dd>
        <dt className="font-semibold">Adresa:</dt>
        <dd>{tenant.address || '—'}</dd>
        <dt className="font-semibold">Zaměstnavatel:</dt>
        <dd>{tenant.employer || '—'}</dd>
        <dt className="font-semibold">Poznámka:</dt>
        <dd>{tenant.note || '—'}</dd>
        <dt className="font-semibold">Registrován:</dt>
        <dd>{new Date(tenant.date_registered).toLocaleDateString()}</dd>
      </dl>
    </section>
)
}
