import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SavedSearchesManager } from '../components/ui/saved-searches-manager'
import { useToast } from '../components/ui/use-toast'
import {
  User,
  Bell,
  Search,
  Settings,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

export default function UserDashboard() {
  const [userEmail, setUserEmail] = useState('')
  const [showDashboard, setShowDashboard] = useState(false)
  const { toast } = useToast()

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }
    setShowDashboard(true)
  }

  if (!showDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Access Your Dashboard</CardTitle>
            <CardDescription>
              Enter your email address to view your saved searches and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage your saved searches and property alerts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <Mail className="h-3 w-3 mr-1" />
                {userEmail}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDashboard(false)}
              >
                Switch Account
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="searches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="searches" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Saved Searches
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alert History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="searches" className="space-y-6">
            <SavedSearchesManager userEmail={userEmail} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Alert History
                </CardTitle>
                <CardDescription>
                  View your recent property alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts Yet</h3>
                  <p className="text-muted-foreground">
                    You'll see your property alerts here once they start coming
                    in.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage your email notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Email Settings
                    </h3>
                    <p className="text-muted-foreground">
                      Email preferences are managed per saved search. Edit
                      individual searches to customize your notifications.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Account Statistics
                  </CardTitle>
                  <CardDescription>
                    Overview of your saved searches and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">
                        Saved Searches
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">
                        Total Alerts
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">
                        Days Active
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
