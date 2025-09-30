import Layout from '@/components/layout/Layout'
import {
  Award,
  Users,
  Home,
  Star,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Properties Sold', value: '500+', icon: Home },
  { label: 'Happy Clients', value: '1000+', icon: Users },
  { label: 'Years Experience', value: '15+', icon: Award },
  { label: 'Client Satisfaction', value: '98%', icon: Star },
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'Senior Real Estate Agent',
    experience: '10+ years',
    specialties: ['Luxury Homes', 'First-time Buyers'],
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b047?w=400&h=400&fit=crop',
    description:
      'Sarah specializes in luxury properties and has helped hundreds of families find their dream homes.',
  },
  {
    name: 'Michael Chen',
    role: 'Commercial Real Estate Specialist',
    experience: '12+ years',
    specialties: ['Commercial Properties', 'Investment'],
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    description:
      'Michael focuses on commercial real estate and investment properties with proven track record.',
  },
  {
    name: 'Emma Rodriguez',
    role: 'Residential Sales Expert',
    experience: '8+ years',
    specialties: ['Family Homes', 'Sustainable Properties'],
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    description:
      'Emma is passionate about sustainable living and helps families find eco-friendly homes.',
  },
]

const values = [
  {
    title: 'Integrity First',
    description:
      'We believe in honest, transparent communication and ethical business practices in every transaction.',
    icon: CheckCircle,
  },
  {
    title: 'Client-Centered',
    description:
      'Your needs and goals are our priority. We listen, understand, and deliver personalized solutions.',
    icon: Users,
  },
  {
    title: 'Market Expertise',
    description:
      'Deep local knowledge and market insights ensure you make informed decisions with confidence.',
    icon: Award,
  },
  {
    title: 'Results Driven',
    description:
      'We measure our success by your satisfaction and the achievement of your real estate goals.',
    icon: Star,
  },
]

export default function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-primary-foreground">
            <h1 className="font-heading font-bold text-4xl lg:text-5xl mb-6">
              About Zawamu Properties
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              For over 15 years, we've been helping families and investors find
              their perfect properties. Our commitment to excellence and
              personalized service sets us apart in the real estate industry.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 -mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.label}
                  className={`text-center property-card ${
                    index === 0 ? 'animate-fade-in-up' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <Icon className="h-8 w-8 text-accent mx-auto mb-4" />
                    <div className="font-heading font-bold text-3xl text-foreground mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in 2009, Zawamu Properties began with a simple
                  mission: to make real estate transactions more transparent,
                  efficient, and successful for our clients. What started as a
                  small boutique agency has grown into one of the most trusted
                  names in the industry.
                </p>
                <p>
                  We've witnessed the evolution of the real estate market
                  through various economic cycles, technology advances, and
                  changing buyer preferences. This experience has taught us the
                  importance of adaptability, innovation, and maintaining strong
                  relationships.
                </p>
                <p>
                  Today, we're proud to serve clients across multiple markets,
                  from first-time homebuyers to luxury property investors. Our
                  success is measured not just in transactions closed, but in
                  the lasting relationships we build with every client.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop"
                alt="Our office"
                className="rounded-2xl shadow-elegant"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide our work and define our commitment to
              excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card
                  key={value.title}
                  className={`property-card text-center ${
                    index === 0 ? 'animate-fade-in-up' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
                      {value.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experienced professionals dedicated to making your real estate
              journey successful
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={member.name}
                className={`property-card overflow-hidden ${
                  index === 0 ? 'animate-fade-in-up' : ''
                }`}
              >
                <div className="aspect-square">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-xl text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-accent font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {member.experience}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {member.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-primary overflow-hidden">
            <CardContent className="p-8 lg:p-12 text-center text-primary-foreground">
              <h2 className="font-heading font-bold text-3xl lg:text-4xl mb-4">
                Ready to Work with Us?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Whether you're buying, selling, or investing, our team is here
                to guide you through every step of your real estate journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" variant="secondary">
                    Get in Touch
                  </Button>
                </Link>
                <Link to="/listings">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20"
                  >
                    Browse Properties
                  </Button>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>123 Zawamu Ave, City, State 12345</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Zawamuproperty@gmail.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  )
}
