import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Label } from './label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Button } from './button'
import { Badge } from './badge'
import { ArrowUpDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter'

const CURRENCIES = [
  { code: 'KES', name: 'Kenya Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿' },
]

export function CurrencyConverter() {
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('KES')
  const [convertedAmount, setConvertedAmount] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Use the real-time currency converter hook
  const {
    rates,
    loading,
    error,
    refreshRates,
    usdToKes,
    kesToUsd,
    formatUsd,
    formatKes,
  } = useCurrencyConverter()

  // Update last updated time when rates change
  useEffect(() => {
    if (rates && Object.keys(rates).length > 0) {
      setLastUpdated(new Date())
    }
  }, [rates])

  // Convert currency
  const convertCurrency = () => {
    if (!amount) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) return

    let result: number

    if (fromCurrency === 'USD' && toCurrency === 'KES') {
      result = usdToKes(amountNum)
    } else if (fromCurrency === 'KES' && toCurrency === 'USD') {
      result = kesToUsd(amountNum)
    } else if (fromCurrency === 'KES') {
      // Converting FROM KES to another currency (via USD)
      const usdAmount = kesToUsd(amountNum)
      result = usdAmount * (rates[toCurrency] || 1)
    } else if (toCurrency === 'KES') {
      // Converting TO KES from another currency (via USD)
      const usdAmount = amountNum / (rates[fromCurrency] || 1)
      result = usdToKes(usdAmount)
    } else {
      // Converting between two non-KES currencies (via USD)
      const usdAmount = amountNum / (rates[fromCurrency] || 1)
      result = usdAmount * (rates[toCurrency] || 1)
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

  // Swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  // Get currency info
  const getCurrencyInfo = (code: string) => {
    return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
  }

  // Format amount with currency symbol
  const formatAmount = (amount: string, currencyCode: string) => {
    const currency = getCurrencyInfo(currencyCode)
    return `${currency.symbol} ${amount}`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            💱 Currency Converter
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <Badge variant="outline" className="text-xs">
                Updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRates}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            {error}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* From Currency */}
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-muted-foreground">
                        {currency.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapCurrencies}
              className="rounded-full"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-muted-foreground">
                        {currency.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversion Result */}
        {convertedAmount && amount && (
          <div className="bg-muted p-6 rounded-lg">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {formatAmount(amount, fromCurrency)} =
              </div>
              <div className="text-3xl font-bold text-primary">
                {formatAmount(convertedAmount, toCurrency)}
              </div>
              <div className="text-sm text-muted-foreground">
                {getCurrencyInfo(fromCurrency).name} to{' '}
                {getCurrencyInfo(toCurrency).name}
              </div>
            </div>
          </div>
        )}

        {/* Quick Conversion Examples */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Examples</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              { amount: '1000', from: 'USD', to: 'KES' },
              { amount: '1000000', from: 'KES', to: 'USD' },
              { amount: '1000', from: 'EUR', to: 'KES' },
              { amount: '1000', from: 'GBP', to: 'KES' },
            ].map((example, index) => {
              const fromInfo = getCurrencyInfo(example.from)
              const toInfo = getCurrencyInfo(example.to)

              let result: number
              if (example.from === 'USD' && example.to === 'KES') {
                result = usdToKes(parseFloat(example.amount))
              } else if (example.from === 'KES' && example.to === 'USD') {
                result = kesToUsd(parseFloat(example.amount))
              } else if (example.from === 'KES') {
                const usdAmount = kesToUsd(parseFloat(example.amount))
                result = usdAmount * (rates[example.to] || 1)
              } else if (example.to === 'KES') {
                const usdAmount =
                  parseFloat(example.amount) / (rates[example.from] || 1)
                result = usdToKes(usdAmount)
              } else {
                const usdAmount =
                  parseFloat(example.amount) / (rates[example.from] || 1)
                result = usdAmount * (rates[example.to] || 1)
              }

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
                    {example.amount} {example.from}
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

        {/* Rate Information */}
        {rates && Object.keys(rates).length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            <div>
              1 {fromCurrency} ={' '}
              {fromCurrency === 'USD' && toCurrency === 'KES'
                ? rates.KES?.toFixed(2) || '150.00'
                : fromCurrency === 'KES' && toCurrency === 'USD'
                ? (1 / (rates.KES || 150)).toFixed(2)
                : fromCurrency === 'KES'
                ? ((1 / (rates.KES || 150)) * (rates[toCurrency] || 1)).toFixed(
                    2
                  )
                : toCurrency === 'KES'
                ? (rates.KES || 150).toFixed(2)
                : (rates[toCurrency] || 1).toFixed(2)}{' '}
              {toCurrency}
            </div>
            <div>
              1 {toCurrency} ={' '}
              {fromCurrency === 'USD' && toCurrency === 'KES'
                ? (1 / (rates.KES || 150)).toFixed(2)
                : fromCurrency === 'KES' && toCurrency === 'USD'
                ? (rates.KES || 150).toFixed(2)
                : fromCurrency === 'KES'
                ? ((rates.KES || 150) / (rates[toCurrency] || 1)).toFixed(2)
                : toCurrency === 'KES'
                ? (1 / (rates.KES || 150)).toFixed(2)
                : (1 / (rates[toCurrency] || 1)).toFixed(2)}{' '}
              {fromCurrency}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
