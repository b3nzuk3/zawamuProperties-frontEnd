import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calculator, ArrowUpDown } from 'lucide-react'

interface CurrencyRates {
  [key: string]: number
}

const POPULAR_CURRENCIES = [
  { code: 'KES', name: 'Kenya Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
]

interface InlineCurrencyConverterProps {
  originalAmount: number
  originalCurrency?: string
  className?: string
}

export function InlineCurrencyConverter({
  originalAmount,
  originalCurrency = 'KES',
  className = '',
}: InlineCurrencyConverterProps) {
  const [amount, setAmount] = useState(originalAmount.toString())
  const [fromCurrency, setFromCurrency] = useState(originalCurrency)
  const [toCurrency, setToCurrency] = useState('USD')
  const [convertedAmount, setConvertedAmount] = useState('')
  const [rates, setRates] = useState<CurrencyRates>({})
  const [loading, setLoading] = useState(false)

  // Fetch exchange rates
  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/KES'
      )
      const data = await response.json()

      if (data.rates) {
        setRates(data.rates)
      } else {
        // Fallback rates
        setRates({
          USD: 0.0067,
          EUR: 0.0062,
          GBP: 0.0053,
          CAD: 0.0091,
          AUD: 0.0102,
          KES: 1,
        })
      }
    } catch (err) {
      // Fallback rates
      setRates({
        USD: 0.0067,
        EUR: 0.0062,
        GBP: 0.0053,
        CAD: 0.0091,
        AUD: 0.0102,
        KES: 1,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  // Convert currency
  const convertCurrency = () => {
    if (!amount || !rates[fromCurrency] || !rates[toCurrency]) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) return

    let result: number

    if (fromCurrency === 'KES') {
      result = amountNum / rates[toCurrency]
    } else if (toCurrency === 'KES') {
      result = amountNum * rates[fromCurrency]
    } else {
      const kesAmount = amountNum * rates[fromCurrency]
      result = kesAmount / rates[toCurrency]
    }

    setConvertedAmount(
      result.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }

  useEffect(() => {
    convertCurrency()
  }, [amount, fromCurrency, toCurrency, rates])

  // Get currency info
  const getCurrencyInfo = (code: string) => {
    return (
      POPULAR_CURRENCIES.find((c) => c.code === code) || POPULAR_CURRENCIES[0]
    )
  }

  // Format amount with currency symbol
  const formatAmount = (amount: string, currencyCode: string) => {
    const currency = getCurrencyInfo(currencyCode)
    return `${currency.symbol} ${amount}`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          <Calculator className="h-4 w-4" />
          Convert Currency
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="text-sm font-medium">Currency Converter</div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-1">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromCurrency(toCurrency)
                  setToCurrency(fromCurrency)
                }}
                className="p-1"
              >
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </div>

            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-1">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conversion Result */}
          {convertedAmount && amount && (
            <div className="bg-muted p-3 rounded text-center">
              <div className="text-sm text-muted-foreground">
                {formatAmount(amount, fromCurrency)} =
              </div>
              <div className="text-lg font-bold text-primary">
                {formatAmount(convertedAmount, toCurrency)}
              </div>
            </div>
          )}

          {/* Quick Examples */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Quick Examples
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                { amount: '1000000', from: 'KES', to: 'USD' },
                { amount: '50000', from: 'USD', to: 'KES' },
              ].map((example, index) => {
                const fromInfo = getCurrencyInfo(example.from)
                const toInfo = getCurrencyInfo(example.to)
                const rate =
                  example.from === 'KES'
                    ? 1 / rates[example.to]
                    : rates[example.from]
                const result =
                  example.from === 'KES'
                    ? parseFloat(example.amount) / rates[example.to]
                    : parseFloat(example.amount) * rates[example.from]

                return (
                  <div
                    key={index}
                    className="p-2 bg-muted rounded text-center cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      setAmount(example.amount)
                      setFromCurrency(example.from)
                      setToCurrency(example.to)
                    }}
                  >
                    <div className="font-medium">
                      {fromInfo.symbol}
                      {parseFloat(example.amount).toLocaleString()}{' '}
                      {example.from}
                    </div>
                    <div className="text-primary">
                      {toInfo.symbol}
                      {result.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      {example.to}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
