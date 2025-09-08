import React from 'react'
import Layout from '../components/layout/Layout'
import { CurrencyConverter } from '../components/ui/currency-converter'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Calculator, TrendingUp, Globe, Info } from 'lucide-react'
import { useCurrencyConverter } from '../hooks/useCurrencyConverter'

export default function CurrencyConverterPage() {
  const { usdToKes } = useCurrencyConverter()

  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Currency Converter
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Convert any currency to Kenya Shillings (KES) and vice versa. Get
              real-time exchange rates for property investments and
              transactions.
            </p>
          </div>

          {/* Main Converter */}
          <div className="mb-8">
            <CurrencyConverter />
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="h-5 w-5 text-primary" />
                  Real-Time Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Exchange rates are updated in real-time from reliable
                  financial sources. Perfect for accurate property price
                  conversions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  Global Currencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Convert between 16+ major currencies including USD, EUR, GBP,
                  and African currencies like NGN, ZAR, and UGX.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Property Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ideal for international property investors to understand
                  property prices in their local currency.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Popular Conversions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Popular Property Price Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    amount: '50000',
                    from: 'USD',
                    to: 'KES',
                    label: 'Typical Apartment',
                  },
                  {
                    amount: '100000',
                    from: 'USD',
                    to: 'KES',
                    label: 'Luxury Apartment',
                  },
                  {
                    amount: '200000',
                    from: 'USD',
                    to: 'KES',
                    label: 'House in Nairobi',
                  },
                  {
                    amount: '500000',
                    from: 'USD',
                    to: 'KES',
                    label: 'Luxury Villa',
                  },
                ].map((example, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {example.label}
                    </div>
                    <div className="text-lg font-bold">
                      ${example.amount} USD
                    </div>
                    <div className="text-sm text-primary">
                      ≈ KSh{' '}
                      {usdToKes(parseFloat(example.amount)).toLocaleString()}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Approximate
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
