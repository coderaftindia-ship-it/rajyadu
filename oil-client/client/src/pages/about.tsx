 import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BadgeCheck,
  Droplets,
  HandHeart,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Users,
  Wheat,
} from "lucide-react";

export default function About() {
  const principles = [
    {
      icon: ShieldCheck,
      title: "Pure & Honest",
      description: "No false claims, no misleading labels, no shortcuts.",
    },
    {
      icon: HandHeart,
      title: "Family-Grade Quality",
      description:
        "We serve the same quality we would proudly serve to our own family.",
    },
    {
      icon: Wheat,
      title: "Traditional Practices",
      description:
        "Rooted in time-tested methods with modern, hygienic and responsible production.",
    },
    {
      icon: HeartHandshake,
      title: "Trust First",
      description:
        "Every batch is monitored and checked before packaging—trust matters more than volume.",
    },
  ];

  const offerings = [
    "Cold pressed edible oils",
    "Natural and traditional food products",
    "Carefully selected raw materials",
    "Products made without unnecessary chemicals or artificial flavours",
  ];

  const oilBenefits = [
    "Natural aroma",
    "Authentic taste",
    "Essential nutrients",
  ];

  const promises = [
    "No false claims",
    "No misleading labels",
    "No quality shortcuts",
  ];

  const quickNav = [
    { label: "Philosophy", id: "philosophy" },
    { label: "Story", id: "story" },
    { label: "Offerings", id: "offerings" },
    { label: "Oils", id: "oils" },
    { label: "Commitment", id: "commitment" },
  ];

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white">
      <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-14 md:py-20">
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-8 md:p-12 border">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border px-4 py-2 text-sm text-gray-700">
                  <Leaf className="h-4 w-4 text-primary" />
                  Rajyadu Organic Food
                </div>
                <h1 className="mt-5 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                  Pure. Honest. From our family to yours.
                </h1>
                <p className="mt-5 text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
                  Rajyadu Organic Food is not just a brand — it is a promise of purity, honesty,
                  and care.
                </p>
                <div className="mt-6 rounded-2xl bg-white/70 border p-5">
                  <p className="text-gray-800 font-medium">Our journey began with one simple question:</p>
                  <p className="text-gray-700 mt-2 leading-relaxed">
                    Can people still get truly pure and natural food in today’s market?
                  </p>
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80"
                  alt="Organic farming and natural produce"
                  className="rounded-2xl shadow-lg w-full h-[320px] md:h-[420px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="sticky top-[112px] md:top-[112px] z-20 -mx-4 sm:-mx-6 lg:mx-0 mb-10">
          <div className="bg-white/80 backdrop-blur border-y lg:rounded-2xl lg:border lg:shadow-sm px-4 sm:px-6 lg:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-900 hidden md:block">Quick Navigation</p>
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
                {quickNav.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => scrollToId(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                Back to top
              </Button>
            </div>
          </div>
        </div>

        {/* Philosophy */}
        <section id="philosophy" className="pb-14 md:pb-20 scroll-mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-bold text-gray-900">Our Philosophy</h2>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Today, almost every product claims to be “organic” and “pure”.
                <br />
                But real quality is built with intention, not marketing.
              </p>
              <div className="mt-6 rounded-2xl border bg-amber-50/60 p-6">
                <p className="text-gray-900 font-semibold leading-relaxed">
                  The food we give to our customers should be the same quality we would proudly
                  serve to our own family.
                </p>
                <p className="mt-2 text-gray-700">That belief guides every decision we make.</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {principles.map((p, index) => {
                  const IconComponent = p.icon;
                  return (
                    <Card key={index} className="border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                            <p className="mt-1 text-gray-700 leading-relaxed">{p.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section id="story" className="pb-14 md:pb-20 scroll-mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=1400&q=80"
                alt="Traditional cold-pressed oil production"
                className="rounded-2xl shadow-lg w-full h-[320px] md:h-[420px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
              <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Rajyadu Organic Food started as a small family initiative with a clear vision —
                  to bring traditional food practices back into modern, hygienic and responsible
                  production.
                </p>
                <p>
                  We work closely with trusted raw-material sources and farmers to ensure
                  consistency and authenticity at every step.
                </p>
                <p>
                  Every batch is carefully monitored and checked before packaging, because for us,
                  trust is more important than volume.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section id="offerings" className="pb-14 md:pb-20 scroll-mt-28">
          <div className="rounded-3xl border bg-neutral-50/60 p-8 md:p-12">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-gray-900">What We Offer</h2>
            </div>
            <p className="mt-4 text-gray-700 leading-relaxed max-w-3xl">
              At Rajyadu Organic Food, we proudly offer:
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {offerings.map((item, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-white border flex items-center justify-center shrink-0">
                        <Leaf className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-gray-900 font-medium leading-relaxed">{item}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mt-8 text-gray-700 leading-relaxed">
              We continue to expand our product range, but one thing will always remain the same —
              our commitment to quality.
            </p>
          </div>
        </section>

        {/* Our Oils */}
        <section id="oils" className="pb-14 md:pb-20 scroll-mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <Droplets className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold text-gray-900">Our Oils – More Than Just a Product</h2>
              </div>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Our oils are produced using traditional cold-pressed methods to help preserve:
              </p>
              <div className="mt-6 space-y-3">
                {oilBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-gray-900 font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <Card className="border shadow-sm">
                <CardContent className="p-8">
                  <p className="text-gray-700 leading-relaxed">
                    We avoid excessive heat and aggressive refining processes to maintain the true
                    character of every seed and ingredient.
                  </p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    We do not claim to be the cheapest brand in the market — but we proudly stand
                    behind the value and integrity of our products.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Commitment */}
        <section id="commitment" className="pb-14 md:pb-20 scroll-mt-28">
          <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-neutral-50 border p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Commitment to You</h2>
            <p className="mt-4 text-gray-700 leading-relaxed max-w-3xl">
              At Rajyadu Organic Food, our promise is simple and transparent:
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {promises.map((p, index) => (
                <Card key={index} className="border-0 shadow-sm bg-white/70">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <p className="text-gray-900 font-semibold">{p}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mt-8 text-gray-700 leading-relaxed">
              If a product is not genuinely natural, we do not present it as one.
            </p>
          </div>
        </section>

        {/* Customers */}
        <div className="pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold text-gray-900">Our Customers Are Our Family</h2>
              </div>
              <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">
                <p>
                  To us, our customers are not just order numbers.
                </p>
                <p>
                  Every message, review and repeat purchase reminds us that someone has trusted
                  us to serve their family. That trust is our greatest responsibility.
                </p>
                <p className="text-gray-900 font-semibold">
                  Why choose Rajyadu Organic Food?
                </p>
                <p>
                  Because we don’t only deliver products — we deliver peace of mind and confidence
                  in what you consume.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card className="border shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <HandHeart className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-gray-900">Rajyadu Organic Food</h3>
                  </div>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Pure. Honest. From our family to yours.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pb-16">
          <div className="rounded-3xl border bg-white shadow-sm p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-gray-900">Ready to experience pure, honest food?</h2>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  Explore our cold pressed oils and traditional products — made with care, checked batch by batch,
                  and delivered with responsibility.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto btn-primary">
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto btn-secondary">
                  <Link href="/">Explore Products</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
