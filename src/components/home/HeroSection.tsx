import { Link } from 'react-router-dom'
import { Search, MapPin, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import heroImage from '@/assets/hero-home.jpg'

export default function HeroSection() {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Luxury Real Estate"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24 lg:pb-40">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6 pt-2">
            <div className="flex items-center justify-center space-x-2 text-primary-foreground/80">
              <Star className="h-5 w-5 text-accent fill-current" />
              <span className="text-sm font-medium">
                Premium Real Estate Services
              </span>
            </div>
          </div>

          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight text-primary-foreground mb-6">
            Find Your
            <span className="block text-accent">Dream Home</span>
            Today
          </h1>

          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl">
            Discover exceptional properties with our expert guidance. From
            luxury estates to cozy family homes, we make your real estate dreams
            a reality.
          </p>

          {/* Search Bar */}
          <div className="bg-background/95 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-elegant mx-auto max-w-4xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter location, property type, or keywords..."
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>
              <Button size="lg" className="h-12 px-8">
                <Search className="h-5 w-5 mr-2" />
                Search Properties
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 relative z-20 justify-center">
            <Link to="/listings">
              <Button size="lg" className="w-full sm:w-auto">
                Browse All Listings
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20"
              >
                Contact an Agent
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden lg:block z-0 pointer-events-none">
        <div className="bg-background/95 backdrop-blur-sm rounded-xl px-8 py-4 shadow-elegant">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="font-heading font-bold text-2xl text-foreground">
                500+
              </div>
              <div className="text-sm text-muted-foreground">
                Properties Sold
              </div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
              <div className="font-heading font-bold text-2xl text-foreground">
                KSh 7.5B+
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
              <div className="font-heading font-bold text-2xl text-foreground">
                98%
              </div>
              <div className="text-sm text-muted-foreground">
                Client Satisfaction
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
