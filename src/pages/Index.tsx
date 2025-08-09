import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import LatestBlog from "@/components/home/LatestBlog";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturedListings />
      <LatestBlog />
    </Layout>
  );
};

export default Index;
