import React from 'react'
import Layout from '@/components/layout/Layout'

const AdminSettings: React.FC = () => {
  return (
    <Layout>
      <div className="py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-4">
            Site Settings
          </h1>
          <p className="text-muted-foreground mb-8">
            Configure homepage and site metadata here.
          </p>
          <div className="py-16 text-lg text-muted-foreground">
            Coming Soon...
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AdminSettings
