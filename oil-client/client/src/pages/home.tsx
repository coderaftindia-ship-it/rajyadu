import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProductCard from "@/components/product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BadgeCheck, FileText, FlaskConical } from "lucide-react";
import type { Product, Category, Slider, Certificate } from "@/lib/types";
import { oliAssetUrl, oliGetJson, oliUrl } from "@/lib/oliApi";

export default function Home() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [sliderApi, setSliderApi] = useState<CarouselApi | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: [oliUrl("/api/categories")],
    queryFn: () => oliGetJson<Category[]>("/api/categories"),
  });

  const { data: sliders, isLoading: slidersLoading } = useQuery<Slider[]>({
    queryKey: [oliUrl("/api/sliders")],
    queryFn: () => oliGetJson<Slider[]>("/api/sliders"),
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: [oliUrl("/api/certificates")],
    queryFn: () => oliGetJson<Certificate[]>("/api/certificates"),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [oliUrl("/api/products")],
    queryFn: () => oliGetJson<Product[]>("/api/products"),
  });

  const featuredProducts = products.filter((p) => p.featured);
  const bestsellerProducts = products.filter((p) => p.bestseller);
  const newLaunchProducts = products.filter((p) => p.newLaunch);

  const { labCert, fssaiCert } = useMemo(() => {
    const byCertType = new Map<string, Certificate>();
    for (const c of certificates) {
      byCertType.set(String(c.type || ""), c);
    }
    return {
      labCert: byCertType.get("LAB_TEST"),
      fssaiCert: byCertType.get("FSSAI"),
    };
  }, [certificates]);

  const openPreview = (url: string, title: string) => {
    setPreviewTitle(title);
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const categoryImages = {
    skincare: "https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    haircare: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    makeup: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    bodycare: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
  };

  const categoryGradients = {
    skincare: "gradient-pink",
    haircare: "gradient-blue", 
    makeup: "gradient-purple",
    bodycare: "gradient-green"
  };

  useEffect(() => {
    if (!sliderApi) return;
    const id = window.setInterval(() => {
      try {
        sliderApi.scrollNext();
      } catch {
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [sliderApi]);

  return (
    <div>
      {/* Static Slider */}
      <section className="bg-white">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="overflow-hidden rounded-2xl bg-muted shadow-sm">
            {slidersLoading ? (
              <Skeleton className="h-[220px] w-full sm:h-[280px] lg:h-[340px]" />
            ) : (
              <Carousel
                className="h-[220px] w-full sm:h-[280px] lg:h-[340px]"
                opts={{ loop: true }}
                setApi={(api) => setSliderApi(api)}
              >
                <CarouselContent className="h-[220px] w-full !ml-0 sm:h-[280px] lg:h-[340px]">
                  {(sliders && sliders.length > 0
                    ? sliders
                    : ([
                        {
                          id: 0,
                          title: "Promotional banner",
                          imageUrl:
                            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=500",
                        } as unknown as Slider,
                      ] as Slider[])
                  ).map((s, idx) => (
                    <CarouselItem
                      key={(s as any)?.id ?? idx}
                      className="h-[220px] !pl-0 sm:h-[280px] lg:h-[340px]"
                    >
                      <img
                        src={oliAssetUrl((s as any)?.imageUrl) ?? (s as any)?.imageUrl}
                        alt={(s as any)?.title ?? "Promotional banner"}
                        className="h-full w-full  object-center"
                        loading="lazy"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2" />
                <CarouselNext className="right-3 top-1/2 -translate-y-1/2" />
              </Carousel>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our complete range of RAJYADU products
            </p>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories?.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className="category-card">
                    <div className={`aspect-square overflow-hidden rounded-2xl p-6 hover:shadow-lg transition-shadow ${categoryGradients[category.slug as keyof typeof categoryGradients] || 'bg-gray-100'}`}>
                      <img
                        src={
                          oliAssetUrl(category.imageUrl) ??
                          categoryImages[category.slug as keyof typeof categoryImages] ??
                          undefined
                        }
                        alt={category.name}
                        className="category-image w-full h-full rounded-xl  object-center"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-center mt-4 group-hover:text-red-500 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Launch Section */}
      {newLaunchProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">New Launches</h2>
              <p className="text-gray-600">Our latest additions to the family</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newLaunchProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Our newest and most innovative products</p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bestsellers</h2>
            <p className="text-gray-600">Our most loved products by customers</p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            {categoriesLoading ? (
              <Skeleton className="h-12 w-48 mx-auto" />
            ) : (
              <Link href={categories && categories.length > 0 ? `/category/${categories[0].slug}` : "#"}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="btn-secondary"
                  disabled={!categories || categories.length === 0}
                >
                  View All Products →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We back our quality with transparency and certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <FlaskConical className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Lab Tested Products</h3>
                    <p className="mt-1 text-gray-600 leading-relaxed">
                      Every batch is checked to ensure purity and quality.
                    </p>
                    <div className="mt-4">
                      {labCert?.fileUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-secondary inline-flex items-center gap-2"
                          onClick={() => {
                            const url = oliAssetUrl(labCert.fileUrl);
                            if (!url) return;
                            openPreview(url, labCert.title || "Lab Tested Products");
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Preview
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500">Certificate coming soon</div>
                      )}
                    </div>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">FSSAI Certified</h3>
                    <p className="mt-1 text-gray-600 leading-relaxed">
                      Certified for food safety and responsible standards.
                    </p>
                    <div className="mt-4">
                      {fssaiCert?.fileUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-secondary inline-flex items-center gap-2"
                          onClick={() => {
                            const url = oliAssetUrl(fssaiCert.fileUrl);
                            if (!url) return;
                            openPreview(url, fssaiCert.title || "FSSAI Certified");
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Preview
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500">Certificate coming soon</div>
                      )}
                    </div>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewUrl(null);
            setPreviewTitle("");
          }
        }}
      >
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle>{previewTitle || "Certificate"}</DialogTitle>
              <DialogDescription>Preview only</DialogDescription>
            </DialogHeader>
          </div>
          <div className="h-[75vh] w-full bg-muted relative">
            {/* Transparent overlay to prevent right-click and some interactions */}
            <div 
              className="pdf-overlay" 
              onContextMenu={(e) => e.preventDefault()}
            />
            {previewUrl ? (
              <iframe
                title={previewTitle || "Certificate"}
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="h-full w-full relative z-0"
                style={{ border: 'none' }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
