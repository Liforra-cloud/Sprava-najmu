export default function Page({ params }: { params: { id: string } }) {
  return <p>Parametr ID = {params.id}</p>
}
