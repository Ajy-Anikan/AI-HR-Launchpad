import { Building2, Search, Star, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const featuredCompanies = [
  { name: "Google", industry: "Technology", employees: "150,000+", location: "Mountain View, CA", rating: 4.5 },
  { name: "Microsoft", industry: "Technology", employees: "180,000+", location: "Redmond, WA", rating: 4.4 },
  { name: "Amazon", industry: "E-commerce", employees: "1,500,000+", location: "Seattle, WA", rating: 3.9 },
  { name: "Apple", industry: "Technology", employees: "160,000+", location: "Cupertino, CA", rating: 4.3 },
  { name: "Meta", industry: "Social Media", employees: "70,000+", location: "Menlo Park, CA", rating: 4.1 },
  { name: "Netflix", industry: "Entertainment", employees: "12,000+", location: "Los Gatos, CA", rating: 4.2 },
];

export default function CompanyPrepHub() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Company Prep Hub</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Research companies, understand their culture, and prepare for specific interviews.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
            className="pl-12 h-14 text-lg rounded-xl"
          />
        </div>
      </div>

      {/* Featured Companies */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Featured Companies</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCompanies.map((company) => (
            <Card key={company.name} className="card-hover cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {company.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{company.rating}</span>
                  </div>
                </div>
                <CardTitle className="mt-4">{company.name}</CardTitle>
                <CardDescription>{company.industry}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {company.employees}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
