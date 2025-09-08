import { useState, useEffect } from 'react'

interface CurrencyRates {
  [key: string]: number
}

export function useCurrencyConverter() {
  const [rates, setRates] = useState<CurrencyRates>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch exchange rates
  const fetchRates = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      )
      const data = await response.json()

      if (data.rates) {
        setRates(data.rates)
      } else {
        throw new Error('Failed to fetch exchange rates')
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
      setError('Failed to fetch exchange rates. Using approximate rates.')
      // Fallback to approximate rates (1 USD = 150 KES)
      setRates({
        KES: 150,
        USD: 1,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  // Convert USD to KES
  const usdToKes = (usdAmount: number): number => {
    if (!rates.KES) return usdAmount * 150 // fallback rate
    return usdAmount * rates.KES
  }

  // Convert KES to USD
  const kesToUsd = (kesAmount: number): number => {
    if (!rates.KES) return kesAmount / 150 // fallback rate
    return kesAmount / rates.KES
  }

  // Format price in USD
  const formatUsd = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  // Format price in KES
  const formatKes = (amount: number): string => {
    return `KSh ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  return {
    rates,
    loading,
    error,
    usdToKes,
    kesToUsd,
    formatUsd,
    formatKes,
    refreshRates: fetchRates,
  }
}
