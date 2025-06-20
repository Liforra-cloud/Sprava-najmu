// components/DocumentsSection.tsx

'use client'

import DocumentUpload from '@/components/DocumentUpload'
import DocumentList from '@/components/DocumentList'

export default function DocumentsSection({ tenantId }: { tenantId: string }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Dokumenty k nájemníkovi</h2>
      <DocumentUpload tenantId={tenantId} onUpload={() => {/* případně reload DocumentList */}} />
      <DocumentList tenantId={tenantId} />
    </section>
  )
}
