import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Our Office',
    details: ['123 Real Estate Ave', 'City, State 12345'],
    action: 'Get Directions',
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: ['(555) 123-4567', 'Mon-Fri 9AM-6PM'],
    action: 'Call Now',
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['info@realestatepro.com', 'We respond within 24 hours'],
    action: 'Send Email',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    details: ['Monday - Friday: 9AM - 6PM', 'Saturday: 10AM - 4PM'],
    action: 'Schedule Meeting',
  },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    propertyType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: 'Message Sent Successfully!',
      description:
        "Thank you for contacting us. We'll get back to you within 24 hours.",
    })

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      propertyType: '',
    })

    setIsSubmitting(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-primary-foreground">
            <h1 className="font-heading font-bold text-4xl lg:text-5xl mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              Ready to start your real estate journey? Our expert team is here
              to help you every step of the way. Contact us today for
              personalized assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <Card
                  key={info.title}
                  className={`property-card text-center ${
                    index === 0 ? 'animate-fade-in-up' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
                      {info.title}
                    </h3>
                    <div className="space-y-1 mb-4">
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      {info.action}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="font-heading font-bold text-3xl text-foreground mb-4">
                  Send Us a Message
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as
                  possible. We're here to answer any questions about buying,
                  selling, or investing in real estate.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="propertyType"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Property Interest
                    </label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) =>
                        handleInputChange('propertyType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buying">Buying a Home</SelectItem>
                        <SelectItem value="selling">Selling a Home</SelectItem>
                        <SelectItem value="renting">Renting</SelectItem>
                        <SelectItem value="investment">
                          Investment Property
                        </SelectItem>
                        <SelectItem value="commercial">
                          Commercial Real Estate
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange('subject', e.target.value)
                    }
                    placeholder="What's this regarding?"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange('message', e.target.value)
                    }
                    placeholder="Tell us more about what you're looking for..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              {/* Map Placeholder */}
              <Card className="overflow-hidden">
                <div className="h-64 bg-secondary/30 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-accent mx-auto mb-2" />
                    <p className="text-muted-foreground">Interactive Map</p>
                    <p className="text-sm text-muted-foreground">
                      123 Zawamu Ave, City, State
                    </p>
                  </div>
                </div>
              </Card>

              {/* Why Choose Us */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-xl text-foreground mb-4">
                    Why Choose Zawamu Properties?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">
                          Expert Market Knowledge
                        </p>
                        <p className="text-sm text-muted-foreground">
                          15+ years of local market expertise
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">
                          Personalized Service
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tailored solutions for your unique needs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">
                          Proven Track Record
                        </p>
                        <p className="text-sm text-muted-foreground">
                          500+ successful transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">
                          24/7 Support
                        </p>
                        <p className="text-sm text-muted-foreground">
                          We're here when you need us
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-6 text-center">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    Need Immediate Assistance?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    For urgent matters, call our emergency line
                  </p>
                  <Button
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    (555) 123-4567
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
