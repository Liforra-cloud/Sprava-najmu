// app/units/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Unit = {
  id: string
  property_id: string
  identifier: string
  floor?: number
  area?: number
  description?: string
  occupancy_status?: string
  monthly_rent?: number
}

type Property = {
  id: string
  name: string
}

export default function UnitsPage() {
  const [list, setList] = useState<Unit[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [error, setError] = useState<string>('')
  const [stav, setStav] = useState<string>('')
  const [propertyId, setPropertyId] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('') // Aktuální hodnota inputu
  const [search, setSearch] = useState<string>('') // Debounced hodnota
  const [floor, setFloor] = useState<string>('')    // Patro
  const [areaMin, setAreaMin] = useState<string>('')// Plocha od
  const [areaMax, setAreaMax] = useState<string>('')// Plocha do
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Načtení nemovitostí do dropdownu
  useEffect(() => {
    fetch('/api/properties')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setProperties(json)
        }
      })
  }, [])

  // Načtení jednotek při změně filtru
  useEffect(() => {
    let url = '/api/units?'
    const params = []
    if (stav) params.push(`stav=${encodeURIComponent(stav)}`)
    if (propertyId) params.push(`propertyId=${encodeURIComponent(propertyId)}`)
    if (search) params.push(`search=${encodeURIComponent(search)}`)
    if (floor) params.push(`floor=${encodeURIComponent(floor)}`)
    if (areaMin) params.push(`areaMin=${encodeURIComponent(areaMin)}`)
    if (areaMax) params.push(`areaMax=${encodeURIComponent(areaMax)}`)
    url += params.join('&')
    fetch(url)
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setList(json)
        } else {
          throw new Error(json.error || 'Chyba při načítání jednotek')
        }
      })
      .catch(err => setError(err.message))
  }, [stav, propertyId, search, floor, areaMin, areaMax])

  // Debounce logika pro vyhledávání
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      setSearch(searchInput)
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchInput])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3
